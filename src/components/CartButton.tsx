'use client';
import { useCart } from '@/context/CartContext';

export default function CartButton() {
  const { count, setIsOpen } = useCart();

  return (
    <button onClick={() => setIsOpen(true)}
      className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center active:scale-95 transition-all"
      style={{ boxShadow: '0 4px 20px rgba(111,89,86,0.4)' }}
      aria-label="Abrir carrito">
      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 300, 'opsz' 24" }}>
        shopping_bag
      </span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-tertiary text-white text-[10px] font-bold flex items-center justify-center font-sans leading-none">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
