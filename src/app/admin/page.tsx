export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { db } from '@/lib/db';
import { products, categories, announcements } from '@/lib/schema';
import { count, sum, lte, eq } from 'drizzle-orm';

export default async function AdminDashboardPage() {
  // Las 4 consultas en paralelo: 1 sola espera de red en vez de 4 en serie.
  const [[totalProducts], [totalStock], [lowStock], [activeNotices]] = await Promise.all([
    db.select({ count: count() }).from(products),
    db.select({ total: sum(products.stock) }).from(products),
    db.select({ count: count() }).from(products).where(lte(products.stock, 3)),
    db.select({ count: count() }).from(announcements).where(eq(announcements.isActive, true)),
  ]);

  const stats = [
    { value: totalProducts.count, label: 'Productos',  icon: 'inventory_2' },
    { value: Number(totalStock.total ?? 0), label: 'En stock', icon: 'layers'      },
    { value: lowStock.count,      label: 'Stock bajo', icon: 'warning'     },
    { value: activeNotices.count, label: 'Noticias',   icon: 'campaign'    },
  ];

  return (
    <div className="space-y-8">
      <section className="animate-fade-up">
        <p className="text-[11px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase mb-1">PANEL ADMIN</p>
        <h2 className="font-display text-3xl font-semibold text-on-background">Resumen</h2>
      </section>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <div key={s.label}
            className={`liquid-glass glass-card glossy-reflection rounded-[2rem] p-5 text-center animate-fade-up stagger-${i + 1}`}>
            <span className="material-symbols-outlined text-2xl text-primary mb-2 block"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 200, 'opsz' 24" }}>
              {s.icon}
            </span>
            <p className="font-display text-3xl font-semibold text-primary">{s.value}</p>
            <p className="text-xs text-on-surface-variant font-sans mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <section className="animate-fade-up stagger-3">
        <h3 className="font-display text-xl font-semibold text-on-background mb-4">Acciones rápidas</h3>
        <div className="space-y-3">
          {[
            { href: '/admin/catalogo/nuevo', icon: 'add_circle',  label: 'Agregar nueva pieza',       desc: 'Añadir producto al catálogo' },
            { href: '/admin/catalogo',       icon: 'inventory_2', label: 'Gestionar catálogo',         desc: 'Editar o eliminar productos' },
            { href: '/admin/noticias/nueva', icon: 'campaign',    label: 'Nueva noticia/promoción',    desc: 'Publicar en el carrusel' },
            { href: '/admin/noticias',       icon: 'newspaper',   label: 'Gestionar noticias',          desc: 'Activar, editar o eliminar noticias' },
          ].map((action, i) => (
            <Link key={action.href} href={action.href}
              className={`group flex items-center gap-4 liquid-glass glass-card glossy-reflection rounded-[1.5rem] p-4 animate-fade-up stagger-${Math.min(i + 3, 6)}`}>
              <div className="w-12 h-12 rounded-2xl bg-primary-container/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-primary-container/50 transition-all duration-300">
                <span className="material-symbols-outlined text-xl text-primary"
                  style={{ fontVariationSettings: "'wght' 200, 'opsz' 24" }}>
                  {action.icon}
                </span>
              </div>
              <div>
                <p className="font-sans font-semibold text-sm text-on-background">{action.label}</p>
                <p className="text-xs text-on-surface-variant font-sans mt-0.5">{action.desc}</p>
              </div>
              <span className="ml-auto material-symbols-outlined text-on-surface-variant/40 text-xl group-hover:translate-x-1 group-hover:text-primary transition-all duration-300"
                style={{ fontVariationSettings: "'wght' 200, 'opsz' 24" }}>
                chevron_right
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="pt-4 text-center animate-fade-in">
        <Link href="/" className="text-xs text-on-surface-variant/50 font-sans hover:text-primary transition-colors">
          Ver tienda pública →
        </Link>
      </div>
    </div>
  );
}
