export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { announcements } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import AnnouncementForm from '../../AnnouncementForm';

export default async function AdminEditarNoticiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item] = await db.select().from(announcements).where(eq(announcements.id, Number(id)));
  if (!item) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-8 text-sm font-sans animate-fade-in">
        <Link href="/admin/noticias" className="text-on-surface-variant/60 hover:text-primary hover:-translate-x-0.5 transition-all inline-block">← Noticias</Link>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface-variant font-medium truncate max-w-48">{item.title}</span>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface-variant font-medium">Editar</span>
      </div>
      <div className="liquid-glass glossy-reflection rounded-[2.5rem] p-8 animate-scale-in">
        <p className="text-[11px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase mb-1">EDITAR NOTICIA</p>
        <h2 className="font-display text-2xl font-semibold text-on-background mb-6">{item.title}</h2>
        <AnnouncementForm mode="edit" announcementId={item.id}
          initialData={{ title: item.title, description: item.description ?? '', imageUrl: item.imageUrl ?? '', isActive: item.isActive }} />
      </div>
    </div>
  );
}
