'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type FormData = { name: string; icon: string; sortOrder: string };
type Props = { mode: 'create' | 'edit'; categoryId?: number; initialData?: Partial<FormData> };

// Emojis sugeridos para elegir con un toque; igual se puede escribir cualquiera.
const EMOJIS = ['💍', '📿', '🔗', '💠', '💎', '🔑', '🧴', '🛍️', '⌚', '👜', '👑', '✨', '🌙', '⭐', '🎀', '💐'];

export default function CategoryForm({ mode, categoryId, initialData }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    name: initialData?.name ?? '',
    icon: initialData?.icon ?? '',
    sortOrder: initialData?.sortOrder ?? '0',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const url = mode === 'create' ? '/api/categorias' : `/api/categorias/${categoryId}`;
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, icon: form.icon, sortOrder: Number(form.sortOrder) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar');
      router.push('/admin/categorias'); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Error'); }
    finally { setSaving(false); }
  };

  const inputClass = 'liquid-glass-input w-full px-4 py-3 rounded-2xl text-sm font-sans';
  const labelClass = 'block text-xs font-semibold font-sans tracking-wider uppercase text-on-surface-variant mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-up">
      {error && (
        <div className="rounded-2xl px-4 py-3 text-sm font-sans bg-red-50 border border-red-100 text-red-600 animate-scale-in">
          ⚠️ {error}
        </div>
      )}

      {/* Vista previa de como se vera la pestana en la tienda */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold font-sans tracking-wide bg-primary text-white shadow-md">
          {form.icon} {form.name || 'Nombre de la categoría'}
        </span>
      </div>

      <div>
        <label className={labelClass}>Nombre <span className="text-red-400">*</span></label>
        <input type="text" name="name" value={form.name} onChange={handleChange} required
          placeholder="Ej: Pulseras" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Ícono (emoji)</label>
        <input type="text" name="icon" value={form.icon} onChange={handleChange}
          placeholder="Ej: 🔗" maxLength={4} className={`${inputClass} text-center text-xl`} />
        <div className="flex flex-wrap gap-2 mt-3">
          {EMOJIS.map((emoji) => (
            <button key={emoji} type="button" onClick={() => setForm((prev) => ({ ...prev, icon: emoji }))}
              className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
                form.icon === emoji ? 'bg-primary/20 ring-2 ring-primary scale-105' : 'liquid-glass-dark hover:-translate-y-0.5'
              }`}>
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Orden</label>
        <input type="number" name="sortOrder" value={form.sortOrder} onChange={handleChange}
          className={inputClass} />
        <p className="text-[11px] text-on-surface-variant/60 font-sans mt-1.5">
          Menor número aparece primero en la tienda. Deja 0 si no te importa el orden.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="flex-1 px-4 py-3 rounded-2xl text-sm font-semibold font-sans liquid-glass-dark text-on-surface-variant hover:bg-primary-container/30 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={saving}
          className="glossy-reflection flex-1 px-4 py-3 rounded-2xl text-sm font-semibold font-sans bg-primary text-white hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0">
          {saving ? 'Guardando…' : mode === 'create' ? 'Crear categoría' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
