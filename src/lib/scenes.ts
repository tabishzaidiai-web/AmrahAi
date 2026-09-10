/**
 * Preset scenes, so a brand never has to write a prompt. Each carries the
 * lighting and setting language the generator needs behind a single label.
 */

export interface Scene {
  id: string;
  label: string;
  description: string;
  prompt: string;
}

export const SCENES: Scene[] = [
  {
    id: 'studio-white',
    label: 'Studio white',
    description: 'Clean marketplace-ready lighting',
    prompt:
      'a bright professional studio on a seamless pure white backdrop, soft even key light, subtle contact shadow',
  },
  {
    id: 'editorial-grey',
    label: 'Editorial grey',
    description: 'Softbox on warm concrete',
    prompt:
      'a minimal studio with a warm grey concrete backdrop, large softbox key light, gentle falloff',
  },
  {
    id: 'golden-hour',
    label: 'Golden hour',
    description: 'Outdoor, low warm sun',
    prompt:
      'an outdoor street setting at golden hour, low warm directional sunlight, softly blurred background',
  },
  {
    id: 'marble-luxury',
    label: 'Marble interior',
    description: 'Polished stone, gallery light',
    prompt:
      'a luxury interior with polished marble and stone, diffused daylight from tall windows, calm gallery atmosphere',
  },
  {
    id: 'runway',
    label: 'Runway',
    description: 'Show lighting, dark surround',
    prompt:
      'a fashion runway with a dark surround, focused overhead show lighting, glossy floor with reflection',
  },
  {
    id: 'desert-warm',
    label: 'Desert light',
    description: 'Open sand, high sun',
    prompt:
      'an open desert landscape with warm sand tones, bright high sunlight, wide clean horizon',
  },
  {
    id: 'urban-night',
    label: 'Urban night',
    description: 'City lights, cool tone',
    prompt:
      'a city street at night, cool ambient light with warm practical highlights, softly blurred signage',
  },
  {
    id: 'garden-daylight',
    label: 'Garden daylight',
    description: 'Greenery, overcast soft',
    prompt:
      'a garden setting with soft greenery, even overcast daylight, natural shallow depth of field',
  },
];
