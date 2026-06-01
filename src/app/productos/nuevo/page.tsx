export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import ProductForm from '@/components/ProductForm';
import Link from 'next/link';

export default async function NuevoProductoPage() {
  const cats = await db.select().from(categories).orderBy(categories.name);
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-8 text-sm font-sans">
        <Link href="/productos" className="text-on-surface-variant/60 hover:text-primary transition-colors">← Catálogo</Link>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface-variant font-medium">Nueva pieza</span>
      </div>
      <div className="liquid-glass glossy-reflection rounded-[2.5rem] p-8">
        <p className="text-[11px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase mb-1">NUEVA PIEZA</p>
        <h2 className="font-display text-2xl font-semibold text-on-background mb-6">Agregar al catálogo</h2>
        <ProductForm categories={cats} mode="create" />
      </div>
    </div>
  );
}
