export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { announcements } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';
import AnnouncementActions from './AnnouncementActions';

export default async function AdminNoticiasPage() {
  const items = await db.select().from(announcements).orderBy(desc(announcements.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase mb-1">ADMIN</p>
          <h2 className="font-display text-3xl font-semibold text-on-background">Noticias</h2>
        </div>
        <Link href="/admin/noticias/nueva"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-white text-sm font-semibold font-sans hover:bg-primary/90 transition-colors">
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'wght' 200, 'opsz' 20" }}>add</span>
          Nueva
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">📢</span>
          <p className="font-display text-xl font-medium text-on-background">Sin noticias aún</p>
          <p className="text-on-surface-variant text-sm font-sans mt-1 mb-6">Crea tu primera promoción o anuncio</p>
          <Link href="/admin/noticias/nueva"
            className="inline-block px-6 py-3 rounded-full bg-primary text-white text-sm font-semibold font-sans hover:bg-primary/90 transition-colors">
            Crear primera noticia
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="liquid-glass rounded-[2rem] overflow-hidden">
              <div className="flex gap-4 p-4 items-start">
                <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-primary-container/20 flex items-center justify-center">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    : <span className="text-2xl">📢</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <h3 className="font-display text-base font-semibold text-on-background line-clamp-1">{item.title}</h3>
                    <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold font-sans uppercase tracking-wide ${
                      item.isActive ? 'bg-primary-container/40 text-primary' : 'bg-surface-container text-on-surface-variant/50'
                    }`}>
                      {item.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-on-surface-variant font-sans mt-1 line-clamp-2">{item.description}</p>
                  )}
                  <p className="text-[10px] text-on-surface-variant/50 font-sans mt-1">
                    {new Date(item.createdAt).toLocaleDateString('es-BO', { dateStyle: 'medium' })}
                  </p>
                </div>
              </div>
              <AnnouncementActions id={item.id} isActive={item.isActive} editHref={`/admin/noticias/${item.id}/editar`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
