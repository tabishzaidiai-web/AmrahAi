import { z } from 'zod';
import { SOCIAL_FORMATS, socialCrop } from '@/lib/pipeline/social';
import { getUser, isSupabaseConfigured } from '@/lib/supabase/server';

const schema = z.object({
  src: z.string().url(),
  format: z.enum(['feed', 'story', 'square']),
});

/**
 * Re-crops a finished asset to a social shape on demand.
 *
 * Cropping at download time rather than storing every format keeps a shoot from
 * writing three extra files per asset that most brands will never open.
 */
export async function POST(request: Request) {
  if (isSupabaseConfigured && !(await getUser())) {
    return Response.json({ message: 'Sign in first.' }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ message: 'Unknown format.' }, { status: 400 });
  }

  const format = SOCIAL_FORMATS.find((f) => f.id === parsed.data.format)!;

  // Only assets this app issued links for; an open image proxy would let
  // anyone use this endpoint to fetch arbitrary hosts.
  const source = new URL(parsed.data.src);
  const allowed = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!allowed || source.origin !== new URL(allowed).origin) {
    return Response.json({ message: 'That image is not from a shoot.' }, { status: 400 });
  }

  try {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Could not fetch the asset: ${response.status}`);

    const cropped = await socialCrop(Buffer.from(await response.arrayBuffer()), format);

    return new Response(new Uint8Array(cropped), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${format.id}.jpg"`,
      },
    });
  } catch (error) {
    console.error('Crop failed', error);
    return Response.json({ message: 'Could not prepare that format.' }, { status: 502 });
  }
}
