import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { runShoot } from '@/lib/pipeline/run';
import { vertexConfig } from '@/lib/providers/vertex';
import { POSE_LIBRARY, hasPoseLibrary } from '@/lib/pipeline/poses';
import { SCENES } from '@/lib/scenes';
import { persistShoot } from '@/lib/storage';
import { getUser, isSupabaseConfigured } from '@/lib/supabase/server';
import { refundShoot, reserveShoot, type Account } from '@/lib/billing/credits';

const schema = z.object({
  category: z.enum(['top', 'bottom', 'one-piece']),
  audience: z.enum(['adult', 'kids']),
  scene: z.string(),
  includeVideo: z.enum(['true', 'false']),
  length: z.enum(['top', 'mini', 'knee', 'midi', 'maxi']),
});

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

async function toBase64(file: File) {
  return Buffer.from(await file.arrayBuffer()).toString('base64');
}

export async function POST(request: Request) {
  const vertex = vertexConfig();
  if (!vertex.configured) {
    return Response.json(
      {
        message: `Generation is not configured yet. Missing: ${vertex.missing.join(' and ')}.`,
      },
      { status: 503 },
    );
  }
  if (!(await hasPoseLibrary())) {
    return Response.json(
      { message: 'No model pose library is installed yet.' },
      { status: 503 },
    );
  }

  const form = await request.formData();

  const parsed = schema.safeParse({
    category: form.get('category'),
    audience: form.get('audience'),
    scene: form.get('scene'),
    includeVideo: form.get('includeVideo'),
    length: form.get('length'),
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
    // Vertex rejects inputs above 10MB, so this is enforced before the call.
    if (file instanceof File && file.size > MAX_UPLOAD_BYTES) {
      return Response.json({ message: 'Images must be under 10MB.' }, { status: 413 });
    }
  }

  const scene = SCENES.find((s) => s.id === parsed.data.scene);
  if (!scene) {
    return Response.json({ message: 'Unknown scene.' }, { status: 400 });
  }

  const shootId = randomUUID();
  const user = await getUser();

  // Generation spends real money the moment it starts, so the credit is taken
  // before any provider is called rather than after.
  let account: Account | undefined;
  if (user && isSupabaseConfigured) {
    const check = await reserveShoot(user.id);
    if (!check.allowed) {
      return Response.json({ message: check.reason }, { status: 402 });
    }
    account = check.account;
  }

  try {
    const outcome = await runShoot({
      shootId,
      // A paying brand must not be served the free tier's engine.
      tier: account?.tier ?? 'free',
      routing: account?.routingPolicy ?? 'any',
      garmentFront: {
        data: await toBase64(front),
        mimeType: front.type || 'image/png',
        view: 'front',
        category: parsed.data.category,
      },
      garmentBack:
        back instanceof File
          ? {
              data: await toBase64(back),
              mimeType: back.type || 'image/png',
              view: 'back',
              category: parsed.data.category,
            }
          : undefined,
      persona: { poses: await POSE_LIBRARY(), bodyProfile: 'standard' },
      audience: parsed.data.audience,
      length: parsed.data.length,
      scene: scene.prompt,
      includeVideo: parsed.data.includeVideo === 'true',
    });

    // A shoot that produced nothing usable should not cost the brand a credit.
    if (user && isSupabaseConfigured && outcome.assets.length === 0) {
      await refundShoot(user.id);
      return Response.json(
        { message: 'Nothing could be generated for this garment.', failures: outcome.failures },
        { status: 502 },
      );
    }

    // Signed-in brands get their shoot stored and returned as links. Without a
    // session there is nowhere to put it, so the images come back inline and
    // the shoot is not retained.
    if (user) {
      const assets = await persistShoot({
        shootId,
        userId: user.id,
        category: parsed.data.category,
        length: parsed.data.length,
        audience: parsed.data.audience,
        assets: outcome.assets,
        totalCost: outcome.totalCost,
        failures: outcome.failures,
      });

      return Response.json({
        shootId,
        totalCost: outcome.totalCost,
        failures: outcome.failures,
        assets,
      });
    }

    return Response.json({
      shootId,
      totalCost: outcome.totalCost,
      failures: outcome.failures,
      assets: outcome.assets.map((a) => ({
        slot: a.slot,
        kind: a.kind,
        providerId: a.providerId,
        cost: a.cost,
        compliance: a.compliance,
        src: a.image ? `data:image/png;base64,${a.image.toString('base64')}` : a.uri,
      })),
    });
  } catch (error) {
    console.error('Shoot failed', error);
    if (user && isSupabaseConfigured) await refundShoot(user.id);
    return Response.json({ message: 'The shoot could not be completed.' }, { status: 502 });
  }
}
