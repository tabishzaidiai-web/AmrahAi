import { z } from 'zod';
import { getUser, createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { canAnimate, promptFor } from '@/lib/pipeline/directions';

/**
 * Orders a clip from a shot the designer has chosen.
 *
 * Video is the most expensive thing the app does, so it is never made on spec.
 * The designer looks at the stills, picks the one worth animating, says what
 * the model should do, and that becomes a queued job. The work happens on the
 * worker rather than in this request because a clip takes minutes and the
 * provider allows one a minute across the whole project.
 */

const schema = z.object({
  shootId: z.string().uuid(),
  slot: z.string().min(1),
  /** Required for a preview. A final render inherits the direction of the
   *  preview it was approved from, so it cannot silently differ from it. */
  direction: z.string().min(1).optional(),
  /** The designer's own brief, when the built-in directions do not fit. */
  custom: z.string().max(600).optional(),
  /** Previews are the default: nothing is rendered at full size until someone
   *  has watched the cheap version and asked for it. */
  quality: z.enum(['preview', 'final']).default('preview'),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return Response.json({ message: 'Video is not configured yet.' }, { status: 503 });
  }

  const user = await getUser();
  if (!user) {
    return Response.json({ message: 'Sign in to make a video.' }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ message: 'Invalid video request.' }, { status: 400 });
  }

  const { shootId, slot, direction, custom, quality } = parsed.data;

  if (!canAnimate(slot)) {
    return Response.json(
      { message: 'Only shots with the model in them can be animated.' },
      { status: 400 },
    );
  }

  // Written as the designer's own session rather than with the service role, so
  // row-level security is what decides whether this shoot is theirs to animate.
  const supabase = await createClient();

  const { data: asset } = await supabase
    .from('assets')
    .select('id')
    .eq('shoot_id', shootId)
    .eq('slot', slot)
    .maybeSingle();

  if (!asset) {
    return Response.json({ message: 'That shot could not be found.' }, { status: 404 });
  }

  // One clip in flight per shot, angle and quality. Asking twice is a
  // double-click far more often than a genuine second request, and each one is
  // real money — but a final render must not be mistaken for a repeat of the
  // preview it was approved from.
  const { data: existing } = await supabase
    .from('video_jobs')
    .select('id')
    .eq('shoot_id', shootId)
    .eq('source_slot', slot)
    .eq('quality', quality)
    .in('status', ['pending', 'running'])
    .maybeSingle();

  if (existing) {
    return Response.json({ queued: true, alreadyQueued: true });
  }

  // A final render is an approval of a preview the designer has watched, so it
  // reuses that preview's own prompt. Rebuilding it from what the page happens
  // to still be holding is how a published clip ends up being a different clip
  // from the one that was approved.
  let prompt: string;
  let usedDirection = direction ?? null;

  if (quality === 'final') {
    const { data: approved } = await supabase
      .from('video_jobs')
      .select('prompt, direction')
      .eq('shoot_id', shootId)
      .eq('source_slot', slot)
      .eq('quality', 'preview')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!approved) {
      return Response.json(
        { message: 'Make a preview first, so there is something to approve.' },
        { status: 409 },
      );
    }
    prompt = approved.prompt as string;
    usedDirection = (approved.direction as string) ?? null;
  } else {
    if (!direction) {
      return Response.json({ message: 'Choose what she should do.' }, { status: 400 });
    }
    prompt = promptFor(direction, custom);
  }

  const { error } = await supabase.from('video_jobs').insert({
    shoot_id: shootId,
    user_id: user.id,
    source_slot: slot,
    direction: usedDirection,
    quality,
    prompt,
  });

  if (error) {
    return Response.json({ message: 'Could not queue the video.' }, { status: 502 });
  }

  return Response.json({ queued: true, quality });
}
