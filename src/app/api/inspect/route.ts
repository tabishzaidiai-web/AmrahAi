import { readGarment } from '@/lib/pipeline/inspect';
import { vertexConfig } from '@/lib/providers/vertex';
import { getUser, isSupabaseConfigured } from '@/lib/supabase/server';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Reads an uploaded garment so the studio can pre-fill its own questions.
 *
 * Deliberately does not consume a shoot credit: this runs on upload, before
 * anyone has committed to anything, and charging for it would make people
 * avoid the step that prevents wasted shoots.
 */
export async function POST(request: Request) {
  if (!vertexConfig().configured) {
    return Response.json({ message: 'Not configured.' }, { status: 503 });
  }

  // Reading costs money, so it is not left open to anonymous callers.
  if (isSupabaseConfigured && !(await getUser())) {
    return Response.json({ message: 'Sign in first.' }, { status: 401 });
  }

  const form = await request.formData();
  const image = form.get('image');
  if (!(image instanceof File)) {
    return Response.json({ message: 'An image is required.' }, { status: 400 });
  }
  if (image.size > MAX_UPLOAD_BYTES) {
    return Response.json({ message: 'Images must be under 10MB.' }, { status: 413 });
  }

  try {
    const reading = await readGarment({
      data: Buffer.from(await image.arrayBuffer()).toString('base64'),
      mimeType: image.type || 'image/png',
    });
    return Response.json(reading);
  } catch (error) {
    console.error('Garment reading failed', error);
    // A failed reading must not block the shoot; the studio just asks instead.
    return Response.json({ message: 'Could not read the garment.' }, { status: 502 });
  }
}
