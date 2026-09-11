import sharp from 'sharp';

/**
 * Whether a render actually contains the whole person.
 *
 * The framing instruction is a request, not a guarantee: asked for a
 * full-length shot the model often returns one cropped at the ankles, and a
 * brand shooting a floor-length kurta gets three-quarters of a dress. Prompt
 * wording moves the odds and does not settle them, so the result is measured.
 *
 * This is the opposite case to counting embroidery, which could not be
 * measured reliably and was left to prevention instead. Whether a figure runs
 * off the edge is arithmetic on one row of pixels.
 *
 * The row is read against itself rather than against the wall colour, which is
 * the mistake the first version made: a full-length photograph has studio floor
 * along its bottom edge, the floor is not the same colour as the wall behind
 * it, and a perfectly framed shot was therefore reported as cropped. Floor runs
 * the whole width of the frame; a pair of cut-off ankles appears only in the
 * middle of it. So the middle of the edge is compared with its own outer
 * thirds, and only a difference between them counts as the subject leaving the
 * picture.
 */

/** Longest edge used for the check. Nothing here needs detail. */
const ANALYSIS_EDGE = 400;

/**
 * How much of an edge row may be subject before it counts as running off.
 *
 * Not zero: a shadow pooling under the feet or a scrap of studio floor touches
 * the bottom row in a perfectly framed photograph. A tenth of the row is more
 * than either and far less than a pair of cropped ankles.
 */
const EDGE_TOLERANCE = 0.1;

export interface FramingCheck {
  /** The subject runs off the bottom of the frame — feet or hem cut away. */
  cutAtBottom: boolean;
  /** The subject runs off the top — the head is cropped. */
  cutAtTop: boolean;
  ok: boolean;
}

type Rgb = readonly [number, number, number];

function distance(a: Rgb, b: Rgb) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

export async function checkFraming(render: Buffer): Promise<FramingCheck> {
  const { data, info } = await sharp(render)
    .resize(ANALYSIS_EDGE, ANALYSIS_EDGE, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const at = (x: number, y: number): Rgb => {
    const i = (y * width + x) * channels;
    return [data[i], data[i + 1], data[i + 2]];
  };

  /**
   * How much of the middle of an edge row differs from that same row's outer
   * thirds — which is to say, how much of the subject is sitting on the edge.
   */
  const subjectOnEdge = (y: number) => {
    const outer: Rgb[] = [];
    const third = Math.floor(width / 3);
    for (let x = 0; x < third; x++) outer.push(at(x, y), at(width - 1 - x, y));

    const median = (c: 0 | 1 | 2) => {
      const v = outer.map((p) => p[c]).sort((a, b) => a - b);
      return v[Math.floor(v.length / 2)];
    };
    const edgeGround: Rgb = [median(0), median(1), median(2)];

    // An edge whose own outer thirds are not one flat surface is a scene, not a
    // backdrop, and this test cannot say anything useful about it.
    const flat = outer.filter((p) => distance(p, edgeGround) < 40).length / outer.length;
    if (flat < 0.8) return 0;

    let subject = 0;
    for (let x = third; x < width - third; x++) {
      if (distance(at(x, y), edgeGround) > 40) subject++;
    }
    return subject / (width - 2 * third);
  };

  const cutAtBottom = subjectOnEdge(height - 1) > EDGE_TOLERANCE;
  const cutAtTop = subjectOnEdge(0) > EDGE_TOLERANCE;

  return { cutAtBottom, cutAtTop, ok: !cutAtBottom && !cutAtTop };
}
