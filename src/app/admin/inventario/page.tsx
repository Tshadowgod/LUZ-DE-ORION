'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';

type Item = {
  id: number; name: string; imageUrl: string | null;
  price: string | null; cost: string | null; stock: number;
  categoryName: string | null; categoryIcon: string | null;
};
type Edit = { price: string; cost: string; stock: string };

const fmt = (n: number) => n.toLocaleString('es-BO', { maximumFractionDigits: 2 });

export default function InventarioPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [edits, setEdits] = useState<Record<number, Edit>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);

  const load = useCallback(() =>
    fetch('/api/inventario')
      .then(r => r.json())
      .then((data: Item[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems(prev => prev ?? [])),
  []);

  useEffect(() => { void load(); }, [load]);

  const loading = items === null;

  const baseEdit = (item: Item): Edit => ({
    price: item.price ?? '',
    cost: item.cost ?? '',
    stock: String(item.stock),
  });

  const currentEdit = (item: Item): Edit => edits[item.id] ?? baseEdit(item);

  const isDirty = (item: Item) => {
    const e = edits[item.id];
    if (!e) return false;
    const b = baseEdit(item);
    return e.price !== b.price || e.cost !== b.cost || e.stock !== b.stock;
  };

  const setField = (item: Item, field: keyof Edit, value: string) => {
    setEdits(prev => ({ ...prev, [item.id]: { ...currentEdit(item), [field]: value } }));
  };

  const save = async (item: Item) => {
    const e = edits[item.id];
    if (!e) return;
    setSavingId(item.id);
    try {
      const res = await fetch('/api/inventario', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, price: e.price, cost: e.cost, stock: e.stock }),
      });
      if (res.ok) {
        const updated: { price: string | null; cost: string | null; stock: number } = await res.json();
        setItems(prev => prev?.map(p =>
          p.id === item.id ? { ...p, price: updated.price, cost: updated.cost, stock: updated.stock } : p
        ) ?? prev);
        setEdits(prev => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
      }
    } finally {
      setSavingId(null);
    }
  };

  const filtered = items?.filter(i =>
    i.name.toLowerCase().includes(search.trim().toLowerCase())
  ) ?? [];

  const totalUnidades = items?.reduce((s, i) => s + i.stock, 0) ?? 0;
  const valorVenta = items?.reduce((s, i) => s + (Number(i.price) || 0) * i.stock, 0) ?? 0;
  const valorCosto = items?.reduce((s, i) => s + (Number(i.cost) || 0) * i.stock, 0) ?? 0;

  return (
    <div className="space-y-6">
      <section className="animate-fade-up">
        <p className="text-[11px] font-bold tracking-[0.2em] text-primary font-sans uppercase mb-1 opacity-80">PANEL ADMIN</p>
        <h2 className="font-display text-3xl font-semibold text-on-background">Inventario</h2>
        {!loading && items.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <span className="liquid-glass-dark px-3 py-1 rounded-full text-[11px] font-semibold font-sans text-on-surface-variant">
              {items.length} producto{items.length !== 1 ? 's' : ''} · {fmt(totalUnidades)} unidades
            </span>
            <span className="liquid-glass-dark px-3 py-1 rounded-full text-[11px] font-semibold font-sans text-primary">
              Venta: Bs {fmt(valorVenta)}
            </span>
            <span className="liquid-glass-dark px-3 py-1 rounded-full text-[11px] font-semibold font-sans text-tertiary">
              Costo: Bs {fmt(valorCosto)}
            </span>
          </div>
        )}
      </section>

      {!loading && items.length > 0 && (
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar producto…"
          className="liquid-glass-input w-full px-5 py-3 rounded-2xl text-sm font-sans animate-fade-up" />
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="liquid-glass skeleton-shimmer rounded-[1.75rem] h-24" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 animate-scale-in">
          <span className="text-6xl block mb-4 animate-float">📦</span>
          <p className="font-display text-xl font-medium text-on-background">Aún no hay productos</p>
          <p className="text-on-surface-variant text-sm font-sans mt-1">Agrega piezas desde el catálogo</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 animate-scale-in">
          <span className="text-5xl block mb-3">🔍</span>
          <p className="font-display text-lg font-medium text-on-background">Sin resultados para “{search}”</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, idx) => {
            const e = currentEdit(item);
            const dirty = isDirty(item);
            const ganancia = e.price !== '' && e.cost !== ''
              ? Number(e.price) - Number(e.cost)
              : null;
            return (
              <div key={item.id}
                className={`liquid-glass rounded-[1.75rem] p-4 animate-fade-up stagger-${Math.min(idx + 1, 6)} ${item.stock === 0 ? 'border-red-200/60' : ''}`}>
                <div className="flex items-center gap-3">
                  {item.imageUrl ? (
                    <button type="button"
                      onClick={() => setPreview({ url: item.imageUrl!, name: item.name })}
                      aria-label={`Ver imagen de ${item.name}`}
                      className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-primary-container/20 flex items-center justify-center cursor-zoom-in active:scale-95 transition-transform">
                      <Image src={item.imageUrl} alt={item.name} width={48} height={48}
                        className="w-full h-full object-cover" unoptimized />
                    </button>
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex-shrink-0 bg-primary-container/20 flex items-center justify-center">
                      <span className="text-xl">{item.categoryIcon ?? '💍'}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-medium text-on-background line-clamp-1">{item.name}</p>
                    <p className="text-[11px] text-on-surface-variant/60 font-sans">
                      {item.categoryName ?? 'Sin categoría'}
                      {ganancia !== null && Number.isFinite(ganancia) && (
                        <span className={ganancia >= 0 ? 'text-primary' : 'text-red-400'}>
                          {' '}· Ganancia Bs {fmt(ganancia)} c/u
                        </span>
                      )}
                    </p>
                  </div>
                  {item.stock === 0 && (
                    <span className="flex-shrink-0 px-2.5 py-1 rounded-full bg-red-50 text-red-400 text-[10px] font-bold font-sans uppercase tracking-wider">
                      Agotado
                    </span>
                  )}
                </div>

                <div className="flex items-end gap-2 flex-wrap mt-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold tracking-wider text-on-surface-variant/60 font-sans uppercase pl-1">Precio Bs</span>
                    <input value={e.price} onChange={ev => setField(item, 'price', ev.target.value)}
                      inputMode="decimal" placeholder="—"
                      className="liquid-glass-input w-24 px-3 py-2 rounded-xl text-sm font-sans text-primary font-semibold" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold tracking-wider text-on-surface-variant/60 font-sans uppercase pl-1">Costo Bs</span>
                    <input value={e.cost} onChange={ev => setField(item, 'cost', ev.target.value)}
                      inputMode="decimal" placeholder="—"
                      className="liquid-glass-input w-24 px-3 py-2 rounded-xl text-sm font-sans text-tertiary font-semibold" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold tracking-wider text-on-surface-variant/60 font-sans uppercase pl-1">Unidades</span>
                    <input value={e.stock} onChange={ev => setField(item, 'stock', ev.target.value)}
                      inputMode="numeric" placeholder="0"
                      className="liquid-glass-input w-20 px-3 py-2 rounded-xl text-sm font-sans font-semibold" />
                  </label>
                  {dirty && (
                    <button onClick={() => save(item)} disabled={savingId === item.id}
                      className="ml-auto px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold font-sans hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60">
                      {savingId === item.id ? 'Guardando…' : 'Guardar'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Visor de imagen ampliada */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[6px] flex items-center justify-center p-5"
          onClick={() => setPreview(null)}>
          <div
            className="liquid-glass-panel rounded-[2rem] p-4 w-full max-w-md animate-scale-in"
            onClick={ev => ev.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-3 px-1">
              <p className="font-display text-base font-semibold text-on-background line-clamp-1">{preview.name}</p>
              <button type="button" onClick={() => setPreview(null)} aria-label="Cerrar"
                className="p-2 rounded-full liquid-glass-dark text-on-surface-variant hover:text-primary hover:rotate-90 transition-all duration-300 flex-shrink-0">
                <span className="material-symbols-outlined text-xl block" style={{ fontVariationSettings: "'wght' 200, 'opsz' 24" }}>close</span>
              </button>
            </div>
            <div className="rounded-[1.5rem] overflow-hidden bg-primary-container/20">
              <Image src={preview.url} alt={preview.name} width={800} height={800}
                className="w-full h-auto max-h-[70vh] object-contain" unoptimized />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
