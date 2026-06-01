'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type Category = { id: number; name: string; slug: string; icon: string | null; color: string | null };

type FormData = {
  name: string; description: string; price: string;
  stock: string; categoryId: string; imageUrl: string;
};

type Props = {
  categories: Category[];
  initialData?: Partial<FormData>;
  productId?: number;
  mode: 'create' | 'edit';
};

export default function ProductForm({ categories, initialData, productId, mode }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    price: initialData?.price ?? '',
    stock: initialData?.stock ?? '0',
    categoryId: initialData?.categoryId ?? '',
    imageUrl: initialData?.imageUrl ?? '',
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(initialData?.imageUrl ?? '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'imageUrl') setPreviewUrl(value);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al subir imagen');
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
      setPreviewUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = mode === 'create' ? '/api/productos' : `/api/productos/${productId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: form.price ? Number(form.price) : null,
          stock: Number(form.stock),
          categoryId: Number(form.categoryId),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar');
      router.push('/productos');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar producto');
    } finally {
      setSaving(false);
    }
  };

  const labelClass = 'block text-sm font-medium text-white/60 mb-1.5';
  const inputClass = 'glass-input w-full px-4 py-2.5 rounded-xl text-sm';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className={labelClass}>Nombre del producto <span className="text-red-400">*</span></label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required
            placeholder="Ej: Anillo de oro con zirconia" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Categoría <span className="text-red-400">*</span></label>
          <select name="categoryId" value={form.categoryId} onChange={handleChange} required
            className={`glass-select w-full px-4 py-2.5 rounded-xl text-sm`}>
            <option value="">Seleccionar categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Stock</label>
          <input type="number" name="stock" value={form.stock} onChange={handleChange}
            min="0" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Precio (CLP)</label>
          <input type="number" name="price" value={form.price} onChange={handleChange}
            min="0" step="0.01" placeholder="0" className={inputClass} />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Descripción</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            rows={3} placeholder="Breve descripción del producto…"
            className={`${inputClass} resize-none`} />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Imagen</label>
          <div className="flex gap-4 items-start">
            <div className="flex-1 space-y-2">
              <input type="url" name="imageUrl" value={form.imageUrl} onChange={handleChange}
                placeholder="https://… (pegar URL de imagen)" className={inputClass} />
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/30">o</span>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-sm px-4 py-2 rounded-xl glass-btn disabled:opacity-50">
                  {uploading ? 'Subiendo…' : '📁 Subir archivo'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*"
                  onChange={handleFileUpload} className="hidden" />
              </div>
            </div>

            {previewUrl && (
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <Image src={previewUrl} alt="Preview" fill className="object-cover"
                  unoptimized onError={() => setPreviewUrl('')} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="flex-1 px-4 py-3 rounded-xl text-sm font-medium glass-btn">
          Cancelar
        </button>
        <button type="submit" disabled={saving || uploading}
          className="flex-1 px-4 py-3 rounded-xl text-sm font-medium glass-btn-primary">
          {saving ? 'Guardando…' : mode === 'create' ? 'Agregar producto' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
