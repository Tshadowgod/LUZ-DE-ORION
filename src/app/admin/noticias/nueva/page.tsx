import Link from 'next/link';
import AnnouncementForm from '../AnnouncementForm';

export default function AdminNuevaNoticiaPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-8 text-sm font-sans animate-fade-in">
        <Link href="/admin/noticias" className="text-on-surface-variant/60 hover:text-primary hover:-translate-x-0.5 transition-all inline-block">← Noticias</Link>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface-variant font-medium">Nueva noticia</span>
      </div>
      <div className="liquid-glass glossy-reflection rounded-[2.5rem] p-8 animate-scale-in">
        <p className="text-[11px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase mb-1">NUEVA NOTICIA</p>
        <h2 className="font-display text-2xl font-semibold text-on-background mb-6">Crear publicación</h2>
        <AnnouncementForm mode="create" />
      </div>
    </div>
  );
}
