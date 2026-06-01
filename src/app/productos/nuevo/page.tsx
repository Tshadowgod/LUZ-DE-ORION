export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import ProductForm from '@/components/ProductForm';
import Link from 'next/link';

export default async function NuevoProductoPage() {
  const cats = await db.select().from(categories).orderBy(categories.name);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/productos" className="text-gray-400 hover:text-gray-600 transition-colors">
          ← Inventario
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-violet-900">Agregar producto</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <ProductForm categories={cats} mode="create" />
      </div>
    </div>
  );
}
