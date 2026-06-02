'use client';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function TopHeader() {
  const { count, setIsOpen } = useCart();

  return (
    <header className="fixed top-0 w-full z-50 liquid-glass border-b border-white/20">
      <div className="flex justify-between items-center px-6 h-16 w-full max-w-screen-xl mx-auto">
        <Link href="/productos"
          className="active:scale-95 transition-transform text-primary liquid-glass-dark p-2 rounded-full">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'wght' 200, 'opsz' 24" }}>
            auto_awesome
          </span>
        </Link>

        <Link href="/" className="flex items-center justify-center h-full">
          <span className="font-display font-semibold text-xl tracking-wide text-primary">
            ✦ Luz de Orion
          </span>
        </Link>

        <button onClick={() => setIsOpen(true)}
          className="relative active:scale-95 transition-transform text-primary liquid-glass-dark p-2 rounded-full"
          aria-label="Carrito">
          <span className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: `'FILL' ${count > 0 ? 1 : 0}, 'wght' 200, 'opsz' 24` }}>
            shopping_bag
          </span>
          {count > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-tertiary text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
