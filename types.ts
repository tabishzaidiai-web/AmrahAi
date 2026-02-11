
export interface MaisonFolder {
  id: string;
  name: string;
  createdAt: number;
}

export interface MaisonFile {
  id: string;
  name: string;
  folderId?: string;
  size: string;
  type: 'image' | 'video' | 'reference' | 'other';
  createdAt: number;
}

export interface MaisonNote {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface MaisonTeamMember {
  id: string;
  name: string;
  role: string;
  createdAt: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'User' | 'Admin';
  tier: 'Free' | 'Pro' | 'Boutique' | 'Atelier' | 'Maison';
  registrationDate: number;
  lastLogin: number;
  credits: {
    images: number;
    videos: number;
  };
  totalGenerated: number;
}

export type LuxuryStyle = 
  | 'Standard' 
  | 'Signature Jewel Close-Up' 
  | 'Editorial Portrait With Jewel' 
  | 'Curated Display Board' 
  | 'Precision Timepiece Focus';

export type CameraAngle = 'Standard' | 'Low Angle' | 'High Angle' | 'Bird\'s Eye' | 'Side' | 'Close-up';
export type CameraMotion = 'Static' | 'Pan Left' | 'Pan Right' | 'Tilt Up' | 'Tilt Down' | 'Zoom In' | 'Zoom Out' | 'Orbit';
export type ProductPlacement = 'On ear' | 'On neck' | 'On wrist' | 'On finger' | 'On chest' | 'On shoulder' | 'Full body' | 'Handheld' | 'On table';

export interface UsageLog {
  id: string;
  userId: string;
  userEmail: string;
  type: 'image' | 'video';
  timestamp: number;
  prompt: string;
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  price: number;
  imageCredits: number;
  videoCredits: number;
  features: string[];
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
  ageRange: string;
  style: string[];
  beautyNotes: string;
  features: string;
  mainUrl: string;
  defaultPromptFragment: string;
  showcase: {
    category: string;
    url: string;
  }[];
  isPersonal?: boolean;
}

// Added PersonalModelConfig for AI identity creation features
export interface PersonalModelConfig {
  id: string;
  representativePortrait: string;
  dataset: string[];
  createdAt: number;
}

// Added PromptTemplate for AI-driven directive suggestions
export interface PromptTemplate {
  id: string;
  category: string;
  label: string;
  promptTemplate: string;
  supportsLogo: boolean;
}

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
  renderMode?: 'product-only' | 'on-model';
}

export interface ShootConfig {
  model: ModelPersona | null;
  productImage: string;
  useCase: string;
  productDetails: ProductDetails;
}

export interface AmazonListingPrompt {
  prompt: string;
  type: string;
}

export interface AmazonListingSuite {
  listing_metadata: {
    product_identified: string;
    primary_materials: string;
    brand_color_palette: string;
  };
  amazon_suite: {
    slot_1_main: AmazonListingPrompt;
    slot_2_dimensions: AmazonListingPrompt;
    slot_3_isometric: AmazonListingPrompt;
    slot_4_back_view: AmazonListingPrompt;
    slot_5_material_detail: AmazonListingPrompt;
    slot_6_lifestyle_1: AmazonListingPrompt;
    slot_7_lifestyle_2: AmazonListingPrompt;
    slot_8_infographic: AmazonListingPrompt;
    slot_9_brand_trust: AmazonListingPrompt;
  };
}

export interface AmazonResult {
  id: string;
  prompt: string;
  url: string;
  slot: string;
  type: string;
}
