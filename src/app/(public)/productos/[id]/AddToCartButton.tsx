'use client';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';

type Props = {
  product: {
    id: number;
    name: string;
    price: string | null;
    imageUrl: string | null;
    categoryIcon: string | null;
    stock: number;
  };
};

export default function AddToCartButton({ product }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (product.stock === 0) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      categoryIcon: product.categoryIcon,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (product.stock === 0) {
    return (
      <button disabled
        className="flex-1 text-center px-4 py-3 rounded-2xl text-sm font-semibold font-sans bg-surface-container text-on-surface-variant/40 cursor-not-allowed">
        Sin stock
      </button>
    );
  }

  return (
    <button onClick={handleAdd}
      className={`flex-1 text-center px-4 py-3 rounded-2xl text-sm font-semibold font-sans transition-all duration-300 active:scale-95 ${
        added ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-primary text-white hover:bg-primary/90'
      }`}>
      {added ? '✓ Agregado al carrito' : '+ Agregar al carrito'}
    </button>
  );
}
