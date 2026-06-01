export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import Image from 'next/image';
import Link from 'next/link';
import DeleteButton from './DeleteButton';

async function getProduct(id: number) {
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      stock: products.stock,
      imageUrl: products.imageUrl,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        color: categories.color,
      },
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

  const stockColor =
    product.stock === 0
      ? 'text-red-600 bg-red-50 border-red-100'
      : product.stock <= 3
      ? 'text-amber-600 bg-amber-50 border-amber-100'
      : 'text-green-600 bg-green-50 border-green-100';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/productos" className="text-gray-400 hover:text-gray-600 transition-colors">
          ← Inventario
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-600 truncate">{product.name}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="relative h-72 bg-gradient-to-br from-violet-50 to-amber-50">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
              <span className="text-8xl">{product.category?.icon ?? '🛍️'}</span>
              <span className="text-sm mt-3">Sin imagen</span>
            </div>
          )}
        </div>

        <div className="p-8 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              {product.category && (
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full mb-2 ${product.category.color ?? 'bg-gray-100 text-gray-700'}`}>
                  {product.category.icon} {product.category.name}
                </span>
              )}
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            </div>
            <div className={`px-4 py-2 rounded-xl border font-semibold text-sm ${stockColor}`}>
              Stock: {product.stock}
            </div>
          </div>

          {product.description && (
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          )}

          {product.price && (
            <div className="text-3xl font-bold text-violet-700">
              ${Number(product.price).toLocaleString('es-CL')}
            </div>
          )}

          <div className="text-xs text-gray-400 border-t border-gray-100 pt-4">
            Creado: {new Date(product.createdAt).toLocaleDateString('es-CL', { dateStyle: 'long' })}
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href={`/productos/${product.id}/editar`}
              className="flex-1 text-center px-4 py-3 rounded-xl bg-violet-800 text-white font-medium hover:bg-violet-700 transition-colors text-sm"
            >
              ✏️ Editar producto
            </Link>
            <DeleteButton productId={product.id} productName={product.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
