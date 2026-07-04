export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { products, categories, announcements } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import Carousel from '@/components/Carousel';

export default async function PublicHomePage() {
  let notices: { id: number; title: string; description: string | null; imageUrl: string | null }[] = [];
  let featured: { id: number; name: string; price: string | null; imageUrl: string | null; categoryIcon: string | null; categoryName: string | null }[] = [];
  let cats: { id: number; name: string; slug: string; icon: string | null }[] = [];

  try {
    // Las 3 consultas en paralelo: 1 sola espera de red en vez de 3 en serie.
    [notices, featured, cats] = await Promise.all([
      db.select({ id: announcements.id, title: announcements.title, description: announcements.description, imageUrl: announcements.imageUrl })
        .from(announcements).where(eq(announcements.isActive, true)).orderBy(desc(announcements.createdAt)).limit(5),
      db.select({
        id: products.id, name: products.name, price: products.price,
        imageUrl: products.imageUrl, categoryIcon: categories.icon, categoryName: categories.name,
      }).from(products).leftJoin(categories, eq(products.categoryId, categories.id))
        .orderBy(desc(products.createdAt)).limit(8),
      db.select({ id: categories.id, name: categories.name, slug: categories.slug, icon: categories.icon })
        .from(categories).orderBy(categories.name),
    ]);
  } catch { /* DB not ready */ }

  return (
    <div className="space-y-10">
      {/* Carousel */}
      <section className="animate-fade-up">
        <Carousel items={notices} />
      </section>

      {/* Welcome */}
      <section className="animate-fade-up stagger-1">
        <p className="text-[11px] font-bold tracking-[0.2em] text-primary font-sans uppercase mb-1 opacity-80">
          BIENVENIDA
        </p>
        <h2 className="font-display text-3xl font-semibold text-on-background leading-tight">
          Joyería artesanal para ti. ✨
        </h2>
      </section>

      {/* Categories */}
      {cats.length > 0 && (
        <section className="animate-fade-up stagger-2">
          <div className="flex justify-between items-end mb-4">
            <h2 className="font-display text-2xl font-semibold text-on-background">Colecciones</h2>
            <Link href="/productos" className="text-[10px] font-bold tracking-[0.3em] font-sans text-primary border-b border-primary/30 pb-0.5 uppercase hover:opacity-60 transition-opacity">
              Ver todo
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {cats.slice(0, 4).map((cat, i) => (
              <Link key={cat.slug} href={`/productos?categoria=${cat.slug}`}
                className={`liquid-glass glass-card glossy-reflection rounded-[2rem] p-5 flex flex-col animate-fade-up stagger-${Math.min(i + 2, 6)} ${i === 0 ? 'col-span-2 flex-row items-center gap-4' : ''}`}>
                <span className={`text-4xl ${i === 0 ? '' : 'mb-2 block'}`}>{cat.icon}</span>
                <div>
                  <p className="text-[10px] font-bold tracking-[0.15em] text-tertiary font-sans uppercase">{cat.name}</p>
                  {i === 0 && <p className="font-display text-lg font-semibold text-on-background mt-0.5">Ver colección</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="animate-fade-up stagger-3">
          <div className="flex justify-between items-end mb-4">
            <h2 className="font-display text-2xl font-semibold text-on-background">Lo Nuevo</h2>
            <Link href="/productos" className="text-[10px] font-bold tracking-[0.3em] font-sans text-primary border-b border-primary/30 pb-0.5 uppercase hover:opacity-60 transition-opacity">
              Ver todo
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scroll-hide pb-3 -mx-6 px-6">
            {featured.map((p, i) => (
              <Link key={p.id} href={`/productos/${p.id}`}
                className={`flex-shrink-0 w-44 liquid-glass glass-card glossy-reflection rounded-[1.5rem] overflow-hidden group animate-fade-up stagger-${Math.min(i + 3, 6)}`}>
                <div className="h-44 bg-primary-container/20 flex items-center justify-center relative overflow-hidden">
                  {p.imageUrl
                    ? <Image src={p.imageUrl} alt={p.name} fill sizes="176px"
                        className="object-cover group-hover:scale-110 transition-transform duration-[1200ms] ease-out" unoptimized />
                    : <span className="text-4xl opacity-50">{p.categoryIcon ?? '💍'}</span>
                  }
                </div>
                <div className="p-3">
                  <p className="text-[9px] font-bold tracking-wider text-tertiary font-sans uppercase mb-0.5">{p.categoryName}</p>
                  <p className="font-display text-sm font-medium text-on-background line-clamp-1">{p.name}</p>
                  {p.price && <p className="text-primary font-bold text-sm font-sans mt-1">Bs {Number(p.price).toLocaleString('es-BO')}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
