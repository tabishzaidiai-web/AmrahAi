/**
 * The model list, without the filesystem access that loading their images
 * needs, so the picker can render in the browser.
 */

export interface HouseModel {
  id: string;
  name: string;
  description: string;
}

export const HOUSE_MODELS: HouseModel[] = [
  { id: 'amira', name: 'Amira', description: 'South Asian, late twenties' },
  { id: 'leila', name: 'Leila', description: 'Middle Eastern, late twenties' },
  { id: 'mei', name: 'Mei', description: 'East Asian, mid twenties' },
  { id: 'nala', name: 'Nala', description: 'Black, late twenties' },
  { id: 'sofia', name: 'Sofia', description: 'White, late twenties' },
];

export const DEFAULT_MODEL_ID = 'amira';
