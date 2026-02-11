import { ModelPersona } from '../types';

/**
 * AMRAH Signature Identity Registry
 * These identities represent the absolute standard in Arabian AI visual fidelity.
 * Exclusive to the Amrah Maison.
 */
export const modelData: ModelPersona[] = [
  {
    id: 'AMRAH-SIG-01',
    name: 'Amrah Signature',
    nationality: 'Emirati',
    region: 'GCC',
    gender: 'Female',
    ageRange: '22-26',
    style: ['Haute Abaya', 'High Jewelry', 'Royal Editorial'],
    beautyNotes: 'The archetype of modern Arabian elegance. Timeless features with a regal, commanding presence.',
    features: 'Symmetrical oval face, luminous olive skin, deep almond-shaped dark eyes, refined profile. Captures the essence of Gulf luxury.',
    mainUrl: 'Amrah.png',
    defaultPromptFragment: 'Emirati woman, signature Amrah identity, symmetrical oval face, glowing olive skin, almond eyes, royal editorial posture, modest luxury styling.',
    showcase: []
  },
  {
    id: 'AMRAH-ED-02',
    name: 'Amrah Editorial',
    nationality: 'GCC',
    region: 'GCC',
    gender: 'Female',
    ageRange: '20-25',
    style: ['Contemporary Modest', 'Avant-Garde Fashion', 'Luxury Beauty'],
    beautyNotes: 'Striking, chiseled features optimized for high-contrast cinematic lighting and modern editorial spreads.',
    features: 'Defined jawline, radiant tan complexion, piercing gaze, modern modest aesthetic. Perfect for bold, architectural fashion statements.',
    mainUrl: 'Amrah1.png',
    defaultPromptFragment: 'Modern GCC woman, Amrah editorial identity, defined features, luminous tan skin, piercing gaze, avant-garde modest fashion, cinematic studio lighting.',
    showcase: []
  },
  {
    id: 'AMRAH-HER-03',
    name: 'Amrah Heritage',
    nationality: 'Arabian',
    region: 'GCC',
    gender: 'Female',
    ageRange: '24-30',
    style: ['Heritage Couture', 'Bridal Modest', 'Fragrance Campaigns'],
    beautyNotes: 'A majestic presence that bridges tradition and modernity. Capturing the soul of Arabian heritage.',
    features: 'Classic features, warm honey skin tone, expressive eyes with a soft yet powerful gaze. Ideal for high-end heritage and perfume campaigns.',
    mainUrl: 'Amrah banner.png',
    defaultPromptFragment: 'Arabian woman, heritage Amrah identity, warm honey skin, expressive gaze, majestic posture, traditional couture styling, soft desert light.',
    showcase: []
  }
];
