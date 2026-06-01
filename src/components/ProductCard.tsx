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

export default function ProductCard({ product, onDelete }: Props) {
  const [imgError, setImgError] = useState(false);

  const stockColor =
    product.stock === 0
      ? 'text-red-600 bg-red-50'
      : product.stock <= 3
      ? 'text-amber-600 bg-amber-50'
      : 'text-green-600 bg-green-50';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative h-48 bg-gradient-to-br from-violet-50 to-amber-50">
        {product.imageUrl && !imgError ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
            <span className="text-5xl">{product.category?.icon ?? '🛍️'}</span>
            <span className="text-xs mt-2">Sin imagen</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stockColor}`}>
            Stock: {product.stock}
          </span>
        </div>
      </div>

      <div className="p-4">
        {product.category && (
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${product.category.color ?? 'bg-gray-100 text-gray-700'}`}>
            {product.category.icon} {product.category.name}
          </span>
        )}

        <h3 className="font-semibold text-gray-800 text-base leading-tight mb-1 line-clamp-1">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-gray-500 text-xs line-clamp-2 mb-3">{product.description}</p>
        )}

        {product.price && (
          <p className="text-violet-700 font-bold text-lg mb-3">
            ${Number(product.price).toLocaleString('es-CL')}
          </p>
        )}

        <div className="flex gap-2 mt-auto">
          <Link
            href={`/productos/${product.id}`}
            className="flex-1 text-center text-xs font-medium px-3 py-2 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
          >
            Ver detalle
          </Link>
          <Link
            href={`/productos/${product.id}/editar`}
            className="flex-1 text-center text-xs font-medium px-3 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
          >
            Editar
          </Link>
          <button
            onClick={() => onDelete(product.id)}
            className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-medium"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
