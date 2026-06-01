export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/schema';
import { eq, count, sum, lte, desc } from 'drizzle-orm';

async function getStats() {
  const [totalProducts] = await db.select({ count: count() }).from(products);
  const [totalStock]    = await db.select({ total: sum(products.stock) }).from(products);
  const [lowStock]      = await db.select({ count: count() }).from(products).where(lte(products.stock, 3));
  const byCategory = await db
    .select({ name: categories.name, slug: categories.slug, icon: categories.icon, count: count(products.id) })
    .from(categories).leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id, categories.name, categories.slug, categories.icon)
    .orderBy(categories.name);
  const recent = await db
    .select({ id: products.id, name: products.name, price: products.price,
               imageUrl: products.imageUrl, categoryIcon: categories.icon, categoryName: categories.name })
    .from(products).leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt)).limit(6);
  return { totalProducts: totalProducts.count, totalStock: Number(totalStock.total ?? 0), lowStock: lowStock.count, byCategory, recent };
}

export default async function DashboardPage() {
  let stats; let dbError = false;
  try { stats = await getStats(); } catch { dbError = true; }

  if (dbError || !stats) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-primary-container border border-white/40">
          <span className="text-4xl">✦</span>
        </div>
        <h1 className="font-display text-3xl font-semibold text-on-background mb-2">Bienvenida a Luz de Orion</h1>
        <p className="text-on-surface-variant mb-8 font-sans text-sm">Configura tu base de datos Neon para comenzar.</p>
        <div className="liquid-glass rounded-[2rem] p-6 max-w-md w-full text-left">
          <p className="text-xs font-bold tracking-[0.2em] text-tertiary font-sans uppercase mb-3">⚙️ Configuración</p>
          <ol className="text-sm text-on-surface-variant font-sans space-y-2 list-decimal list-inside">
            <li>Crea una BD en <strong className="text-primary">neon.tech</strong></li>
            <li>Pega el string en <code className="text-tertiary">.env.local</code></li>
            <li>Ejecuta <code className="text-tertiary">npm run db:push</code></li>
            <li>Llama a <code className="text-tertiary">POST /api/seed</code></li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <section>
        <p className="text-[11px] font-bold tracking-[0.2em] text-primary font-sans uppercase mb-1 opacity-80">
          BIENVENIDA DE NUEVO
        </p>
        <h2 className="font-display text-3xl font-semibold text-on-background leading-tight">
          Tu historia eterna con Luz de Orion.
        </h2>
      </section>

      {/* Hero glass card */}
      <section>
        <div className="liquid-glass glossy-reflection rounded-[2.5rem] p-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary-container/30 blur-[80px] rounded-full animate-float" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-tertiary-container/20 blur-[60px] rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-tertiary/8 p-2 rounded-full liquid-glass-dark border border-white/20">
                <span className="material-symbols-outlined text-tertiary text-xl"
                  style={{ fontVariationSettings: "'wght' 200, 'opsz' 24" }}>auto_awesome</span>
              </div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase">
                RESUMEN DEL CATÁLOGO
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { value: stats.totalProducts, label: 'Productos' },
                { value: stats.totalStock,    label: 'En stock' },
                { value: stats.lowStock,      label: 'Stock bajo' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="font-display text-3xl font-semibold text-primary">{s.value}</p>
                  <p className="text-xs text-on-surface-variant font-sans mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <Link href="/productos"
              className="inline-flex items-center gap-2 text-primary font-semibold font-sans text-sm liquid-glass-dark px-5 py-2.5 rounded-full hover:bg-white/40 transition-all">
              Ver catálogo completo
              <span className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'wght' 200, 'opsz' 20" }}>arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories bento */}
      <section>
        <div className="flex justify-between items-end mb-5">
          <h2 className="font-display text-2xl font-semibold text-on-background">Colecciones</h2>
          <Link href="/productos" className="text-[10px] font-bold tracking-[0.3em] font-sans text-primary border-b border-primary/30 pb-0.5 hover:opacity-60 transition-opacity uppercase">
            Ver todo
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stats.byCategory.slice(0, 4).map((cat, i) => (
            <Link key={cat.slug} href={`/productos?categoria=${cat.slug}`}
              className={`liquid-glass glossy-reflection rounded-[2rem] p-5 flex flex-col justify-between transition-all hover:-translate-y-1 ${i === 0 ? 'col-span-2 flex-row items-center' : ''}`}>
              <div>
                <span className={`text-4xl block mb-2 ${i === 0 ? 'mb-0 mr-4' : ''}`}>{cat.icon}</span>
                {i !== 0 && <p className="text-[10px] font-bold tracking-[0.15em] text-tertiary font-sans uppercase">{cat.name}</p>}
              </div>
              {i === 0 ? (
                <div>
                  <p className="font-display text-xl font-semibold text-on-background">{cat.name}</p>
                  <p className="text-on-surface-variant text-xs font-sans mt-0.5">{cat.count} piezas</p>
                </div>
              ) : (
                <p className="font-display text-2xl font-semibold text-primary mt-2">{cat.count}</p>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Recent products */}
      {stats.recent.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-5">
            <h2 className="font-display text-2xl font-semibold text-on-background">Piezas Recientes</h2>
            <Link href="/productos/nuevo"
              className="text-[10px] font-bold tracking-[0.3em] font-sans text-primary border-b border-primary/30 pb-0.5 hover:opacity-60 transition-opacity uppercase">
              Agregar
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scroll-hide pb-2 -mx-6 px-6">
            {stats.recent.map((p) => (
              <Link key={p.id} href={`/productos/${p.id}`}
                className="flex-shrink-0 w-44 liquid-glass rounded-[1.5rem] overflow-hidden hover:-translate-y-1 transition-all duration-300">
                <div className="h-44 bg-primary-container/20 flex items-center justify-center relative overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl opacity-50">{p.categoryIcon ?? '💍'}</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[9px] font-bold tracking-wider text-tertiary font-sans uppercase mb-0.5">{p.categoryName}</p>
                  <p className="font-display text-sm font-medium text-on-background line-clamp-1">{p.name}</p>
                  {p.price && <p className="text-primary font-bold text-sm font-sans mt-1">${Number(p.price).toLocaleString('es-CL')}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
