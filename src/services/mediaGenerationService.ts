import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { isFirestoreAvailableForUser, createAsset, updateAsset, getAsset } from './mediaAssetService';
import { mediaProviderRegistry } from './mediaProviderRegistry';
import type { MediaProviderDomain } from '../types/mediaProvider';
import type {
  MediaGenerationJob,
  MediaJobStatus,
  CreateGenerationJobParams,
  MediaJobFilter,
} from '../types/mediaGenerationJob';

const LOCAL_STORAGE_KEY_PREFIX = 'creova_generation_jobs_';

function getLocalStorageKey(userId?: string): string {
  return `${LOCAL_STORAGE_KEY_PREFIX}${userId || 'guest'}`;
}

function loadLocalJobs(userId?: string): MediaGenerationJob[] {
  try {
    const raw = localStorage.getItem(getLocalStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse local generation jobs:', err);
    return [];
  }
}

function saveLocalJobs(jobs: MediaGenerationJob[], userId?: string): void {
  try {
    localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(jobs));
  } catch (err) {
    console.warn('Failed to save local generation jobs:', err);
  }
}

function normalizeGenerationJob(data: Partial<MediaGenerationJob>): MediaGenerationJob {
  const now = new Date().toISOString();
  const id = data.id || data.jobId || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    jobId: id,
    projectId: data.projectId,
    scriptId: data.scriptId,
    sceneId: data.sceneId,
    sceneNumber: typeof data.sceneNumber === 'number' ? data.sceneNumber : undefined,
    assetId: data.assetId,
    type: data.type || 'image',
    provider: data.provider || 'default-pipeline',
    status: data.status || 'queued',
    prompt: data.prompt || '',
    progress: typeof data.progress === 'number' ? data.progress : 0,
    error: data.error,
    metadata: data.metadata || {},
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };
}

/**
 * Maps MediaAssetType to MediaProviderDomain
 */
export function mapTypeToProviderDomain(type: string): MediaProviderDomain {
  switch (type) {
    case 'image':
      return 'image';
    case 'video':
    case 'b-roll':
      return 'video';
    case 'voiceover':
      return 'tts';
    case 'music':
      return 'music';
    case 'sound-effect':
    case 'audio':
      return 'sfx';
    default:
      return 'image';
  }
}

/**
 * MediaGenerationService
 * Centralized service managing the lifecycle of background generation jobs,
 * tracking progress, handling failures, and coordinating with MediaAsset records.
 */
class MediaGenerationService {
  /**
   * Create and register a new media generation job
   */
  public async createJob(
    params: CreateGenerationJobParams,
    userId?: string
  ): Promise<MediaGenerationJob> {
    const effectiveUserId = userId || 'guest';

    // 1. Validation: Prompt cannot be empty
    if (!params.prompt || !params.prompt.trim()) {
      throw new Error('Invalid prompt: Generation prompt cannot be empty.');
    }

    const now = new Date().toISOString();
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const domain = mapTypeToProviderDomain(params.type);
    const providerId =
      params.provider ||
      mediaProviderRegistry.getDefaultProviderForDomain(domain)?.id ||
      `future-${domain}-provider`;

    // 2. Connect to or create corresponding MediaAsset
    let linkedAssetId = params.assetId;

    if (!linkedAssetId) {
      try {
        const newAsset = await createAsset(
          {
            type: params.type,
            source: 'ai-generated',
            status: 'generating',
            filename: `${params.type.toUpperCase()}_Scene_${params.sceneNumber ?? 'all'}_${jobId.substring(4, 10)}`,
            prompt: params.prompt.trim(),
            sceneNumber: params.sceneNumber,
            sceneId: params.sceneId,
            scriptId: params.scriptId,
            projectId: params.projectId,
            metadata: {
              jobId,
              provider: providerId,
              domain,
              ...params.metadata,
            },
          },
          effectiveUserId
        );
        linkedAssetId = newAsset.id;
      } catch (assetErr) {
        console.warn('Failed to pre-create connected MediaAsset:', assetErr);
      }
    } else {
      // If asset already exists, update its status to generating and preserve prompt
      try {
        await updateAsset(
          linkedAssetId,
          {
            status: 'generating',
            prompt: params.prompt.trim(),
            metadata: {
              latestJobId: jobId,
              provider: providerId,
              ...params.metadata,
            },
          },
          effectiveUserId
        );
      } catch (assetErr) {
        console.warn('Failed to update connected MediaAsset:', assetErr);
      }
    }

    // 3. Check provider availability
    // Since external generation providers are not yet implemented,
    // we determine if an active provider exists or queue the job cleanly.
    const hasConfiguredProvider =
      mediaProviderRegistry.hasProvider(providerId) &&
      mediaProviderRegistry.getProvider(providerId)?.isConfigured;

    const initialStatus: MediaJobStatus = hasConfiguredProvider ? 'processing' : 'queued';
    const initialProgress = hasConfiguredProvider ? 10 : 0;
    const initialError = hasConfiguredProvider
      ? undefined
      : `Media generation provider '${providerId}' is in standby architecture. Job queued in generation pipeline.`;

    const job: MediaGenerationJob = {
      id: jobId,
      jobId,
      projectId: params.projectId,
      scriptId: params.scriptId,
      sceneId: params.sceneId,
      sceneNumber: params.sceneNumber,
      assetId: linkedAssetId,
      type: params.type,
      provider: providerId,
      status: initialStatus,
      prompt: params.prompt.trim(),
      progress: initialProgress,
      error: initialError,
      metadata: {
        domain,
        ...params.metadata,
      },
      createdAt: now,
      updatedAt: now,
    };

    // 4. Save to local storage
    const localJobs = loadLocalJobs(effectiveUserId);
    saveLocalJobs([job, ...localJobs], effectiveUserId);

    // 5. Persist to Firestore if user is authenticated with Firebase
    if (isFirestoreAvailableForUser(effectiveUserId)) {
      try {
        const jobDocRef = doc(db!, 'users', effectiveUserId, 'generationJobs', jobId);
        await setDoc(jobDocRef, {
          ...job,
          metadata: job.metadata || {},
        });
      } catch (firestoreErr) {
        console.warn('Failed to persist generation job to Firestore, falling back to local storage:', firestoreErr);
      }
    }

    return job;
  }

  /**
   * Update the status of a generation job and synchronize connected MediaAsset
   */
  public async updateJobStatus(
    jobId: string,
    status: MediaJobStatus,
    progress?: number,
    error?: string,
    userId?: string
  ): Promise<MediaGenerationJob | null> {
    const effectiveUserId = userId || 'guest';
    const now = new Date().toISOString();

    // 1. Update local storage
    const localJobs = loadLocalJobs(effectiveUserId);
    const existingIndex = localJobs.findIndex((j) => j.id === jobId || j.jobId === jobId);
    if (existingIndex === -1) {
      console.warn(`Job ${jobId} not found in local storage.`);
    }

    const existing = existingIndex !== -1 ? localJobs[existingIndex] : null;
    const updatedJob: MediaGenerationJob = {
      ...(existing || {
        id: jobId,
        jobId,
        type: 'image',
        provider: 'default',
        prompt: '',
        createdAt: now,
      }),
      status,
      progress: typeof progress === 'number' ? progress : existing?.progress || 0,
      error: error !== undefined ? error : existing?.error,
      updatedAt: now,
    };

    if (existingIndex !== -1) {
      localJobs[existingIndex] = updatedJob;
      saveLocalJobs(localJobs, effectiveUserId);
    } else {
      saveLocalJobs([updatedJob, ...localJobs], effectiveUserId);
    }

    // 2. Synchronize connected MediaAsset status
    if (updatedJob.assetId) {
      try {
        let assetStatus = 'generating';
        if (status === 'completed') assetStatus = 'ready';
        else if (status === 'failed') assetStatus = 'failed';
        else if (status === 'cancelled') assetStatus = 'required';
        else if (status === 'queued') assetStatus = 'pending';

        await updateAsset(
          updatedJob.assetId,
          {
            status: assetStatus as any,
            updatedAt: now,
          },
          effectiveUserId
        );
      } catch (assetErr) {
        console.warn(`Failed to sync asset status for job ${jobId}:`, assetErr);
      }
    }

    // 3. Update Firestore if authenticated
    if (isFirestoreAvailableForUser(effectiveUserId)) {
      try {
        const jobDocRef = doc(db!, 'users', effectiveUserId, 'generationJobs', jobId);
        await updateDoc(jobDocRef, {
          status: updatedJob.status,
          progress: updatedJob.progress,
          error: updatedJob.error || null,
          updatedAt: now,
        });
      } catch (firestoreErr) {
        console.warn(`Failed to update job ${jobId} in Firestore:`, firestoreErr);
      }
    }

    return updatedJob;
  }

  /**
   * Update progress percentage of a generation job (0-100)
   */
  public async updateJobProgress(
    jobId: string,
    progress: number,
    userId?: string
  ): Promise<MediaGenerationJob | null> {
    const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));
    return this.updateJobStatus(
      jobId,
      clampedProgress >= 100 ? 'completed' : 'processing',
      clampedProgress,
      undefined,
      userId
    );
  }

  /**
   * Cancel an active or queued generation job
   */
  public async cancelJob(jobId: string, userId?: string): Promise<MediaGenerationJob | null> {
    return this.updateJobStatus(jobId, 'cancelled', undefined, 'Job cancelled by user.', userId);
  }

  /**
   * Mark a job as failed with a descriptive error message
   */
  public async failJob(jobId: string, error: string, userId?: string): Promise<MediaGenerationJob | null> {
    return this.updateJobStatus(jobId, 'failed', undefined, error || 'Generation failed.', userId);
  }

  /**
   * Complete a generation job and update the connected MediaAsset with real output
   */
  public async completeJob(
    jobId: string,
    result: {
      url?: string;
      thumbnailUrl?: string;
      duration?: number;
      width?: number;
      height?: number;
      metadata?: Record<string, any>;
    },
    userId?: string
  ): Promise<MediaGenerationJob | null> {
    const effectiveUserId = userId || 'guest';
    const job = await this.getJob(jobId, effectiveUserId);

    if (job?.assetId && result.url) {
      try {
        await updateAsset(
          job.assetId,
          {
            status: 'ready',
            url: result.url,
            thumbnailUrl: result.thumbnailUrl,
            duration: result.duration,
            width: result.width,
            height: result.height,
            metadata: {
              ...(job.metadata || {}),
              ...(result.metadata || {}),
            },
          },
          effectiveUserId
        );
      } catch (assetErr) {
        console.warn(`Failed to update asset ${job.assetId} with completed job output:`, assetErr);
      }
    }

    return this.updateJobStatus(jobId, 'completed', 100, undefined, userId);
  }

  /**
   * Retry a failed or cancelled generation job
   */
  public async retryJob(jobId: string, userId?: string): Promise<MediaGenerationJob | null> {
    const effectiveUserId = userId || 'guest';
    const job = await this.getJob(jobId, effectiveUserId);
    if (!job) {
      throw new Error(`Cannot retry: Job ${jobId} not found.`);
    }

    const domain = mapTypeToProviderDomain(job.type);
    const hasConfiguredProvider =
      mediaProviderRegistry.hasProvider(job.provider) &&
      mediaProviderRegistry.getProvider(job.provider)?.isConfigured;

    const newStatus: MediaJobStatus = hasConfiguredProvider ? 'processing' : 'queued';
    const newProgress = hasConfiguredProvider ? 10 : 0;
    const newError = hasConfiguredProvider
      ? undefined
      : `Media generation provider '${job.provider}' is in standby architecture. Job queued in generation pipeline.`;

    return this.updateJobStatus(jobId, newStatus, newProgress, newError, userId);
  }

  /**
   * Get a single generation job by ID
   */
  public async getJob(jobId: string, userId?: string): Promise<MediaGenerationJob | null> {
    const effectiveUserId = userId || 'guest';

    if (isFirestoreAvailableForUser(effectiveUserId)) {
      try {
        const docRef = doc(db!, 'users', effectiveUserId, 'generationJobs', jobId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return normalizeGenerationJob(snap.data() as Partial<MediaGenerationJob>);
        }
      } catch (firestoreErr) {
        console.warn(`Failed to fetch job ${jobId} from Firestore, falling back to local:`, firestoreErr);
      }
    }

    const localJobs = loadLocalJobs(effectiveUserId);
    return localJobs.find((j) => j.id === jobId || j.jobId === jobId) || null;
  }

  /**
   * List generation jobs with optional filtering
   */
  public async listJobs(filter?: MediaJobFilter, userId?: string): Promise<MediaGenerationJob[]> {
    const effectiveUserId = userId || 'guest';
    let results: MediaGenerationJob[] = [];

    if (isFirestoreAvailableForUser(effectiveUserId)) {
      try {
        const jobsRef = collection(db!, 'users', effectiveUserId, 'generationJobs');
        const q = filter?.projectId
          ? query(jobsRef, where('projectId', '==', filter.projectId))
          : jobsRef;
        const snap = await getDocs(q);
        results = snap.docs.map((d) => normalizeGenerationJob(d.data() as Partial<MediaGenerationJob>));
      } catch (firestoreErr) {
        console.warn('Failed to list generation jobs from Firestore, falling back to local storage:', firestoreErr);
      }
    }

    // Fall back or merge with local storage
    if (results.length === 0) {
      results = loadLocalJobs(effectiveUserId);
    }

    // Apply filters
    if (!filter) return results;

    return results.filter((job) => {
      if (filter.scriptId && job.scriptId !== filter.scriptId) return false;
      if (filter.projectId && job.projectId !== filter.projectId) return false;
      if (filter.type && filter.type !== 'all' && job.type !== filter.type) return false;
      if (filter.status && filter.status !== 'all' && job.status !== filter.status) return false;
      if (
        typeof filter.sceneNumber === 'number' &&
        filter.sceneNumber !== ('all' as any) &&
        job.sceneNumber !== filter.sceneNumber
      ) {
        return false;
      }
      if (filter.query && filter.query.trim()) {
        const q = filter.query.toLowerCase().trim();
        const matchesPrompt = job.prompt?.toLowerCase().includes(q);
        const matchesId = job.id?.toLowerCase().includes(q);
        const matchesProvider = job.provider?.toLowerCase().includes(q);
        if (!matchesPrompt && !matchesId && !matchesProvider) return false;
      }
      return true;
    });
  }

  /**
   * Delete a generation job
   */
  public async deleteJob(jobId: string, userId?: string): Promise<boolean> {
    const effectiveUserId = userId || 'guest';

    const localJobs = loadLocalJobs(effectiveUserId);
    const filtered = localJobs.filter((j) => j.id !== jobId && j.jobId !== jobId);
    saveLocalJobs(filtered, effectiveUserId);

    if (isFirestoreAvailableForUser(effectiveUserId)) {
      try {
        const docRef = doc(db!, 'users', effectiveUserId, 'generationJobs', jobId);
        await deleteDoc(docRef);
      } catch (firestoreErr) {
        console.warn(`Failed to delete generation job ${jobId} from Firestore:`, firestoreErr);
      }
    }

    return true;
  }

  /**
   * Real-time subscription to generation jobs
   */
  public subscribeToJobs(
    userId: string,
    onUpdate: (jobs: MediaGenerationJob[]) => void
  ): () => void {
    if (isFirestoreAvailableForUser(userId)) {
      try {
        const jobsColRef = collection(db!, 'users', userId, 'generationJobs');
        return onSnapshot(
          jobsColRef,
          (snapshot) => {
            const jobs = snapshot.docs.map((d) =>
              normalizeGenerationJob(d.data() as Partial<MediaGenerationJob>)
            );
            // Sort by createdAt descending
            jobs.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            saveLocalJobs(jobs, userId);
            onUpdate(jobs);
          },
          (err) => {
            console.warn('Firestore generation jobs subscription error, falling back to local:', err);
            onUpdate(loadLocalJobs(userId));
          }
        );
      } catch (err) {
        console.warn('Failed to attach Firestore generation jobs listener:', err);
      }
    }

    // Fallback for guest or offline mode
    const local = loadLocalJobs(userId);
    local.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    onUpdate(local);
    return () => {};
  }
}

export const mediaGenerationService = new MediaGenerationService();
