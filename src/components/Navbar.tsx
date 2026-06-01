'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/productos', label: 'Inventario' },
  { href: '/productos/nuevo', label: '+ Agregar' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">✨</span>
            </div>
            <span className="font-bold text-xl tracking-wide text-gradient-amber">
              Luz de Orion
            </span>
          </Link>

          <div className="flex gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? 'glass-btn-amber rounded-xl font-semibold shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                    : 'text-white/60 hover:text-white/90 hover:bg-white/5 rounded-xl'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

        </div>
      </div>
    </nav>
  );
}
