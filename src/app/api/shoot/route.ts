import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { runShoot } from '@/lib/pipeline/run';
import { vertexConfig } from '@/lib/providers/vertex';
import {
  DEFAULT_MODEL_ID,
  hasModelLibrary,
  isHouseModel,
  loadModelPoses,
} from '@/lib/pipeline/models';
import { renderFromSketch } from '@/lib/pipeline/sketch';
import { persistShoot } from '@/lib/storage';
import { getUser, isSupabaseConfigured } from '@/lib/supabase/server';
import { refundShoot, reserveShoot, type Account } from '@/lib/billing/credits';

const schema = z.object({
  category: z.enum(['top', 'bottom', 'one-piece']),
  audience: z.enum(['adult', 'kids']),
  includeVideo: z.enum(['true', 'false']),
  length: z.enum(['top', 'mini', 'knee', 'midi', 'maxi']),
  modelId: z.string().optional(),
  // A studio's input is a technical flat long before it is a photograph.
  source: z.enum(['photo', 'sketch']).default('photo'),
  material: z.string().optional(),
  colour: z.string().optional(),
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
  if (!(await hasModelLibrary())) {
    return Response.json(
      { message: 'No house models are installed yet.' },
      { status: 503 },
    );
  }

  const form = await request.formData();

  const parsed = schema.safeParse({
    category: form.get('category'),
    audience: form.get('audience'),
    includeVideo: form.get('includeVideo'),
    length: form.get('length'),
    modelId: form.get('modelId') ?? undefined,
    source: form.get('source') ?? 'photo',
    material: form.get('material') ?? undefined,
    colour: form.get('colour') ?? undefined,
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

  const selection = {
    // A paying brand must not be served the free tier's engine.
    tier: account?.tier ?? ('free' as const),
    routing: account?.routingPolicy ?? ('any' as const),
  };

  try {
    // A technical flat is rendered into a photographable garment first; the
    // rest of the shoot then treats it exactly like an uploaded photograph.
    let sketchCost = 0;
    let garmentFront: Awaited<ReturnType<typeof renderFromSketch>>['garment'] | undefined;

    if (parsed.data.source === 'sketch') {
      if (!parsed.data.material) {
        return Response.json(
          { message: 'Describe the fabric so the sketch can be rendered.' },
          { status: 400 },
        );
      }
      const rendered = await renderFromSketch(
        { data: await toBase64(front), mimeType: front.type || 'image/png' },
        { material: parsed.data.material, colour: parsed.data.colour },
        parsed.data.category,
        selection,
      );
      garmentFront = rendered.garment;
      sketchCost = rendered.cost;
    }

    const outcome = await runShoot({
      shootId,
      ...selection,
      garmentFront: garmentFront ?? {
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
      persona: await resolvePersona(form, parsed.data.modelId),
      audience: parsed.data.audience,
      length: parsed.data.length,
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
        totalCost: outcome.totalCost + sketchCost,
        failures: outcome.failures,
      });

      return Response.json({
        shootId,
        totalCost: outcome.totalCost,
        failures: outcome.failures,
        skipped: outcome.skipped,
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
        notice: a.notice,
        src: a.image ? `data:image/png;base64,${a.image.toString('base64')}` : a.uri,
      })),
    });
  } catch (error) {
    console.error('Shoot failed', error);
    if (user && isSupabaseConfigured) await refundShoot(user.id);
    return Response.json({ message: 'The shoot could not be completed.' }, { status: 502 });
  }
}

/**
 * Chooses whose body the garment is fitted to.
 *
 * A brand can pick a house model, or upload its own. An uploaded photo gives
 * one viewpoint only, so it fills the front pose and the angles that need a
 * camera position we do not have are reported as missing rather than invented
 * from it.
 */
async function resolvePersona(form: FormData, modelId?: string) {
  const custom = form.get('modelImage');

  if (custom instanceof File && custom.size > 0) {
    return {
      poses: { front: await toBase64(custom) },
      bodyProfile: 'custom',
    };
  }

  const id = modelId && isHouseModel(modelId) ? modelId : DEFAULT_MODEL_ID;
  return { poses: await loadModelPoses(id), bodyProfile: id };
}
