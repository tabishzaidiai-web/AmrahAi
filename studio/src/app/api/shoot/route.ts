import { z } from 'zod';
import { fal } from '@fal-ai/client';
import { runShoot } from '@/lib/pipeline/run';
import { SCENES } from '@/lib/scenes';

const schema = z.object({
  category: z.enum(['top', 'bottom', 'one-piece']),
  audience: z.enum(['adult', 'kids']),
  scene: z.string(),
  includeVideo: z.enum(['true', 'false']),
});

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  if (!process.env.FAL_KEY) {
    return Response.json(
      {
        message:
          'Generation is not configured yet. Add a FAL_KEY to enable shoots.',
      },
      { status: 503 },
    );
  }

  const form = await request.formData();

  const parsed = schema.safeParse({
    category: form.get('category'),
    audience: form.get('audience'),
    scene: form.get('scene'),
    includeVideo: form.get('includeVideo'),
  });
  if (!parsed.success) {
    return Response.json({ message: 'Invalid shoot options.' }, { status: 400 });
  }

  const front = form.get('front');
  const back = form.get('back');
  if (!(front instanceof File)) {
    return Response.json({ message: 'A front image is required.' }, { status: 400 });
  }
  for (const file of [front, back]) {
    if (file instanceof File && file.size > MAX_UPLOAD_BYTES) {
      return Response.json({ message: 'Images must be under 15MB.' }, { status: 413 });
    }
  }

  const scene = SCENES.find((s) => s.id === parsed.data.scene);
  if (!scene) {
    return Response.json({ message: 'Unknown scene.' }, { status: 400 });
  }

  try {
    // Providers take URLs, so uploads are staged before generation begins.
    const frontUrl = await fal.storage.upload(front);
    const backUrl = back instanceof File ? await fal.storage.upload(back) : undefined;

    const outcome = await runShoot({
      tier: 'free',
      routing: 'any',
      garmentFront: { url: frontUrl, view: 'front', category: parsed.data.category },
      garmentBack: backUrl
        ? { url: backUrl, view: 'back', category: parsed.data.category }
        : undefined,
      persona: {
        // Placeholder until brand kits carry a saved house model.
        referenceUrl: frontUrl,
        bodyProfile: 'standard',
      },
      audience: parsed.data.audience,
      scene: scene.prompt,
      includeVideo: parsed.data.includeVideo === 'true',
    });

    return Response.json(outcome);
  } catch (error) {
    console.error('Shoot failed', error);
    return Response.json({ message: 'The shoot could not be completed.' }, { status: 502 });
  }
}
