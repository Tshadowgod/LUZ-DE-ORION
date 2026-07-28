'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Props = { id: number; editHref: string };

export default function CategoryActions({ id, editHref }: Props) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'No se pudo eliminar');
        return;
      }
      router.refresh();
    } finally { setLoading(false); }
  };

  return (
    <div className="px-4 pb-4">
      <div className="flex gap-2">
        <Link href={editHref}
          className="flex-1 text-center text-xs font-semibold font-sans py-2 rounded-xl bg-tertiary-container/50 text-on-tertiary-container hover:bg-tertiary-container/70 transition-all duration-300 active:scale-95">
          ✏️ Editar
        </Link>
        <button onClick={handleDelete} disabled={loading}
          className="px-3 py-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:scale-105 transition-all duration-300 active:scale-95 text-xs disabled:opacity-50">
          {loading ? '...' : '✕'}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-red-500 font-sans mt-2 animate-scale-in">⚠️ {error}</p>
      )}
    </div>
  );
}
