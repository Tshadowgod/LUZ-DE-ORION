'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/',              icon: 'home',             label: 'Inicio'   },
  { href: '/productos',     icon: 'auto_awesome',     label: 'Catálogo' },
  { href: '/productos/nuevo', icon: 'add_circle',     label: 'Agregar'  },
  { href: '#perfil',        icon: 'person',           label: 'Perfil'   },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full h-20 flex justify-around items-center px-6 liquid-glass z-50 rounded-t-[2.5rem] border-t border-white/30">
      {tabs.map((tab) => {
        const active = tab.href !== '#perfil' && (tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href) && !(tab.href === '/productos' && pathname.startsWith('/productos/nuevo')));
        return (
          <Link key={tab.href} href={tab.href}
            className={`flex flex-col items-center justify-center transition-all duration-300 ${
              active
                ? 'text-primary liquid-glass-dark px-5 py-2 rounded-2xl'
                : 'text-on-surface-variant/60 hover:text-primary'
            }`}>
            <span className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: `'FILL' ${active ? 1 : 0}, 'wght' 200, 'opsz' 24` }}>
              {tab.icon}
            </span>
            <span className="text-[9px] mt-0.5 font-semibold tracking-wider uppercase font-sans">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
