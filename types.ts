// Type definitions for the application

export type LuxuryStyle = 
  | 'Standard' 
  | 'Signature Jewel Close-Up' 
  | 'Editorial Portrait With Jewel' 
  | 'Curated Display Board' 
  | 'Precision Timepiece Focus';

export type CameraAngle = 'Standard' | 'Low Angle' | 'High Angle' | 'Bird\'s Eye' | 'Side' | 'Close-up';
export type CameraMotion = 'Static' | 'Pan Left' | 'Pan Right' | 'Tilt Up' | 'Tilt Down' | 'Zoom In' | 'Zoom Out';
export type ProductPlacement = 'On ear' | 'On neck' | 'On wrist' | 'On finger' | 'On chest' | 'On shoulder' | 'Full body' | 'Handheld' | 'On table';

export interface PersonalModelConfig {
  id: string;
  representativePortrait: string;
  dataset: string[];
  createdAt: number;
}

export interface PromptTemplate {
  id: string;
  category: string;
  label: string;
  promptTemplate: string;
  supportsLogo: boolean;
}

export interface ProductAnalysis {
  type: string;
  brand: string;
  material: string;
  colorPalette: string[];
  features: string[];
  visualFidelityKeys: string[];
}

export interface GenerationResult {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  timestamp: number;
}

export interface BrandKit {
  name: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  tone: 'Minimal' | 'Opulent' | 'Street' | 'Classic' | 'Editorial';
  primaryFont: string;
  secondaryFont: string;
  fontWeight: string;
}

export enum AppState {
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  READY = 'READY',
  GENERATING = 'GENERATING'
}

export interface ModelPersona {
  id: string;
  name: string;
  nationality: string;
  region: 'GCC' | 'Global';
  gender: 'Female' | 'Male';
  style: string[];
  mainUrl: string;
  defaultPromptFragment: string;
  showcase: {
    category: string;
    url: string;
  }[];
  isPersonal?: boolean;
}

export type ProductType = 
  | 'Jewelry' 
  | 'Watch' 
  | 'Clothing' 
  | 'Bag' 
  | 'Shoes' 
  | 'Accessories' 
  | 'Abaya' 
  | 'Abaya / Modest fashion'
  | 'Other';

export type ProductCategory = 
  | 'jewelry' 
  | 'fashion' 
  | 'watch' 
  | 'electronics' 
  | 'fragrance' 
  | 'wellness' 
  | 'other';

export type LogoPlacement = 
  | 'Chest'
  | 'Center front'
  | 'Wrist/dial center'
  | 'Bag front'
  | 'Top-right corner'
  | 'Background watermark';

export interface ProductDetails {
  category: ProductCategory;
  type: ProductType;
  approxSize: string;
  placement: ProductPlacement | string;
  addLogo: boolean;
  logoPlacement: LogoPlacement;
  videoResolution?: '720p' | '1080p';
  videoAspectRatio?: '16:9' | '9:16';
  luxuryStyle?: LuxuryStyle;
  cameraAngle?: CameraAngle;
  cameraMotion?: CameraMotion;
}

export interface ShootConfig {
  model: ModelPersona | null;
  productImage: string;
  useCase: string;
  productDetails: ProductDetails;
}

export interface PromptLibraryItem {
  id: string;
  title: string;
  description: string;
  template: string;
  category: string;
}