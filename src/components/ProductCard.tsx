'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type Category = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
};

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
  stock: number;
  imageUrl: string | null;
  category: Category | null;
};

type Props = {
  product: Product;
  onDelete: (id: number) => void;
};

const catColors: Record<string, { bg: string; text: string; border: string }> = {
  anillos:       { bg: 'rgba(236,72,153,0.15)',  text: '#f9a8d4', border: 'rgba(236,72,153,0.35)'  },
  collares:      { bg: 'rgba(139,92,246,0.15)',  text: '#c4b5fd', border: 'rgba(139,92,246,0.35)'  },
  aritos:        { bg: 'rgba(245,158,11,0.15)',  text: '#fde68a', border: 'rgba(245,158,11,0.35)'  },
  joyeros:       { bg: 'rgba(59,130,246,0.15)',  text: '#93c5fd', border: 'rgba(59,130,246,0.35)'  },
  llaveros:      { bg: 'rgba(16,185,129,0.15)',  text: '#6ee7b7', border: 'rgba(16,185,129,0.35)'  },
  desinfectante: { bg: 'rgba(6,182,212,0.15)',   text: '#67e8f9', border: 'rgba(6,182,212,0.35)'   },
};

export default function ProductCard({ product, onDelete }: Props) {
  const [imgError, setImgError] = useState(false);

  const slug = product.category?.slug ?? '';
  const cc = catColors[slug] ?? { bg: 'rgba(255,255,255,0.08)', text: '#e2e8f0', border: 'rgba(255,255,255,0.2)' };

  const stockStyle =
    product.stock === 0
      ? { bg: 'rgba(239,68,68,0.15)', text: '#fca5a5', border: 'rgba(239,68,68,0.3)' }
      : product.stock <= 3
      ? { bg: 'rgba(245,158,11,0.15)', text: '#fde68a', border: 'rgba(245,158,11,0.3)' }
      : { bg: 'rgba(16,185,129,0.12)', text: '#6ee7b7', border: 'rgba(16,185,129,0.3)' };

  return (
    <div className="glass-card rounded-3xl overflow-hidden group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {product.imageUrl && !imgError ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: `radial-gradient(circle at 50% 60%, ${cc.bg.replace('0.15','0.25')}, transparent 70%)` }}>
            <span className="text-6xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              {product.category?.icon ?? '🛍️'}
            </span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Stock badge */}
        <div className="absolute top-3 right-3">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm"
            style={{ background: stockStyle.bg, color: stockStyle.text, border: `1px solid ${stockStyle.border}` }}
          >
            Stock: {product.stock}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Category badge */}
        {product.category && (
          <span
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: cc.bg, color: cc.text, border: `1px solid ${cc.border}` }}
          >
            {product.category.icon} {product.category.name}
          </span>
        )}

        <h3 className="font-semibold text-white/90 text-base leading-tight line-clamp-1">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-white/45 text-xs line-clamp-2 leading-relaxed">{product.description}</p>
        )}

        {product.price && (
          <p className="text-gradient-amber font-bold text-lg">
            ${Number(product.price).toLocaleString('es-CL')}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Link
            href={`/productos/${product.id}`}
            className="flex-1 text-center text-xs font-medium px-3 py-2 rounded-xl glass-btn"
          >
            Ver
          </Link>
          <Link
            href={`/productos/${product.id}/editar`}
            className="flex-1 text-center text-xs font-medium px-3 py-2 rounded-xl glass-btn-amber"
          >
            Editar
          </Link>
          <button
            onClick={() => onDelete(product.id)}
            className="px-3 py-2 rounded-xl text-xs font-medium glass-btn-red"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
