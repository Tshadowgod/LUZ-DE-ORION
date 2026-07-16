'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

const MAX_SCALE = 4;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SCALE = 2.5;

export default function ImageLightbox({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const [t, setT] = useState({ scale: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch    = useRef({ dist: 0, scale: 1 });
  const pan      = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const lastTap  = useRef(0);

  const close = () => { setOpen(false); setT({ scale: 1, x: 0, y: 0 }); };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setDragging(true);
    const pts = [...pointers.current.values()];

    if (pts.length === 2) {
      pinch.current = { dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), scale: t.scale };
    } else if (pts.length === 1) {
      pan.current = { x: e.clientX, y: e.clientY, tx: t.x, ty: t.y };
      const now = Date.now();
      if (now - lastTap.current < DOUBLE_TAP_MS) {
        setT(prev => prev.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: DOUBLE_TAP_SCALE, x: 0, y: 0 });
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];

    if (pts.length === 2) {
      const dist  = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const scale = Math.min(MAX_SCALE, Math.max(1, pinch.current.scale * (dist / pinch.current.dist)));
      setT(prev => scale === 1 ? { scale: 1, x: 0, y: 0 } : { ...prev, scale });
    } else if (pts.length === 1 && t.scale > 1) {
      setT(prev => ({
        ...prev,
        x: pan.current.tx + (e.clientX - pan.current.x),
        y: pan.current.ty + (e.clientY - pan.current.y),
      }));
    }
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    const pts = [...pointers.current.values()];
    if (pts.length === 0) setDragging(false);
    if (pts.length === 1) {
      // Quedó un dedo tras el pellizco: rebasar el paneo desde su posición actual
      pan.current = { x: pts[0].x, y: pts[0].y, tx: t.x, ty: t.y };
    }
  };

  return (
    <>
      {/* Miniatura en la tarjeta (misma apariencia de siempre + pista de zoom) */}
      <div className="relative h-80 overflow-hidden cursor-zoom-in" onClick={() => setOpen(true)}
        role="button" aria-label={`Ampliar foto de ${alt}`} tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); } }}>
        <Image src={src} alt={alt} fill className="object-cover" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent pointer-events-none" />
        <span className="absolute bottom-3 right-3 liquid-glass-dark rounded-full p-2 text-primary pointer-events-none">
          <span className="material-symbols-outlined text-xl block" style={{ fontVariationSettings: "'wght' 200, 'opsz' 24" }}>
            zoom_in
          </span>
        </span>
      </div>

      {/* Visor a pantalla completa con pellizco y doble toque */}
      {open && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md animate-fade-in flex items-center justify-center"
          onClick={close}>
          <button onClick={close} aria-label="Cerrar"
            className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/25 hover:rotate-90 transition-all duration-300"
            style={{ marginTop: 'env(safe-area-inset-top)' }}>
            <span className="material-symbols-outlined text-2xl block" style={{ fontVariationSettings: "'wght' 200, 'opsz' 24" }}>
              close
            </span>
          </button>

          <div className="w-full h-full touch-none overflow-hidden flex items-center justify-center"
            onClick={e => e.stopPropagation()}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}>
            <div className="relative w-full h-full max-w-3xl select-none"
              style={{
                transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
                transition: dragging ? 'none' : 'transform 0.25s var(--ease-fluid)',
              }}>
              <Image src={src} alt={alt} fill className="object-contain pointer-events-none" unoptimized priority />
            </div>
          </div>

          <p className="absolute bottom-6 left-0 right-0 text-center text-white/60 text-xs font-sans pointer-events-none"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
            Pellizca o toca dos veces para acercar
          </p>
        </div>,
        document.body
      )}
    </>
  );
}
