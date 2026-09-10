import Link from 'next/link';

/**
 * The app's navigation.
 *
 * Every working page carries the same bar. Without it the library was
 * reachable only by typing the address, which meant finished shoots were
 * effectively lost the moment someone navigated away from them.
 */
export function Nav({ current }: { current?: 'studio' | 'collections' | 'library' }) {
  const links = [
    { id: 'studio', href: '/studio', label: 'New shoot' },
    { id: 'collections', href: '/collections/new', label: 'Collection' },
    { id: 'library', href: '/library', label: 'Library' },
  ] as const;

  return (
    <header className="border-b border-line">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="font-display text-lg tracking-tight">
          Amrah Studio
        </Link>
        <div className="flex items-center gap-5 text-sm">
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              aria-current={current === link.id ? 'page' : undefined}
              className={
                current === link.id
                  ? 'text-foreground'
                  : 'text-muted transition-colors hover:text-foreground'
              }
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
