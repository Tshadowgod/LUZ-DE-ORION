'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type Category = { id: number; name: string; slug: string; icon: string | null; color: string | null };
type Product  = { id: number; name: string; description: string | null; price: string | null;
                  stock: number; imageUrl: string | null; category: Category | null };
type Props = {
  product: Product;
  mode?: 'public' | 'admin';
  onDelete?: (id: number) => void;
  onAddToCart?: (product: Product) => void;
};

export default function ProductCard({ product, mode = 'public', onDelete, onAddToCart }: Props) {
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);

  const stockLabel = product.stock === 0 ? 'Agotado' : product.stock <= 3 ? `Solo ${product.stock}` : `${product.stock} uds.`;
  const stockColor = product.stock === 0 ? 'text-red-500' : product.stock <= 3 ? 'text-tertiary' : 'text-primary';

  const handleAddToCart = () => {
    if (product.stock === 0 || !onAddToCart) return;
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="flex-shrink-0 w-full liquid-glass glass-card glossy-reflection rounded-[2rem] overflow-hidden group">
      <div className="h-64 overflow-hidden relative">
        {product.imageUrl && !imgError ? (
          <Image src={product.imageUrl} alt={product.name} fill
            className="object-cover group-hover:scale-110 transition-transform duration-[1200ms] ease-out"
            onError={() => setImgError(true)} unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-primary-container/30">
            <span className="text-6xl opacity-60">{product.category?.icon ?? '💍'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
        <div className={`absolute top-3 right-3 text-xs font-semibold font-sans tracking-wide ${stockColor}`}
          style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', padding: '3px 10px', borderRadius: '999px', border: '0.5px solid rgba(255,255,255,0.4)' }}>
          {stockLabel}
        </div>
      </div>

      <div className="p-5">
        {product.category && (
          <p className="text-[10px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase mb-1">
            {product.category.icon} {product.category.name}
          </p>
        )}
        <h4 className="font-display font-medium text-lg text-on-background leading-snug mb-1 line-clamp-1">
          {product.name}
        </h4>
        {product.description && (
          <p className="text-on-surface-variant text-xs font-sans line-clamp-2 mb-2 opacity-70 leading-relaxed">
            {product.description}
          </p>
        )}
        {product.price && (
          <p className="text-primary font-bold text-xl font-sans mb-4">
            Bs {Number(product.price).toLocaleString('es-BO')}
          </p>
        )}

        <div className="flex gap-2">
          {mode === 'public' ? (
            <>
              <Link href={`/productos/${product.id}`}
                className="flex-1 text-center text-xs font-semibold font-sans py-2.5 rounded-xl liquid-glass-dark text-primary hover:bg-primary-container/40 transition-colors">
                Ver detalle
              </Link>
              <button onClick={handleAddToCart} disabled={product.stock === 0}
                className={`flex-1 text-center text-xs font-semibold font-sans py-2.5 rounded-xl transition-all duration-300 ${
                  product.stock === 0
                    ? 'bg-surface-container text-on-surface-variant/40 cursor-not-allowed'
                    : added
                    ? 'bg-primary/15 text-primary border border-primary/30 animate-pop-in'
                    : 'bg-primary text-white hover:bg-primary/90 hover:shadow-md active:scale-95'
                }`}>
                {product.stock === 0 ? 'Agotado' : added ? '✓ Agregado' : '+ Al carrito'}
              </button>
            </>
          ) : (
            <>
              <Link href={`/admin/catalogo/${product.id}/editar`}
                className="flex-1 text-center text-xs font-semibold font-sans py-2.5 rounded-xl bg-tertiary-container/50 text-on-tertiary-container hover:bg-tertiary-container/70 transition-colors">
                ✏️ Editar
              </Link>
              {onDelete && (
                <button onClick={() => onDelete(product.id)}
                  className="px-3 py-2.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors text-xs">
                  ✕
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
