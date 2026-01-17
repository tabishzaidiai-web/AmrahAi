

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
  tone: 'professional' | 'energetic' | 'minimal' | 'luxury';
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
  defaultPromptFragment: string; // The locked visual identity text
  showcase: {
    category: string;
    url: string;
  }[];
  isPersonal?: boolean;
}

export type ShootUseCase = 
  | 'Clothing photoshoot' 
  | 'Jewelry close-up' 
  | 'Footwear lifestyle' 
  | 'Abaya editorial' 
  | 'Luxury product advertisement';

export type ProductType = 
  | 'Jewelry' 
  | 'Watch' 
  | 'Clothing' 
  | 'Bag' 
  | 'Shoes' 
  | 'Accessories' 
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

export type ProductPlacement = 
  | 'On ear' 
  | 'On neck' 
  | 'On wrist' 
  | 'On finger' 
  | 'On chest' 
  | 'On shoulder' 
  | 'Full body' 
  | 'Handheld' 
  | 'On table';

export type LogoPlacement = 
  | 'Top-right corner'
  | 'Top-left corner'
  | 'Bottom-center'
  | 'Background watermark'
  | 'Chest' 
  | 'Center front' 
  | 'Wrist/dial center' 
  | 'Bag front';

/* Added missing types for product and camera configuration used in GeminiService */
export type LuxuryStyle = 
  | 'Standard'
  | 'Signature Jewel Close-Up'
  | 'Editorial Portrait With Jewel'
  | 'Curated Display Board'
  | 'Precision Timepiece Focus';

export type CameraAngle = 'Standard' | 'Birds-eye' | 'Low-angle' | 'Side-profile' | 'Macro';
export type CameraMotion = 'Static' | 'Slow Pan' | 'Zoom In' | 'Orbit' | 'Tilt';

export interface ProductDetails {
  category: ProductCategory;
  type: ProductType;
  approxSize: string;
  placement: ProductPlacement;
  addLogo: boolean;
  logoPlacement: LogoPlacement;
  /* Added optional properties for enhanced generation control */
  luxuryStyle?: LuxuryStyle;
  cameraAngle?: CameraAngle;
  cameraMotion?: CameraMotion;
}

export interface PromptTemplate {
  id: string;
  category: string;
  label: string;
  promptTemplate: string;
  supportsLogo: boolean;
}

/* Added configuration interfaces for photoshoot and personal models */
export interface ShootConfig {
  model: ModelPersona | null;
  productImage: string; // base64 encoded
  useCase: ShootUseCase;
  productDetails: ProductDetails;
}

export interface PersonalModelConfig {
  id: string;
  representativePortrait: string;
  dataset: string[];
  createdAt: number;
}
