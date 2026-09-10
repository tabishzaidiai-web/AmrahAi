/**
 * Model-agnostic provider contracts.
 *
 * Every AI capability the product depends on is expressed here as an interface.
 * Concrete vendors implement these and are chosen at runtime by the registry,
 * so replacing a vendor never reaches pipeline code.
 */

export type Tier = 'free' | 'starter' | 'pro' | 'scale' | 'enterprise';

/** Where a job may run. Brands with unreleased collections can require that
 *  their designs never leave US/EU processing. */
export type RoutingPolicy = 'any' | 'western-only';

export interface ProviderMeta {
  id: string;
  name: string;
  region: 'us' | 'eu' | 'cn' | 'global';
  /** USD. Per image for image and try-on providers, per second for video. */
  unitCost: number;
}

/** Fixed camera positions the house model is held in. */
export type PoseId = 'front' | 'back' | 'three-quarter' | 'lifestyle';

export interface GarmentRef {
  /** Base64-encoded garment image. */
  data: string;
  mimeType: string;
  view: 'front' | 'back';
  category: 'top' | 'bottom' | 'one-piece';
}

export interface ModelPersona {
  /**
   * The same person captured once per pose. Try-on runs separately against each,
   * so every angle anchors to the original garment rather than inheriting drift
   * from a previously generated angle.
   */
  poses: Partial<Record<PoseId, string>>;
  bodyProfile: string;
}

export interface TryOnInput {
  garment: GarmentRef;
  /** Base64 person image for this pose. */
  personImage: string;
  personMimeType: string;
}

export interface ImageGenInput {
  prompt: string;
  /** Base64 reference images that hold garment and identity. */
  references: { data: string; mimeType: string }[];
  aspectRatio: '1:1' | '3:4' | '4:5' | '9:16' | '16:9';
}

export interface VideoGenInput {
  /** First frame: always an already-approved still, so the garment cannot drift
   *  across frames. */
  image: { data: string; mimeType: string };
  prompt: string;
  durationSeconds: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
  /** How long the caller can afford to wait for a submission slot before the
   *  clip should be left for a later run. */
  waitBudgetMs?: number;
}

/** Images are returned as bytes because the pipeline must inspect, crop and
 *  stamp them before anything is stored or shown. */
export interface ImageResult {
  image: Buffer;
  providerId: string;
  cost: number;
  latencyMs: number;
}

export interface VideoResult {
  /** Storage URI produced by the provider. */
  uri: string;
  providerId: string;
  cost: number;
  latencyMs: number;
}

export interface TryOnProvider extends ProviderMeta {
  kind: 'tryon';
  run(input: TryOnInput): Promise<ImageResult>;
}

export interface ImageProvider extends ProviderMeta {
  kind: 'image';
  run(input: ImageGenInput): Promise<ImageResult>;
}

export interface VideoProvider extends ProviderMeta {
  kind: 'video';
  run(input: VideoGenInput): Promise<VideoResult>;
}

export type Provider = TryOnProvider | ImageProvider | VideoProvider;
