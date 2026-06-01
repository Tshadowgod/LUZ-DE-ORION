'use client';

import Link from 'next/link';

export default function TopHeader() {
  return (
    <header className="fixed top-0 w-full z-50 liquid-glass border-b border-white/20">
      <div className="flex justify-between items-center px-6 h-16 w-full max-w-screen-xl mx-auto">
        <Link href="/productos/nuevo"
          className="active:scale-95 transition-transform duration-200 text-primary liquid-glass-dark p-2 rounded-full">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'wght' 200, 'opsz' 24" }}>
            add
          </span>
        </Link>

        <Link href="/" className="flex items-center justify-center h-full">
          <span className="font-display font-semibold text-xl tracking-wide text-primary">
            ✦ Luz de Orion
          </span>
        </Link>

        <Link href="/productos"
          className="active:scale-95 transition-transform duration-200 text-primary liquid-glass-dark p-2 rounded-full">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'wght' 200, 'opsz' 24" }}>
            inventory_2
          </span>
        </Link>
      </div>
    </header>
  );
}
