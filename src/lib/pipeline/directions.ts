/**
 * How a designer directs a clip.
 *
 * Video used to be made automatically from the front render with one hard-coded
 * walk, whether or not anyone wanted it — which is both the single most
 * expensive thing the app does and, for most pieces, unwanted. It is now asked
 * for against a shot the designer has already looked at and liked.
 *
 * Directing is offered the way a photographer would be briefed: pick the shot,
 * say what the model should do. The written-out prompts live here rather than
 * in the page, so the app and the worker agree on exactly what was asked for
 * and a saved job still means something months later.
 *
 * Every direction ends on the same instruction — that the garment does not
 * change — because that is the promise the rest of the pipeline is built to
 * keep and a clip is the easiest place to lose it.
 */

export interface Direction {
  id: string;
  /** What the designer sees. */
  label: string;
  /** The one-line reason to choose it, in their terms rather than the model's. */
  hint: string;
  prompt: string;
}

const HOLD_THE_GARMENT =
  'The garment does not change: same colour, same embroidery, same motifs in the same places, same hem length, same sleeves.';

export const DIRECTIONS: Direction[] = [
  {
    id: 'walk',
    label: 'Walk to camera',
    hint: 'The runway shot. Best for Reels and TikTok.',
    prompt: `The model walks slowly toward the camera with a natural, confident stride. The fabric moves and drapes with each step. The camera holds still. ${HOLD_THE_GARMENT}`,
  },
  {
    id: 'turn',
    label: 'Turn to show the back',
    hint: 'Shows the whole piece without a second shoot.',
    prompt: `The model turns slowly on the spot to show the garment from the side and then the back, then returns to face the camera. The camera holds still. ${HOLD_THE_GARMENT}`,
  },
  {
    id: 'twirl',
    label: 'Twirl',
    hint: 'For anything with flare — anarkalis, lehengas, gowns.',
    prompt: `The model turns quickly so the skirt lifts and flares outward, then settles. The fabric catches the light as it moves. The camera holds still. ${HOLD_THE_GARMENT}`,
  },
  {
    id: 'sit',
    label: 'Sit down',
    hint: 'An editorial, seated portrait.',
    prompt: `The model lowers herself gracefully onto a seat and settles into a relaxed, poised sitting position, arranging the fabric naturally as she sits. The camera holds still. ${HOLD_THE_GARMENT}`,
  },
  {
    id: 'poses',
    label: 'Change pose',
    hint: 'Several looks from one shot, for a carousel.',
    prompt: `The model shifts through a few natural editorial poses in place — weight moving from one hip to the other, hands moving, a slight turn of the shoulders and head. Unhurried and composed. The camera holds still. ${HOLD_THE_GARMENT}`,
  },
  {
    id: 'detail',
    label: 'Close in on the detail',
    hint: 'Pushes in on the embroidery. Good for a first frame.',
    prompt: `The camera pushes in slowly toward the embroidered detail on the front of the garment while the model stands still. Shallow, steady move. ${HOLD_THE_GARMENT}`,
  },
];

export const DEFAULT_DIRECTION = DIRECTIONS[0].id;

/**
 * The prompt for a chosen direction, or a designer's own words.
 *
 * A custom brief still gets the garment-preservation line appended: the app
 * makes that promise regardless of what anyone types, and someone writing
 * "make her walk on a beach at sunset" should not silently lose it.
 */
export function promptFor(directionId: string, custom?: string): string {
  const written = custom?.trim();
  if (written) return `${written} ${HOLD_THE_GARMENT}`;

  const found = DIRECTIONS.find((d) => d.id === directionId);
  return (found ?? DIRECTIONS[0]).prompt;
}

/** Which shots can be animated: the ones with a person in them. */
export function canAnimate(slot: string): boolean {
  return slot.startsWith('on-model') || slot === 'lifestyle' || slot === 'cropped';
}
