'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { count, setIsOpen } = useCart();

  const tabs = [
    { href: '/',          icon: 'home',          label: 'Inicio'  },
    { href: '/productos', icon: 'auto_awesome',   label: 'Catálogo'},
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full h-20 flex justify-around items-center px-6 liquid-glass z-50 rounded-t-[2.5rem] border-t border-white/30">
      {tabs.map(tab => {
        const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href}
            className={`flex flex-col items-center justify-center transition-all duration-300 ${
              active ? 'text-primary liquid-glass-dark px-5 py-2 rounded-2xl' : 'text-on-surface-variant/60 hover:text-primary'
            }`}>
            <span className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: `'FILL' ${active ? 1 : 0}, 'wght' 200, 'opsz' 24` }}>
              {tab.icon}
            </span>
            <span className="text-[9px] mt-0.5 font-semibold tracking-wider uppercase font-sans">{tab.label}</span>
          </Link>
        );
      })}

      {/* Carrito */}
      <button onClick={() => setIsOpen(true)}
        className="relative flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-all duration-300">
        <span className="material-symbols-outlined text-2xl"
          style={{ fontVariationSettings: `'FILL' ${count > 0 ? 1 : 0}, 'wght' 200, 'opsz' 24` }}>
          shopping_bag
        </span>
        {count > 0 && (
          <span key={count} className="absolute -top-0.5 right-3 w-4 h-4 rounded-full bg-tertiary text-white text-[9px] font-bold flex items-center justify-center leading-none animate-badge-pop">
            {count > 9 ? '9+' : count}
          </span>
        )}
        <span className="text-[9px] mt-0.5 font-semibold tracking-wider uppercase font-sans">Carrito</span>
      </button>

      {/* Admin */}
      <Link href="/admin"
        className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-all duration-300">
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'wght' 200, 'opsz' 24" }}>
          admin_panel_settings
        </span>
        <span className="text-[9px] mt-0.5 font-semibold tracking-wider uppercase font-sans">Admin</span>
      </Link>
    </nav>
  );
}
