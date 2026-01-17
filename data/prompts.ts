
import { PromptTemplate } from '../types';

export const promptGallery: PromptTemplate[] = [
  {
    id: 'clean-studio',
    category: 'Studio',
    label: 'Clean Studio',
    promptTemplate: 'Professional photo of your product on a seamless white studio backdrop, soft diffused lighting, gentle shadow under the product, crisp high-resolution details, no props.',
    supportsLogo: true
  },
  {
    id: 'luxury-dark',
    category: 'Editorial',
    label: 'Luxury Dark',
    promptTemplate: 'Professional photo of your product on a glossy black surface with subtle reflection, dramatic side lighting, deep shadows, cinematic mood, high-end hero style.',
    supportsLogo: true
  },
  {
    id: 'lifestyle-home',
    category: 'Lifestyle',
    label: 'Lifestyle Home',
    promptTemplate: 'Professional photo of your product on a wooden table in a cozy living room, blurred background with soft decor, warm afternoon light from a window, natural feel.',
    supportsLogo: true
  },
  {
    id: 'beauty-editorial',
    category: 'Beauty',
    label: 'Beauty / Skincare',
    promptTemplate: 'Professional photo of your product on a wet glass surface with water droplets, soft pastel background, backlighting creating a gentle glow, editorial beauty campaign style.',
    supportsLogo: true
  },
  {
    id: 'jewelry-macro',
    category: 'Jewelry',
    label: 'Jewelry Close-up',
    promptTemplate: 'Professional macro photo of your jewelry on a velvet display stand, precise reflections, controlled highlights, dark blurred background, ultra-detailed textures.',
    supportsLogo: true
  },
  {
    id: 'nature-organic',
    category: 'Wellness',
    label: 'Nature / Organic',
    promptTemplate: 'Professional photo of your product on a natural stone with green leaves and soft morning light, blurred garden background, fresh organic mood.',
    supportsLogo: true
  }
];
