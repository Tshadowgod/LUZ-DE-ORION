export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import ProductForm from '@/components/ProductForm';
import Link from 'next/link';

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, Number(id)));

  if (!product) notFound();

  const cats = await db.select().from(categories).orderBy(categories.name);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/productos" className="text-gray-400 hover:text-gray-600 transition-colors">
          ← Inventario
        </Link>
        <span className="text-gray-300">/</span>
        <Link
          href={`/productos/${product.id}`}
          className="text-gray-400 hover:text-gray-600 transition-colors truncate max-w-40"
        >
          {product.name}
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-violet-900">Editar</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
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
