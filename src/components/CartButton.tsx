'use client';
import { useCart } from '@/context/CartContext';

export default function CartButton() {
  const { count, setIsOpen } = useCart();

  return (
    <button onClick={() => setIsOpen(true)}
      className="glossy-reflection fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-300 animate-pop-in"
      style={{ boxShadow: '0 8px 28px rgba(111,89,86,0.45), inset 0 1px 0 rgba(255,255,255,0.3)' }}
      aria-label="Abrir carrito">
      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 300, 'opsz' 24" }}>
        shopping_bag
      </span>
      {count > 0 && (
        <span key={count}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-tertiary text-white text-[10px] font-bold flex items-center justify-center font-sans leading-none animate-badge-pop"
          style={{ boxShadow: '0 2px 8px rgba(115,92,0,0.4)' }}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
