'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

type Announcement = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
};

// Clave de sesion: recordamos cual aviso ya vio el cliente para no
// mostrarlo de nuevo mientras navega. Al abrir la pagina otra vez (nueva
// sesion) vuelve a aparecer.
const SEEN_KEY = 'ldo_popup_visto';

export default function PopupAnnouncement() {
  const [item, setItem] = useState<Announcement | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/noticias?placement=popup')
      .then(r => (r.ok ? r.json() : []))
      .then((data: Announcement[]) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        // El mas reciente (la API ordena por fecha descendente)
        const latest = data[0];
        const seen = sessionStorage.getItem(SEEN_KEY);
        if (seen !== String(latest.id)) setItem(latest);
      })
      .catch(() => { /* sin conexion: no mostramos nada */ });
    return () => { cancelled = true; };
  }, []);

  const close = () => {
    if (item) sessionStorage.setItem(SEEN_KEY, String(item.id));
    setItem(null);
  };

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[6px] flex items-center justify-center p-5 animate-fade-in"
      onClick={close}>
      <div
        className="liquid-glass-panel rounded-[2rem] w-full max-w-sm max-h-[88vh] overflow-y-auto scroll-hide animate-scale-in relative"
        onClick={e => e.stopPropagation()}>
        {/* Boton X para cerrar */}
        <button type="button" onClick={close} aria-label="Cerrar aviso"
          className="absolute top-3 right-3 z-10 p-2 rounded-full text-on-surface-variant hover:text-primary hover:rotate-90 transition-all duration-300"
          style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', border: '0.5px solid rgba(255,255,255,0.4)' }}>
          <span className="material-symbols-outlined text-xl block" style={{ fontVariationSettings: "'wght' 300, 'opsz' 24" }}>close</span>
        </button>

        {item.imageUrl && !imgError && (
          // Imagen completa (sin recortar): se muestra tal cual la subiste
          <div className="w-full bg-primary-container/20 rounded-t-[2rem] overflow-hidden flex items-center justify-center">
            <Image src={item.imageUrl} alt={item.title} width={800} height={800}
              className="w-full h-auto max-h-[55vh] object-contain" unoptimized onError={() => setImgError(true)} />
          </div>
        )}

        <div className="p-6 text-center">
          <p className="text-[10px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase mb-2">✦ Luz de Orion</p>
          <h3 className="font-display text-xl font-semibold text-on-background leading-snug">{item.title}</h3>
          {item.description && (
            <p className="text-on-surface-variant text-sm font-sans mt-2 leading-relaxed">{item.description}</p>
          )}
          <button type="button" onClick={close}
            className="mt-5 w-full py-3 rounded-2xl text-sm font-semibold font-sans bg-primary text-white hover:bg-primary/90 active:scale-95 transition-all duration-300">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
