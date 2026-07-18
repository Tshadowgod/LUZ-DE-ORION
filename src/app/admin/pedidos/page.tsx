'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';

type OrderItem = {
  id: number; orderId: number; productId: number | null;
  name: string; price: string | null; imageUrl: string | null; quantity: number;
};
type Order = {
  id: number; customerName: string | null; customerPhone: string | null;
  total: string; status: string; createdAt: string; items: OrderItem[];
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Order[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);

  const load = useCallback(() =>
    fetch('/api/pedidos')
      .then(r => r.json())
      .then((data: Order[]) => setPedidos(Array.isArray(data) ? data : []))
      .catch(() => setPedidos(prev => prev ?? [])),
  []);

  useEffect(() => { void load(); }, [load]);

  const refresh = () => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  };

  const loading = pedidos === null;
  const nuevos = pedidos?.filter(p => p.status === 'nuevo').length ?? 0;

  const toggleStatus = async (order: Order) => {
    const status = order.status === 'nuevo' ? 'atendido' : 'nuevo';
    const res = await fetch('/api/pedidos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: order.id, status }),
    });
    if (res.ok) {
      setPedidos(prev => prev?.map(p => p.id === order.id ? { ...p, status } : p) ?? prev);
    }
  };

  const remove = async (order: Order) => {
    if (!window.confirm(`¿Eliminar el pedido #${order.id}?`)) return;
    const res = await fetch(`/api/pedidos?id=${order.id}`, { method: 'DELETE' });
    if (res.ok) {
      setPedidos(prev => prev?.filter(p => p.id !== order.id) ?? prev);
    }
  };

  return (
    <div className="space-y-6">
      <section className="animate-fade-up flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-primary font-sans uppercase mb-1 opacity-80">PANEL ADMIN</p>
          <h2 className="font-display text-3xl font-semibold text-on-background">Pedidos</h2>
          {!loading && pedidos.length > 0 && (
            <p className="text-xs text-on-surface-variant/60 font-sans mt-1">
              {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}{nuevos > 0 ? ` · ${nuevos} nuevo${nuevos !== 1 ? 's' : ''}` : ''}
            </p>
          )}
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="liquid-glass-dark flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold font-sans text-on-surface-variant hover:text-primary active:scale-95 transition-all disabled:opacity-60">
          <span className={`material-symbols-outlined text-lg block ${refreshing ? 'animate-spin' : ''}`}
            style={{ fontVariationSettings: "'wght' 200, 'opsz' 20" }}>
            refresh
          </span>
          {refreshing ? 'Actualizando…' : 'Actualizar'}
        </button>
      </section>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="liquid-glass skeleton-shimmer rounded-[2rem] h-44" />)}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-20 animate-scale-in">
          <span className="text-6xl block mb-4 animate-float">🛍️</span>
          <p className="font-display text-xl font-medium text-on-background">Aún no hay pedidos</p>
          <p className="text-on-surface-variant text-sm font-sans mt-1">
            Cuando un cliente envíe su carrito, aparecerá aquí
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((order, idx) => {
            const nuevo = order.status === 'nuevo';
            return (
              <div key={order.id}
                className={`liquid-glass rounded-[2rem] p-5 animate-fade-up stagger-${Math.min(idx + 1, 6)} ${nuevo ? 'border-tertiary/40' : 'opacity-80'}`}>
                {/* Encabezado del pedido */}
                <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display text-lg font-semibold text-on-background">Pedido #{order.id}</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-sans uppercase tracking-wider ${
                        nuevo ? 'bg-tertiary-container/60 text-tertiary' : 'bg-primary-container/40 text-primary'
                      }`}>
                        {nuevo ? 'Nuevo' : 'Atendido'}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant/60 font-sans mt-0.5">
                      {new Date(order.createdAt).toLocaleString('es-BO', { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase">Total</p>
                    <p className="font-display text-xl font-semibold text-primary">
                      Bs {Number(order.total).toLocaleString('es-BO')}
                    </p>
                  </div>
                </div>

                {/* Cliente */}
                {(order.customerName || order.customerPhone) && (
                  <div className="flex items-center gap-4 flex-wrap mb-4 text-sm font-sans text-on-surface-variant">
                    {order.customerName && (
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'wght' 200, 'opsz' 20" }}>person</span>
                        {order.customerName}
                      </span>
                    )}
                    {order.customerPhone && (
                      <a href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-primary hover:underline">
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'wght' 200, 'opsz' 20" }}>call</span>
                        {order.customerPhone}
                      </a>
                    )}
                  </div>
                )}

                {/* Artículos: imagen pequeña + unidades */}
                <div className="space-y-2 mb-4">
                  {order.items.map(item => (
                    <div key={item.id} className="liquid-glass-dark rounded-2xl px-3 py-2 flex items-center gap-3">
                      {item.imageUrl ? (
                        <button type="button"
                          onClick={() => setPreview({ url: item.imageUrl!, name: item.name })}
                          aria-label={`Ver imagen de ${item.name}`}
                          className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-primary-container/20 flex items-center justify-center cursor-zoom-in active:scale-95 transition-transform">
                          <Image src={item.imageUrl} alt={item.name} width={40} height={40}
                            className="w-full h-full object-cover" unoptimized />
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-primary-container/20 flex items-center justify-center">
                          <span className="text-lg">💍</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm font-medium text-on-background line-clamp-1">{item.name}</p>
                        {item.price && (
                          <p className="text-[11px] text-on-surface-variant/60 font-sans">
                            Bs {Number(item.price).toLocaleString('es-BO')} c/u
                          </p>
                        )}
                      </div>
                      <span className="flex-shrink-0 px-2.5 py-1 rounded-full bg-primary-container/50 text-primary text-xs font-bold font-sans">
                        ×{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <button onClick={() => toggleStatus(order)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold font-sans transition-colors ${
                      nuevo
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'liquid-glass-dark text-on-surface-variant hover:text-primary'
                    }`}>
                    {nuevo ? '✓ Marcar atendido' : 'Volver a nuevo'}
                  </button>
                  <button onClick={() => remove(order)}
                    className="px-4 py-2.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors text-xs font-semibold font-sans">
                    Eliminar
                  </button>
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
            onClick={e => e.stopPropagation()}>
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
