/**
 * The social shapes a shoot is delivered in.
 *
 * Kept free of image-processing imports so the results gallery can offer them
 * without pulling sharp into the browser bundle.
 */

export type SocialFormat = 'feed' | 'story' | 'square';

export interface FormatSpec {
  id: SocialFormat;
  label: string;
  where: string;
  width: number;
  height: number;
}

export const SOCIAL_FORMATS: FormatSpec[] = [
  {
    id: 'feed',
    label: 'Feed',
    where: 'Instagram posts — the tallest shape the feed allows',
    width: 1080,
    height: 1350,
  },
  {
    id: 'story',
    label: 'Story / Reel',
    where: 'Instagram stories and reels, TikTok',
    width: 1080,
    height: 1920,
  },
  { id: 'square', label: 'Square', where: 'Grid and catalogue', width: 1080, height: 1080 },
];
