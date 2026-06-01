'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type Category = { id: number; name: string; slug: string; icon: string | null; color: string | null };
type Product  = { id: number; name: string; description: string | null; price: string | null;
                  stock: number; imageUrl: string | null; category: Category | null };
type Props = { product: Product; onDelete: (id: number) => void };

export default function ProductCard({ product, onDelete }: Props) {
  const [imgError, setImgError] = useState(false);

  const stockLabel = product.stock === 0 ? 'Agotado' : product.stock <= 3 ? `Solo ${product.stock}` : `${product.stock} uds.`;
  const stockColor = product.stock === 0 ? 'text-red-500' : product.stock <= 3 ? 'text-tertiary' : 'text-primary';

  return (
    <div className="flex-shrink-0 w-full liquid-glass rounded-[2rem] overflow-hidden group transition-all duration-500 hover:-translate-y-1 hover:shadow-lg">
      {/* Image */}
      <div className="h-64 overflow-hidden relative">
        {product.imageUrl && !imgError ? (
          <Image src={product.imageUrl} alt={product.name} fill
            className="object-cover group-hover:scale-105 transition-transform duration-1000"
            onError={() => setImgError(true)} unoptimized />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary-container/30">
            <span className="text-6xl opacity-60">{product.category?.icon ?? '💍'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
        <div className={`absolute top-3 right-3 text-xs font-semibold font-sans tracking-wide ${stockColor}`}
          style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', padding: '3px 10px', borderRadius: '999px', border: '0.5px solid rgba(255,255,255,0.4)' }}>
          {stockLabel}
        </div>
      </div>

      {/* Info */}
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
            ${Number(product.price).toLocaleString('es-CL')}
          </p>
        )}

        <div className="flex gap-2">
          <Link href={`/productos/${product.id}`}
            className="flex-1 text-center text-xs font-semibold font-sans py-2 rounded-xl liquid-glass-dark text-primary hover:bg-primary-container/40 transition-colors">
            Ver detalle
          </Link>
          <Link href={`/productos/${product.id}/editar`}
            className="flex-1 text-center text-xs font-semibold font-sans py-2 rounded-xl bg-tertiary-container/50 text-on-tertiary-container hover:bg-tertiary-container/70 transition-colors">
            Editar
          </Link>
          <button onClick={() => onDelete(product.id)}
            className="px-3 py-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors text-xs">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
