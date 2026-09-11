/**
 * The model list, without the filesystem access that loading their images
 * needs, so the picker can render in the browser.
 *
 * The roster is built around where the clothes are sold rather than around
 * abstract diversity: a Lahore label shooting a bridal lehenga and a Berlin
 * label shooting outerwear want different faces, and both want the choice to be
 * obvious. Menswear is here because sherwanis, kurtas and waistcoats are half
 * of what South Asian houses make and there was previously nobody to wear them.
 */

export interface HouseModel {
  id: string;
  name: string;
  description: string;
  gender: 'women' | 'men';
}

export const HOUSE_MODELS: HouseModel[] = [
  // Women
  { id: 'aditi', name: 'Aditi', description: 'Indian, late twenties', gender: 'women' },
  { id: 'zara', name: 'Zara', description: 'Pakistani, mid twenties', gender: 'women' },
  { id: 'yuki', name: 'Yuki', description: 'Japanese, mid twenties', gender: 'women' },
  { id: 'lin', name: 'Lin', description: 'Chinese, late twenties', gender: 'women' },
  { id: 'anastasia', name: 'Anastasia', description: 'Russian, mid twenties', gender: 'women' },
  { id: 'greta', name: 'Greta', description: 'German, late twenties', gender: 'women' },
  { id: 'leila', name: 'Leila', description: 'Middle Eastern, late twenties', gender: 'women' },
  { id: 'nala', name: 'Nala', description: 'Black, late twenties', gender: 'women' },

  // Men
  { id: 'arjun', name: 'Arjun', description: 'Indian, late twenties', gender: 'men' },
  { id: 'bilal', name: 'Bilal', description: 'Pakistani, early thirties', gender: 'men' },
  { id: 'haruto', name: 'Haruto', description: 'Japanese, late twenties', gender: 'men' },
  { id: 'chen', name: 'Chen', description: 'Chinese, late twenties', gender: 'men' },
  { id: 'maksim', name: 'Maksim', description: 'Russian, early thirties', gender: 'men' },
  { id: 'lukas', name: 'Lukas', description: 'German, late twenties', gender: 'men' },
];

export const DEFAULT_MODEL_ID = 'aditi';

export const MODELS_BY_GENDER = [
  { gender: 'women' as const, label: 'Women' },
  { gender: 'men' as const, label: 'Men' },
];
