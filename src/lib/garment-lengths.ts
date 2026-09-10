/**
 * The length bands a shoot can be declared at, in the words the brand uses.
 *
 * The bands were originally labelled for western womenswear only — mini, knee,
 * midi, maxi — and a Lamhey-style floor-length kurta was filed under "hip / top
 * length" because nothing on the list named it. Every render of it then came
 * back at full length, disagreed with the declaration, and was thrown away. The
 * garments this app is actually pointed at are shalwar kameez, kurtas, anarkalis
 * and lehengas, so the list has to name them.
 *
 * Pure data with no image work in it, so a client component can import it.
 */
export type GarmentLength = 'top' | 'mini' | 'knee' | 'midi' | 'maxi';

export interface LengthOption {
  id: GarmentLength;
  label: string;
  /** Where the hem falls, and the garments that usually fall there. */
  hint: string;
}

/** Ordered shortest to longest, which is how someone scans for their piece. */
export const LENGTHS: LengthOption[] = [
  { id: 'top', label: 'Short kurti / top', hint: 'Hem at the hip' },
  { id: 'mini', label: 'Mini', hint: 'Mid-thigh' },
  { id: 'knee', label: 'Knee-length kurta', hint: 'At or just below the knee' },
  { id: 'midi', label: 'Long kurta / midi', hint: 'Mid-calf' },
  { id: 'maxi', label: 'Floor length', hint: 'Anarkali, gown, lehenga, maxi' },
];
