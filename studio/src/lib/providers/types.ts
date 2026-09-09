/**
 * Model-agnostic provider contracts.
 *
 * Every AI capability the product depends on is expressed here as an interface.
 * Concrete vendors (FASHN, Seedream, Kling, ...) implement these and are selected
 * at runtime by the registry, so replacing a vendor never touches pipeline code.
 */

export type Tier = 'free' | 'starter' | 'pro' | 'scale' | 'enterprise';

/** Where a job is allowed to run. Enterprise buyers can forbid CN-region routing. */
export type RoutingPolicy = 'any' | 'western-only';

export interface ProviderMeta {
  id: string;
  name: string;
  /** Vendor's region of processing, used to honour RoutingPolicy. */
  region: 'us' | 'eu' | 'cn' | 'global';
  /** USD. Per image for image/try-on providers, per second for video providers. */
  unitCost: number;
}

export interface GarmentRef {
  /** Publicly readable URL of the garment image. */
  url: string;
  view: 'front' | 'back';
  category: 'top' | 'bottom' | 'one-piece';
}

export interface ModelPersona {
  /** Stable reference image locking the model's identity across a collection. */
  referenceUrl: string;
  bodyProfile: string;
  skinTone?: string;
}

export interface TryOnInput {
  garment: GarmentRef;
  person: ModelPersona;
  /** Longest-edge pixels requested from the vendor. */
  resolution?: number;
}

export interface ImageGenInput {
  prompt: string;
  /** Reference images blended to hold identity and garment detail. */
  references: string[];
  aspectRatio: '1:1' | '3:4' | '4:5' | '9:16' | '16:9';
  resolution?: number;
}

export interface VideoGenInput {
  /** First frame. Always an already-validated still, so the garment cannot drift. */
  imageUrl: string;
  prompt: string;
  durationSeconds: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
}

export interface GenerationResult {
  url: string;
  providerId: string;
  /** USD actually incurred, recorded per generation for margin tracking. */
  cost: number;
  latencyMs: number;
}

export interface TryOnProvider extends ProviderMeta {
  kind: 'tryon';
  run(input: TryOnInput): Promise<GenerationResult>;
}

export interface ImageProvider extends ProviderMeta {
  kind: 'image';
  run(input: ImageGenInput): Promise<GenerationResult>;
}

export interface VideoProvider extends ProviderMeta {
  kind: 'video';
  run(input: VideoGenInput): Promise<GenerationResult>;
}

export type Provider = TryOnProvider | ImageProvider | VideoProvider;
