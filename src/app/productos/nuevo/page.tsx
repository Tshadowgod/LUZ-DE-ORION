export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import ProductForm from '@/components/ProductForm';
import Link from 'next/link';

export default async function NuevoProductoPage() {
  const cats = await db.select().from(categories).orderBy(categories.name);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        <Link href="/productos" className="text-white/40 hover:text-white/70 transition-colors">
          ← Inventario
        </Link>
        <span className="text-white/20">/</span>
        <h1 className="text-white/80 font-semibold">Agregar producto</h1>
      </div>

      <div className="glass-card rounded-3xl p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Nuevo producto</h2>
          <p className="text-white/40 text-sm mt-1">Completa la información del artículo</p>
        </div>
        <ProductForm categories={cats} mode="create" />
      </div>
    </div>
  );
}
