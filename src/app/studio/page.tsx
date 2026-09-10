import { Nav } from '@/app/nav';
import { ShootComposer } from './shoot-composer';

export const metadata = {
  title: 'Studio — Amrah',
};

export default function StudioPage() {
  return (
    <main className="min-h-screen">
      <Nav current="studio" />

      <ShootComposer />
    </main>
  );
}
