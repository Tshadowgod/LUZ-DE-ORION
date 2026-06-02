export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import ProductForm from '@/components/ProductForm';
import Link from 'next/link';

export default async function AdminEditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product] = await db.select().from(products).where(eq(products.id, Number(id)));
  if (!product) notFound();
  const cats = await db.select().from(categories).orderBy(categories.name);
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-8 text-sm font-sans">
        <Link href="/admin/catalogo" className="text-on-surface-variant/60 hover:text-primary transition-colors">← Catálogo</Link>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface-variant font-medium truncate max-w-40">{product.name}</span>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface-variant font-medium">Editar</span>
      </div>
      <div className="liquid-glass glossy-reflection rounded-[2.5rem] p-8">
        <p className="text-[11px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase mb-1">EDITAR PIEZA</p>
        <h2 className="font-display text-2xl font-semibold text-on-background mb-1">{product.name}</h2>
        <p className="text-on-surface-variant text-sm font-sans mb-6">Modifica los datos del artículo</p>
        <ProductForm categories={cats} mode="edit" productId={product.id} redirectTo="/admin/catalogo"
          initialData={{ name: product.name, description: product.description ?? '',
                         price: product.price ?? '', stock: String(product.stock),
                         categoryId: String(product.categoryId), imageUrl: product.imageUrl ?? '' }} />
      </div>
    </div>
  );
}
