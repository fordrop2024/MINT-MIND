import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
} from '../firebase/config';
import type { MediaAsset, MediaAssetType, MediaAssetStatus, MediaAssetSource } from '../types/mediaAsset';

const LOCAL_STORAGE_KEY_PREFIX = 'creova_media_assets_';

/**
 * Checks if Firestore should be queried for the specified user.
 * Returns true only if Firebase is configured, db is initialized,
 * the user is actively authenticated via Firebase Auth, and the UID matches.
 */
export function isFirestoreAvailableForUser(userId?: string | null): boolean {
  if (!isFirebaseConfigured || !db || !auth) return false;
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) return false;
  if (!userId || userId === 'guest' || userId.startsWith('guest_') || userId.startsWith('guest')) {
    return false;
  }
  return currentUid === userId;
}

function getLocalStorageKey(userId?: string): string {
  return `${LOCAL_STORAGE_KEY_PREFIX}${userId || 'guest'}`;
}

function loadLocalAssets(userId?: string): MediaAsset[] {
  try {
    const raw = localStorage.getItem(getLocalStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse local media assets:', err);
    return [];
  }
}

function saveLocalAssets(assets: MediaAsset[], userId?: string): void {
  try {
    localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(assets));
  } catch (err) {
    console.warn('Failed to save local media assets:', err);
  }
}

/**
 * Normalizes a media asset guaranteeing all required properties are populated
 */
export function normalizeMediaAsset(raw: Partial<MediaAsset>): MediaAsset {
  const now = new Date().toISOString();
  const id = raw.id || raw.assetId || `asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  return {
    id,
    assetId: id,
    projectId: raw.projectId,
    scriptId: raw.scriptId,
    sceneId: raw.sceneId,
    sceneNumber: typeof raw.sceneNumber === 'number' ? raw.sceneNumber : undefined,
    type: (raw.type as MediaAssetType) || 'image',
    source: (raw.source as MediaAssetSource) || 'manual',
    status: (raw.status as MediaAssetStatus) || 'required',
    filename: raw.filename || `Asset_${id.slice(-6)}`,
    url: raw.url,
    path: raw.path,
    thumbnailUrl: raw.thumbnailUrl || (raw.type === 'image' ? raw.url : undefined),
    duration: typeof raw.duration === 'number' ? raw.duration : undefined,
    width: typeof raw.width === 'number' ? raw.width : undefined,
    height: typeof raw.height === 'number' ? raw.height : undefined,
    aspectRatio: raw.aspectRatio || '16:9',
    prompt: raw.prompt || '',
    metadata: raw.metadata || {},
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
  };
}

/**
 * Creates and stores a new media asset
 */
export async function createAsset(
  assetData: Partial<MediaAsset>,
  userId?: string
): Promise<MediaAsset> {
  const asset = normalizeMediaAsset(assetData);
  const effectiveUserId = userId || 'guest';

  // 1. Write to local storage fallback
  const localList = loadLocalAssets(effectiveUserId);
  const updatedLocal = [asset, ...localList.filter((a) => a.id !== asset.id)];
  saveLocalAssets(updatedLocal, effectiveUserId);

  // 2. Persist to Firestore if authenticated
  if (isFirestoreAvailableForUser(effectiveUserId)) {
    const docPath = `users/${effectiveUserId}/mediaAssets/${asset.id}`;
    try {
      const docRef = doc(db!, 'users', effectiveUserId, 'mediaAssets', asset.id);
      await setDoc(docRef, {
        ...asset,
        metadata: asset.metadata || {},
      });
    } catch (err) {
      console.error('Failed to create media asset in Firestore:', err);
      handleFirestoreError(err, OperationType.CREATE, docPath);
    }
  }

  return asset;
}

/**
 * Retrieves a media asset by ID
 */
export async function getAsset(assetId: string, userId?: string): Promise<MediaAsset | null> {
  const effectiveUserId = userId || 'guest';

  if (isFirestoreAvailableForUser(effectiveUserId)) {
    try {
      const docRef = doc(db!, 'users', effectiveUserId, 'mediaAssets', assetId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return normalizeMediaAsset(snap.data() as Partial<MediaAsset>);
      }
    } catch (err) {
      console.warn(`Failed to fetch media asset ${assetId} from Firestore, falling back to local:`, err);
    }
  }

  const localList = loadLocalAssets(effectiveUserId);
  const found = localList.find((a) => a.id === assetId || a.assetId === assetId);
  return found ? normalizeMediaAsset(found) : null;
}

/**
 * Updates an existing media asset
 */
export async function updateAsset(
  assetId: string,
  updates: Partial<MediaAsset>,
  userId?: string
): Promise<MediaAsset> {
  const effectiveUserId = userId || 'guest';
  const existing = (await getAsset(assetId, effectiveUserId)) || normalizeMediaAsset({ id: assetId });

  const merged: MediaAsset = {
    ...existing,
    ...updates,
    id: existing.id,
    assetId: existing.id,
    updatedAt: new Date().toISOString(),
  };

  // Update local storage
  const localList = loadLocalAssets(effectiveUserId);
  const updatedLocal = localList.map((a) => (a.id === assetId || a.assetId === assetId ? merged : a));
  if (!updatedLocal.some((a) => a.id === assetId)) {
    updatedLocal.unshift(merged);
  }
  saveLocalAssets(updatedLocal, effectiveUserId);

  // Update Firestore if authenticated
  if (isFirestoreAvailableForUser(effectiveUserId)) {
    try {
      const docRef = doc(db!, 'users', effectiveUserId, 'mediaAssets', assetId);
      await updateDoc(docRef, {
        ...merged,
      });
    } catch (err) {
      console.warn(`Failed to update media asset ${assetId} in Firestore:`, err);
    }
  }

  return merged;
}

/**
 * Deletes a media asset
 */
export async function deleteAsset(assetId: string, userId?: string): Promise<boolean> {
  const effectiveUserId = userId || 'guest';

  // Delete from local storage
  const localList = loadLocalAssets(effectiveUserId);
  const filtered = localList.filter((a) => a.id !== assetId && a.assetId !== assetId);
  saveLocalAssets(filtered, effectiveUserId);

  // Delete from Firestore if authenticated
  if (isFirestoreAvailableForUser(effectiveUserId)) {
    try {
      const docRef = doc(db!, 'users', effectiveUserId, 'mediaAssets', assetId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn(`Failed to delete media asset ${assetId} from Firestore:`, err);
    }
  }

  return true;
}

/**
 * Retrieves all media assets for a project or user
 */
export async function getProjectAssets(
  projectId?: string,
  userId?: string
): Promise<MediaAsset[]> {
  const effectiveUserId = userId || 'guest';
  let results: MediaAsset[] = [];

  // Query Firestore only if the user is truly authenticated with Firebase Auth
  if (isFirestoreAvailableForUser(effectiveUserId)) {
    try {
      const assetsRef = collection(db!, 'users', effectiveUserId, 'mediaAssets');
      const q = projectId ? query(assetsRef, where('projectId', '==', projectId)) : assetsRef;
      const snap = await getDocs(q);
      results = snap.docs.map((d) => normalizeMediaAsset(d.data() as Partial<MediaAsset>));
    } catch (err) {
      console.warn('Failed to list media assets from Firestore, falling back to local storage:', err);
    }
  }

  if (results.length === 0) {
    const local = loadLocalAssets(effectiveUserId);
    results = projectId ? local.filter((a) => a.projectId === projectId) : local;
  }

  return results.map(normalizeMediaAsset);
}

/**
 * Retrieves all media assets associated with a specific script
 */
export async function getScriptAssets(
  scriptId: string,
  userId?: string
): Promise<MediaAsset[]> {
  const all = await getProjectAssets(undefined, userId);
  return all.filter((a) => a.scriptId === scriptId);
}

/**
 * Retrieves media assets associated with a scene
 */
export async function getSceneAssets(
  sceneNumber: number,
  scriptId?: string,
  userId?: string
): Promise<MediaAsset[]> {
  const all = await getProjectAssets(undefined, userId);
  return all.filter((a) => {
    const sceneMatch = a.sceneNumber === sceneNumber;
    return scriptId ? sceneMatch && a.scriptId === scriptId : sceneMatch;
  });
}

/**
 * Attaches a media asset to a specific scene
 */
export async function attachAssetToScene(
  assetId: string,
  sceneNumber: number,
  scriptId?: string,
  userId?: string
): Promise<MediaAsset> {
  return await updateAsset(
    assetId,
    {
      sceneNumber,
      scriptId: scriptId || undefined,
    },
    userId
  );
}

/**
 * Detaches a media asset from its scene
 */
export async function detachAssetFromScene(
  assetId: string,
  _sceneNumber?: number,
  _scriptId?: string,
  userId?: string
): Promise<MediaAsset> {
  return await updateAsset(
    assetId,
    {
      sceneNumber: undefined,
      sceneId: undefined,
    },
    userId
  );
}
