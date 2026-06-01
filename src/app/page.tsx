export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/schema';
import { eq, count, sum, lte } from 'drizzle-orm';

async function getStats() {
  const [totalProducts] = await db.select({ count: count() }).from(products);
  const [totalStock]    = await db.select({ total: sum(products.stock) }).from(products);
  const [totalCats]     = await db.select({ count: count() }).from(categories);
  const [lowStock]      = await db.select({ count: count() }).from(products).where(lte(products.stock, 3));

  const byCategory = await db
    .select({
      name: categories.name,
      slug: categories.slug,
      icon: categories.icon,
      count: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id, categories.name, categories.slug, categories.icon)
    .orderBy(categories.name);

  return {
    totalProducts: totalProducts.count,
    totalStock: Number(totalStock.total ?? 0),
    totalCategories: totalCats.count,
    lowStock: lowStock.count,
    byCategory,
  };
}

const catGlowMap: Record<string, { glow: string; text: string; border: string }> = {
  anillos:       { glow: 'rgba(236,72,153,0.25)',  text: '#f9a8d4', border: 'rgba(236,72,153,0.3)'  },
  collares:      { glow: 'rgba(139,92,246,0.25)',  text: '#c4b5fd', border: 'rgba(139,92,246,0.3)'  },
  aritos:        { glow: 'rgba(245,158,11,0.25)',  text: '#fde68a', border: 'rgba(245,158,11,0.3)'  },
  joyeros:       { glow: 'rgba(59,130,246,0.25)',  text: '#93c5fd', border: 'rgba(59,130,246,0.3)'  },
  llaveros:      { glow: 'rgba(16,185,129,0.25)',  text: '#6ee7b7', border: 'rgba(16,185,129,0.3)'  },
  desinfectante: { glow: 'rgba(6,182,212,0.25)',   text: '#67e8f9', border: 'rgba(6,182,212,0.3)'   },
};

export default async function DashboardPage() {
  let stats;
  let dbError = false;
  try { stats = await getStats(); } catch { dbError = true; }

  if (dbError || !stats) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', boxShadow: '0 0 30px rgba(251,191,36,0.2)' }}>
          <span className="text-4xl">✨</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Bienvenida a Luz de Orion</h1>
        <p className="text-white/50 mb-8 max-w-md">Configura la base de datos Neon para comenzar.</p>
        <div className="glass-card rounded-2xl p-6 max-w-lg w-full text-left">
          <h2 className="font-semibold text-amber-300 mb-3">⚙️ Pasos para configurar:</h2>
          <ol className="text-sm text-white/60 space-y-2 list-decimal list-inside">
            <li>Crea una base de datos en <strong className="text-white/80">neon.tech</strong></li>
            <li>Pega el Connection String en <code className="text-amber-300/80">.env.local</code></li>
            <li>Ejecuta <code className="text-amber-300/80">npm run db:push</code></li>
            <li>Haz click en <strong className="text-white/80">Inicializar categorías</strong></li>
          </ol>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Productos', value: stats.totalProducts, icon: '📦',
      glow: 'rgba(139,92,246,0.3)', border: 'rgba(139,92,246,0.25)', text: '#c4b5fd' },
    { label: 'Unidades en stock', value: stats.totalStock, icon: '🏪',
      glow: 'rgba(251,191,36,0.3)', border: 'rgba(251,191,36,0.25)', text: '#fde68a' },
    { label: 'Categorías', value: stats.totalCategories, icon: '🗂️',
      glow: 'rgba(16,185,129,0.3)', border: 'rgba(16,185,129,0.25)', text: '#6ee7b7' },
    { label: 'Stock bajo (≤3)', value: stats.lowStock, icon: '⚠️',
      glow: 'rgba(239,68,68,0.3)', border: 'rgba(239,68,68,0.25)', text: '#fca5a5' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            ✨ <span className="text-gradient-amber">Luz de Orion</span>
          </h1>
          <p className="text-white/40 mt-1 text-sm">Panel de inventario</p>
        </div>
        <Link href="/productos/nuevo"
          className="glass-btn-primary px-5 py-2.5 rounded-xl font-medium text-sm">
          + Agregar producto
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="glass-card rounded-2xl p-5"
            style={{ boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 30px ${card.glow}, inset 0 1px 0 rgba(255,255,255,0.12)` }}>
            <div className="text-3xl mb-3 filter drop-shadow-lg">{card.icon}</div>
            <div className="text-3xl font-bold mb-1" style={{ color: card.text }}>{card.value}</div>
            <div className="text-xs text-white/45">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Categories grid */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-semibold text-white/80 mb-5 text-sm uppercase tracking-wider">
          Productos por categoría
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.byCategory.map((cat) => {
            const cc = catGlowMap[cat.slug] ?? { glow: 'rgba(255,255,255,0.1)', text: '#e2e8f0', border: 'rgba(255,255,255,0.2)' };
            return (
              <Link key={cat.name} href={`/productos?categoria=${cat.slug}`}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 hover:scale-105 text-center"
                style={{ background: `${cc.glow.replace('0.25','0.08')}`, border: `1px solid ${cc.border.replace('0.3','0.15')}` }}
              >
                <span className="text-3xl filter drop-shadow-lg">{cat.icon}</span>
                <span className="text-xs font-medium" style={{ color: cc.text }}>{cat.name}</span>
                <span className="text-lg font-bold text-white">{cat.count}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <Link href="/productos"
        className="block text-center py-3 rounded-2xl glass-btn text-sm font-medium">
        Ver todo el inventario →
      </Link>
    </div>
  );
}
