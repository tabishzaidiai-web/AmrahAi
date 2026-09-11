'use client';

import { useRouter } from 'next/navigation';
import { Results, type ResultAsset } from '@/app/studio/results';

/** Wraps the results gallery so a stored shoot renders identically to a fresh
 *  one, rather than duplicating the layout. */
export function ShootView({
  shootId,
  assets,
  canAddAngles,
}: {
  shootId: string;
  assets: ResultAsset[];
  canAddAngles?: boolean;
}) {
  const router = useRouter();

  return (
    <Results
      result={{ shootId, assets, failures: [], totalCost: 0, canAddAngles }}
      onReset={() => router.push('/studio')}
    />
  );
}
