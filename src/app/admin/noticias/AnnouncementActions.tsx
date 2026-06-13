'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Props = { id: number; isActive: boolean; editHref: string };

export default function AnnouncementActions({ id, isActive, editHref }: Props) {
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    setLoading(true);
    try {
      await fetch(`/api/noticias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !active }),
      });
      setActive(!active);
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta noticia?')) return;
    await fetch(`/api/noticias/${id}`, { method: 'DELETE' });
    router.refresh();
  };

  return (
    <div className="flex gap-2 px-4 pb-4">
      <button onClick={toggle} disabled={loading}
        className={`flex-1 text-center text-xs font-semibold font-sans py-2 rounded-xl transition-all duration-300 active:scale-95 ${
          active ? 'bg-surface-container text-on-surface-variant hover:bg-red-50 hover:text-red-400' : 'bg-primary-container/40 text-primary hover:bg-primary/20'
        }`}>
        {loading ? '...' : active ? 'Desactivar' : 'Activar'}
      </button>
      <Link href={editHref}
        className="flex-1 text-center text-xs font-semibold font-sans py-2 rounded-xl bg-tertiary-container/50 text-on-tertiary-container hover:bg-tertiary-container/70 transition-all duration-300 active:scale-95">
        ✏️ Editar
      </Link>
      <button onClick={handleDelete}
        className="px-3 py-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:scale-105 transition-all duration-300 active:scale-95 text-xs">
        ✕
      </button>
    </div>
  );
}
