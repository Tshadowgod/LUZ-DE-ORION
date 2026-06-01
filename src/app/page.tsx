export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/schema';
import { eq, count, sum, lte } from 'drizzle-orm';

async function getStats() {
  const [totalProducts] = await db.select({ count: count() }).from(products);
  const [totalStock] = await db.select({ total: sum(products.stock) }).from(products);
  const [totalCategories] = await db.select({ count: count() }).from(categories);
  const [lowStock] = await db
    .select({ count: count() })
    .from(products)
    .where(lte(products.stock, 3));

  const byCategory = await db
    .select({
      name: categories.name,
      icon: categories.icon,
      color: categories.color,
      count: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id, categories.name, categories.icon, categories.color)
    .orderBy(categories.name);

  return {
    totalProducts: totalProducts.count,
    totalStock: Number(totalStock.total ?? 0),
    totalCategories: totalCategories.count,
    lowStock: lowStock.count,
    byCategory,
  };
}

export default async function DashboardPage() {
  let stats;
  let dbError = false;

  try {
    stats = await getStats();
  } catch {
    dbError = true;
  }

  if (dbError || !stats) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">✨</span>
        </div>
        <h1 className="text-3xl font-bold text-violet-900 mb-2">Bienvenida a Luz de Orion</h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Para comenzar, configura la conexión a tu base de datos Neon y luego inicializa las categorías.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 max-w-lg w-full text-left mb-6">
          <h2 className="font-semibold text-amber-900 mb-3">⚙️ Pasos para configurar:</h2>
          <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside">
            <li>Crea una base de datos en <strong>neon.tech</strong></li>
            <li>Copia el Connection String y pégalo en <code className="bg-amber-100 px-1 rounded">.env.local</code> como <code className="bg-amber-100 px-1 rounded">DATABASE_URL</code></li>
            <li>Ejecuta <code className="bg-amber-100 px-1 rounded">npm run db:push</code> para crear las tablas</li>
            <li>Haz click en el botón de abajo para crear las categorías</li>
          </ol>
        </div>
        <form action={async () => {
          'use server';
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/seed`, { method: 'POST' });
        }}>
          <button
            type="submit"
            className="px-6 py-3 bg-violet-800 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors"
          >
            Inicializar categorías
          </button>
        </form>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Productos', value: stats.totalProducts, icon: '📦', color: 'bg-violet-50 text-violet-800 border-violet-100' },
    { label: 'Unidades en stock', value: stats.totalStock, icon: '🏪', color: 'bg-amber-50 text-amber-800 border-amber-100' },
    { label: 'Categorías', value: stats.totalCategories, icon: '🗂️', color: 'bg-emerald-50 text-emerald-800 border-emerald-100' },
    { label: 'Stock bajo (≤3)', value: stats.lowStock, icon: '⚠️', color: 'bg-red-50 text-red-800 border-red-100' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-violet-900">
            ✨ Bienvenida, Luz de Orion
          </h1>
          <p className="text-gray-500 mt-1">Resumen de tu inventario de joyería</p>
        </div>
        <Link
          href="/productos/nuevo"
          className="px-5 py-2.5 bg-violet-800 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors text-sm shadow-sm"
        >
          + Agregar producto
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border p-5 ${card.color}`}>
            <div className="text-3xl mb-3">{card.icon}</div>
            <div className="text-3xl font-bold mb-1">{card.value}</div>
            <div className="text-sm opacity-80">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Productos por categoría</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.byCategory.map((cat) => (
            <Link
              key={cat.name}
              href={`/productos?categoria=${cat.name.toLowerCase()}`}
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 text-center"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="text-sm font-medium text-gray-700">{cat.name}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.color ?? 'bg-gray-100 text-gray-600'}`}>
                {cat.count}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Link
          href="/productos"
          className="flex-1 text-center py-3 rounded-xl border border-violet-200 text-violet-700 font-medium hover:bg-violet-50 transition-colors text-sm"
        >
          Ver todo el inventario →
        </Link>
      </div>
    </div>
  );
}
