export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import CategoryForm from '@/components/CategoryForm';
import Link from 'next/link';

export default async function AdminEditarCategoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [cat] = await db.select().from(categories).where(eq(categories.id, Number(id)));
  if (!cat) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-8 text-sm font-sans animate-fade-in">
        <Link href="/admin/categorias" className="text-on-surface-variant/60 hover:text-primary hover:-translate-x-0.5 transition-all inline-block">← Categorías</Link>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface-variant font-medium">Editar</span>
      </div>
      <div className="liquid-glass glossy-reflection rounded-[2.5rem] p-8 animate-scale-in">
        <p className="text-[11px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase mb-1">EDITAR CATEGORÍA</p>
        <h2 className="font-display text-2xl font-semibold text-on-background mb-6">{cat.name}</h2>
        <CategoryForm mode="edit" categoryId={cat.id} initialData={{
          name: cat.name,
          icon: cat.icon ?? '',
          sortOrder: String(cat.sortOrder),
        }} />
      </div>
    </div>
  );
}
