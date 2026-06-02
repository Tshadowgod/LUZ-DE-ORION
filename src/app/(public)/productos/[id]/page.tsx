export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import Image from 'next/image';
import Link from 'next/link';
import AddToCartButton from './AddToCartButton';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product] = await db
    .select({
      id: products.id, name: products.name, description: products.description,
      price: products.price, stock: products.stock, imageUrl: products.imageUrl,
      createdAt: products.createdAt,
      category: { id: categories.id, name: categories.name, slug: categories.slug,
                   icon: categories.icon, color: categories.color },
    })
    .from(products).leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, Number(id)));

  if (!product) notFound();

  const stockLabel = product.stock === 0 ? 'Agotado' : product.stock <= 3 ? `Solo ${product.stock} disponibles` : `${product.stock} en stock`;
  const stockColor = product.stock === 0 ? 'text-red-500 bg-red-50 border-red-100' : product.stock <= 3 ? 'text-tertiary bg-tertiary-container/30 border-tertiary/20' : 'text-primary bg-primary-container/40 border-primary/20';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-8 text-sm font-sans">
        <Link href="/productos" className="text-on-surface-variant/60 hover:text-primary transition-colors">← Catálogo</Link>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface-variant font-medium truncate">{product.name}</span>
      </div>

      <div className="liquid-glass glossy-reflection rounded-[2.5rem] overflow-hidden">
        <div className="relative h-80 overflow-hidden">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />
          ) : (
            <div className="absolute inset-0 bg-primary-container/20 flex items-center justify-center">
              <span className="text-9xl opacity-30">{product.category?.icon ?? '💍'}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent" />
        </div>

        <div className="p-8 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              {product.category && (
                <p className="text-[10px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase mb-2">
                  {product.category.icon} {product.category.name}
                </p>
              )}
              <h1 className="font-display text-2xl font-semibold text-on-background">{product.name}</h1>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold font-sans border ${stockColor}`}>
              {stockLabel}
            </span>
          </div>

          {product.description && (
            <p className="text-on-surface-variant text-sm font-sans leading-relaxed">{product.description}</p>
          )}

          {product.price && (
            <p className="font-display text-3xl font-semibold text-primary">
              ${Number(product.price).toLocaleString('es-CL')}
            </p>
          )}

          <p className="text-xs text-on-surface-variant/50 font-sans pt-2 border-t border-outline-variant/30">
            Agregado el {new Date(product.createdAt).toLocaleDateString('es-CL', { dateStyle: 'long' })}
          </p>

          <div className="flex gap-3 pt-1">
            <AddToCartButton product={{
              id: product.id, name: product.name, price: product.price,
              imageUrl: product.imageUrl, categoryIcon: product.category?.icon ?? null,
              stock: product.stock,
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
