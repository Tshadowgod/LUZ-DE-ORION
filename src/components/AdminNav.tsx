'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  { href: '/admin',            icon: 'dashboard',    label: 'Panel'      },
  { href: '/admin/catalogo',   icon: 'inventory_2',  label: 'Catálogo'   },
  { href: '/admin/inventario', icon: 'warehouse',    label: 'Inventario' },
  { href: '/admin/pedidos',    icon: 'receipt_long', label: 'Pedidos'    },
  { href: '/admin/noticias',   icon: 'campaign',     label: 'Noticias'   },
];

export default function AdminNav({ slot = 'top' }: { slot?: 'top' | 'bottom' }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (slot === 'top') return (
      <header className="flex-none w-full z-40 liquid-glass border-b border-white/20">
        <div className="flex justify-between items-center px-6 h-16 w-full max-w-screen-xl mx-auto">
          <Link href="/"
            className="active:scale-95 transition-transform text-on-surface-variant/60 hover:text-primary liquid-glass-dark p-2 rounded-full">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'wght' 200, 'opsz' 24" }}>
              store
            </span>
          </Link>
          <div className="text-center">
            <span className="font-display font-semibold text-lg text-primary">✦ Luz de Orion</span>
            <p className="text-[9px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase -mt-0.5">PANEL ADMIN</p>
          </div>
          <button onClick={handleLogout}
            className="active:scale-95 hover:scale-110 transition-all duration-300 text-on-surface-variant/60 hover:text-red-400 liquid-glass-dark p-2 rounded-full">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'wght' 200, 'opsz' 24" }}>
              logout
            </span>
          </button>
        </div>
      </header>
  );

  return (
      <nav className="flex-none w-full h-20 flex justify-around items-center px-2 liquid-glass z-40 rounded-t-[2.5rem] border-t border-white/30"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map(tab => {
          const active = tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href} aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center px-2 py-2 rounded-2xl transition-colors duration-300 ${
                active ? 'text-primary liquid-glass-dark' : 'text-on-surface-variant/60 hover:text-primary'
              }`}>
              <span className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: `'FILL' ${active ? 1 : 0}, 'wght' 200, 'opsz' 24` }}>
                {tab.icon}
              </span>
              <span className="text-[9px] mt-0.5 font-semibold tracking-wider uppercase font-sans">{tab.label}</span>
            </Link>
          );
        })}
        <button onClick={handleLogout}
          className="flex flex-col items-center justify-center px-2 py-2 rounded-2xl text-on-surface-variant/60 hover:text-red-400 transition-colors duration-300">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'wght' 200, 'opsz' 24" }}>
            logout
          </span>
          <span className="text-[9px] mt-0.5 font-semibold tracking-wider uppercase font-sans">Salir</span>
        </button>
      </nav>
  );
}
