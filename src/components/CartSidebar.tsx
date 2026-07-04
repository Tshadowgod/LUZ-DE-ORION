'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';

export default function CartSidebar() {
  const { items, removeItem, updateQuantity, clearCart, total, count, isOpen, setIsOpen } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const close = () => setIsOpen(false);

  const sendToWhatsApp = () => {
    const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? '';
    const lines = items.map(i =>
      `   💎 ${i.quantity}x ${i.name}${i.price ? `  →  Bs ${(Number(i.price) * i.quantity).toLocaleString('es-BO')}` : ''}`
    ).join('\n');

    const parts = [
      '✨🌟 *LUZ DE ORIÓN* 🌟✨',
      '💍 _Joyería Artesanal de Lujo_',
      '━━━━━━━━━━━━━━━━━━━',
      '🛍️ *NUEVO PEDIDO*',
      '━━━━━━━━━━━━━━━━━━━',
      ...(customerName  ? [`👤 *Cliente:*  ${customerName}`]  : []),
      ...(customerPhone ? [`📱 *Teléfono:* ${customerPhone}`] : []),
      ...(customerName || customerPhone ? [''] : []),
      '🛒 *Productos:*',
      lines,
      '',
      '━━━━━━━━━━━━━━━━━━━',
      `💰 *TOTAL:  Bs ${total.toLocaleString('es-BO')}*`,
      '━━━━━━━━━━━━━━━━━━━',
      '',
      '💕 _¡Gracias por tu pedido!_',
      '⭐ _Te contactaremos pronto_ ✨',
    ];

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(parts.join('\n'))}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/25 backdrop-blur-[3px] z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={close} aria-hidden={!isOpen} />
      <div aria-hidden={!isOpen}
        className={`liquid-glass-panel fixed right-0 top-0 h-full w-full max-w-sm z-50 flex flex-col transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/20">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase">MI CARRITO</p>
            <p className="font-display text-xl font-semibold text-on-background">
              {count} pieza{count !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={close}
            className="p-2 rounded-full liquid-glass-dark text-on-surface-variant hover:text-primary hover:rotate-90 transition-all duration-300">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'wght' 200, 'opsz' 24" }}>close</span>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 scroll-hide">
          {items.length === 0 ? (
            <div className="text-center py-20 animate-scale-in">
              <span className="text-5xl block mb-4 animate-float">🛒</span>
              <p className="font-display text-lg font-medium text-on-background">Tu carrito está vacío</p>
              <p className="text-on-surface-variant text-sm font-sans mt-1">Agrega piezas del catálogo</p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={item.id}
                className={`liquid-glass rounded-[1.5rem] p-3 flex gap-3 items-center animate-fade-up stagger-${Math.min(idx + 1, 6)} transition-shadow duration-300 hover:shadow-md`}>
                <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-primary-container/20 flex items-center justify-center">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} width={56} height={56}
                      className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <span className="text-2xl">{item.categoryIcon ?? '💍'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-medium text-on-background line-clamp-1">{item.name}</p>
                  {item.price && (
                    <p className="text-primary text-sm font-bold font-sans">
                      Bs {(Number(item.price) * item.quantity).toLocaleString('es-BO')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full bg-primary-container/40 text-primary font-bold text-sm flex items-center justify-center hover:bg-primary/20 transition-colors">
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold font-sans">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full bg-primary-container/40 text-primary font-bold text-sm flex items-center justify-center hover:bg-primary/20 transition-colors">
                    +
                  </button>
                </div>
                <button onClick={() => removeItem(item.id)} className="p-1 text-red-300 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'wght' 200, 'opsz' 20" }}>delete</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-outline-variant/20 space-y-3">
            <div className="space-y-2">
              <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                placeholder="Tu nombre (opcional)"
                className="liquid-glass-input w-full px-4 py-2.5 rounded-2xl text-sm font-sans" />
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                placeholder="Tu teléfono (opcional)"
                className="liquid-glass-input w-full px-4 py-2.5 rounded-2xl text-sm font-sans" />
            </div>
            <div className="flex items-center justify-between py-1">
              <p className="text-on-surface-variant text-sm font-sans">Total</p>
              <p className="font-display text-2xl font-semibold text-primary">Bs {total.toLocaleString('es-BO')}</p>
            </div>
            <button onClick={sendToWhatsApp}
              className="glossy-reflection w-full py-3.5 rounded-2xl text-white font-semibold font-sans text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] active:translate-y-0 transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, #2ce080 0%, #25D366 50%, #1fb858 100%)', boxShadow: '0 6px 20px rgba(37,211,102,0.35), inset 0 1px 0 rgba(255,255,255,0.4)' }}>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar pedido por WhatsApp
            </button>
            <button onClick={clearCart}
              className="w-full py-2 text-xs text-on-surface-variant/50 font-sans hover:text-red-400 transition-colors">
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
}
