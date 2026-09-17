import type { IMediaProvider, MediaProviderDomain, MediaGenerationRequest, MediaGenerationResult } from '../types/mediaProvider';

/**
 * MediaProviderRegistry
 * Future-ready media generation provider abstraction.
 * Decoupled from the text LLM provider registry to allow independent lifecycle
 * for future image, video, voice synthesis, and audio providers.
 */
class MediaProviderRegistryService {
  private providers: Map<string, IMediaProvider> = new Map();

  /**
   * Register a new media generation provider
   */
  public registerProvider(provider: IMediaProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Retrieve a provider by ID
   */
  public getProvider(id: string): IMediaProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * List all registered providers
   */
  public getAllProviders(): IMediaProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * List providers by creative domain (e.g. 'image', 'video', 'tts', 'music', 'sfx')
   */
  public getProvidersByDomain(domain: MediaProviderDomain): IMediaProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.domain === domain);
  }

  /**
   * Standby execution method ensuring provider readiness and error handling
   */
  public async generateMedia(request: MediaGenerationRequest): Promise<MediaGenerationResult> {
    const provider = this.providers.get(request.providerId);
    if (!provider) {
      return {
        success: false,
        error: `Media provider '${request.providerId}' is not registered. Actual media generation providers are reserved for future modules.`,
      };
    }

    if (!provider.isConfigured) {
      return {
        success: false,
        error: `Media provider '${provider.name}' is not configured.`,
      };
    }

    try {
      return await provider.generate(request);
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Media generation failed.',
      };
    }
  }
}

export const mediaProviderRegistry = new MediaProviderRegistryService();
