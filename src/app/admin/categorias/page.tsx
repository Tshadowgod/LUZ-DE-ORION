export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { categories, products } from '@/lib/schema';
import { sql } from 'drizzle-orm';
import Link from 'next/link';
import CategoryActions from './CategoryActions';

export default async function AdminCategoriasPage() {
  const cats = await db.select().from(categories)
    .orderBy(categories.sortOrder, categories.name);

  // Cuantos productos tiene cada categoria (para mostrarlo y avisar si no
  // se puede eliminar todavia).
  const counts = await db
    .select({ categoryId: products.categoryId, count: sql<number>`count(*)::int` })
    .from(products)
    .groupBy(products.categoryId);
  const countByCat: Record<number, number> = {};
  for (const c of counts) countByCat[c.categoryId] = c.count;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 animate-fade-up">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase mb-1">ADMIN</p>
          <h2 className="font-display text-3xl font-semibold text-on-background">Categorías</h2>
        </div>
        <Link href="/admin/categorias/nueva"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-white text-sm font-semibold font-sans hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-300">
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'wght' 200, 'opsz' 20" }}>add</span>
          Nueva
        </Link>
      </div>

      <p className="text-sm text-on-surface-variant font-sans animate-fade-in">
        Estas son las pestañas que verán tus clientes en el catálogo. La opción “Todas” siempre aparece automáticamente.
      </p>

      {cats.length === 0 ? (
        <div className="text-center py-20 animate-scale-in">
          <span className="text-6xl block mb-4 animate-float">🏷️</span>
          <p className="font-display text-xl font-medium text-on-background">Sin categorías aún</p>
          <p className="text-on-surface-variant text-sm font-sans mt-1 mb-6">Crea tu primera categoría</p>
          <Link href="/admin/categorias/nueva"
            className="inline-block px-6 py-3 rounded-full bg-primary text-white text-sm font-semibold font-sans hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            Crear primera categoría
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cats.map((cat, i) => {
            const count = countByCat[cat.id] ?? 0;
            return (
              <div key={cat.id} className={`liquid-glass glass-card rounded-[2rem] overflow-hidden animate-fade-up stagger-${Math.min(i + 1, 6)}`}>
                <div className="flex gap-4 p-4 items-center">
                  <div className="w-14 h-14 rounded-2xl flex-shrink-0 bg-primary-container/20 flex items-center justify-center text-2xl">
                    {cat.icon || '🏷️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-base font-semibold text-on-background line-clamp-1">{cat.name}</h3>
                    <p className="text-xs text-on-surface-variant font-sans mt-0.5">
                      {count} {count === 1 ? 'pieza' : 'piezas'}
                    </p>
                  </div>
                  <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold font-sans uppercase tracking-wide bg-surface-container text-on-surface-variant/60">
                    Orden {cat.sortOrder}
                  </span>
                </div>
                <CategoryActions id={cat.id} editHref={`/admin/categorias/${cat.id}/editar`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
