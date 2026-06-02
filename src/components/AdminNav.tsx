'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  { href: '/admin',           icon: 'dashboard',   label: 'Panel'    },
  { href: '/admin/catalogo',  icon: 'inventory_2', label: 'Catálogo' },
  { href: '/admin/noticias',  icon: 'campaign',    label: 'Noticias' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 liquid-glass border-b border-white/20">
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
            className="active:scale-95 transition-transform text-on-surface-variant/60 hover:text-red-400 liquid-glass-dark p-2 rounded-full">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'wght' 200, 'opsz' 24" }}>
              logout
            </span>
          </button>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 w-full h-20 flex justify-around items-center px-6 liquid-glass z-50 rounded-t-[2.5rem] border-t border-white/30">
        {tabs.map(tab => {
          const active = tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href);
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
        <button onClick={handleLogout}
          className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-red-400 transition-all duration-300">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'wght' 200, 'opsz' 24" }}>
            logout
          </span>
          <span className="text-[9px] mt-0.5 font-semibold tracking-wider uppercase font-sans">Salir</span>
        </button>
      </nav>
    </>
  );
}
