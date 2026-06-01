export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import ProductForm from '@/components/ProductForm';
import Link from 'next/link';

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product] = await db.select().from(products).where(eq(products.id, Number(id)));
  if (!product) notFound();

  const cats = await db.select().from(categories).orderBy(categories.name);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-8 text-sm">
        <Link href="/productos" className="text-white/40 hover:text-white/70 transition-colors">← Inventario</Link>
        <span className="text-white/20">/</span>
        <Link href={`/productos/${product.id}`} className="text-white/40 hover:text-white/70 transition-colors truncate max-w-36">
          {product.name}
        </Link>
        <span className="text-white/20">/</span>
        <span className="text-white/80 font-semibold">Editar</span>
      </div>

      <div className="glass-card rounded-3xl p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Editar producto</h2>
          <p className="text-white/40 text-sm mt-1 truncate">{product.name}</p>
        </div>
        <ProductForm
          categories={cats}
          mode="edit"
          productId={product.id}
          initialData={{
            name: product.name,
            description: product.description ?? '',
            price: product.price ?? '',
            stock: String(product.stock),
            categoryId: String(product.categoryId),
            imageUrl: product.imageUrl ?? '',
          }}
        />
      </div>
    </div>
  );
}
