'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type FormData = { title: string; description: string; imageUrl: string; isActive: boolean };
type Props = { mode: 'create' | 'edit'; announcementId?: number; initialData?: Partial<FormData> };

export default function AnnouncementForm({ mode, announcementId, initialData }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormData>({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    imageUrl: initialData?.imageUrl ?? '',
    isActive: initialData?.isActive ?? true,
  });
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [preview,   setPreview]   = useState(initialData?.imageUrl ?? '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setForm(prev => ({ ...prev, [name]: checked !== undefined ? checked : value }));
    if (name === 'imageUrl') setPreview(value);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al subir');
      setForm(prev => ({ ...prev, imageUrl: data.url }));
      setPreview(data.url);
    } catch (err) { setError(err instanceof Error ? err.message : 'Error'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const url    = mode === 'create' ? '/api/noticias' : `/api/noticias/${announcementId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar');
      router.push('/admin/noticias'); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Error'); }
    finally { setSaving(false); }
  };

  const inputClass = 'liquid-glass-input w-full px-4 py-3 rounded-2xl text-sm font-sans';
  const labelClass = 'block text-xs font-semibold font-sans tracking-wider uppercase text-on-surface-variant mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-2xl px-4 py-3 text-sm font-sans bg-red-50 border border-red-100 text-red-600">
          ⚠️ {error}
        </div>
      )}

      <div>
        <label className={labelClass}>Título <span className="text-red-400">*</span></label>
        <input type="text" name="title" value={form.title} onChange={handleChange} required
          placeholder="Ej: ¡Liquidación de temporada!" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Descripción</label>
        <textarea name="description" value={form.description} onChange={handleChange}
          rows={3} placeholder="Descripción breve del anuncio…"
          className={`${inputClass} resize-none`} />
      </div>

      <div>
        <label className={labelClass}>Imagen</label>
        <div className="flex gap-4 items-start">
          <div className="flex-1 space-y-2">
            <input type="url" name="imageUrl" value={form.imageUrl} onChange={handleChange}
              placeholder="https://… (URL de imagen)" className={inputClass} />
            <div className="flex items-center gap-3">
              <span className="text-xs text-on-surface-variant/40 font-sans">o</span>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="text-xs font-semibold font-sans px-4 py-2 rounded-xl liquid-glass-dark text-primary hover:bg-primary-container/40 transition-colors disabled:opacity-50">
                {uploading ? 'Subiendo…' : '📁 Subir archivo'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </div>
          </div>
          {preview && (
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-white/40">
              <Image src={preview} alt="Preview" fill className="object-cover"
                unoptimized onError={() => setPreview('')} />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 liquid-glass-dark rounded-2xl px-4 py-3">
        <input type="checkbox" name="isActive" id="isActive" checked={form.isActive} onChange={handleChange}
          className="w-5 h-5 rounded-lg accent-primary" />
        <div>
          <label htmlFor="isActive" className="text-sm font-semibold font-sans text-on-background cursor-pointer">
            Publicar en carrusel
          </label>
          <p className="text-xs text-on-surface-variant font-sans">Visible para clientes en la página principal</p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="flex-1 px-4 py-3 rounded-2xl text-sm font-semibold font-sans liquid-glass-dark text-on-surface-variant hover:bg-primary-container/30 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={saving || uploading}
          className="flex-1 px-4 py-3 rounded-2xl text-sm font-semibold font-sans bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50">
          {saving ? 'Guardando…' : mode === 'create' ? 'Publicar noticia' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
