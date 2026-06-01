export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import Image from 'next/image';
import Link from 'next/link';
import DeleteButton from './DeleteButton';

const catColors: Record<string, { bg: string; text: string; border: string }> = {
  anillos:       { bg: 'rgba(236,72,153,0.15)',  text: '#f9a8d4', border: 'rgba(236,72,153,0.35)'  },
  collares:      { bg: 'rgba(139,92,246,0.15)',  text: '#c4b5fd', border: 'rgba(139,92,246,0.35)'  },
  aritos:        { bg: 'rgba(245,158,11,0.15)',  text: '#fde68a', border: 'rgba(245,158,11,0.35)'  },
  joyeros:       { bg: 'rgba(59,130,246,0.15)',  text: '#93c5fd', border: 'rgba(59,130,246,0.35)'  },
  llaveros:      { bg: 'rgba(16,185,129,0.15)',  text: '#6ee7b7', border: 'rgba(16,185,129,0.35)'  },
  desinfectante: { bg: 'rgba(6,182,212,0.15)',   text: '#67e8f9', border: 'rgba(6,182,212,0.35)'   },
};

async function getProduct(id: number) {
  const [product] = await db
    .select({
      id: products.id, name: products.name, description: products.description,
      price: products.price, stock: products.stock, imageUrl: products.imageUrl,
      createdAt: products.createdAt, updatedAt: products.updatedAt,
      category: { id: categories.id, name: categories.name, slug: categories.slug,
                  icon: categories.icon, color: categories.color },
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id));
  return product;
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(Number(id));
  if (!product) notFound();

  const cc   = catColors[product.category?.slug ?? ''] ?? { bg: 'rgba(255,255,255,0.08)', text: '#e2e8f0', border: 'rgba(255,255,255,0.2)' };
  const stockStyle =
    product.stock === 0
      ? { bg: 'rgba(239,68,68,0.15)', text: '#fca5a5', border: 'rgba(239,68,68,0.3)' }
      : product.stock <= 3
      ? { bg: 'rgba(245,158,11,0.15)', text: '#fde68a', border: 'rgba(245,158,11,0.3)' }
      : { bg: 'rgba(16,185,129,0.12)', text: '#6ee7b7', border: 'rgba(16,185,129,0.3)' };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-8 text-sm">
        <Link href="/productos" className="text-white/40 hover:text-white/70 transition-colors">← Inventario</Link>
        <span className="text-white/20">/</span>
        <span className="text-white/60 truncate">{product.name}</span>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden">
        {/* Image */}
        <div className="relative h-72 overflow-hidden">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill
              className="object-cover" unoptimized />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: `radial-gradient(circle at 50% 60%, ${cc.bg.replace('0.15','0.3')}, transparent 70%)` }}>
              <span className="text-9xl filter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                {product.category?.icon ?? '🛍️'}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>

        <div className="p-8 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              {product.category && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full mb-3"
                  style={{ background: cc.bg, color: cc.text, border: `1px solid ${cc.border}` }}>
                  {product.category.icon} {product.category.name}
                </span>
              )}
              <h1 className="text-2xl font-bold text-white">{product.name}</h1>
            </div>
            <span className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: stockStyle.bg, color: stockStyle.text, border: `1px solid ${stockStyle.border}` }}>
              Stock: {product.stock}
            </span>
          </div>

          {product.description && (
            <p className="text-white/55 leading-relaxed text-sm">{product.description}</p>
          )}

          {product.price && (
            <p className="text-3xl font-bold text-gradient-amber">
              ${Number(product.price).toLocaleString('es-CL')}
            </p>
          )}

          <div className="text-xs text-white/30 pt-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            Creado: {new Date(product.createdAt).toLocaleDateString('es-CL', { dateStyle: 'long' })}
          </div>

          <div className="flex gap-3 pt-1">
            <Link href={`/productos/${product.id}/editar`}
              className="flex-1 text-center px-4 py-3 rounded-xl text-sm font-medium glass-btn-primary">
              ✏️ Editar producto
            </Link>
            <DeleteButton productId={product.id} productName={product.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
