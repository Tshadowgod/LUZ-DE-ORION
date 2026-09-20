import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Volvemos pronto | Luz de Orión',
  description: 'Estamos preparando algo lindo. Volvemos enseguida.',
};

// Esta pagina vive fuera del grupo (public) a proposito: no lleva barra de
// navegacion ni carrito, porque la tienda esta pausada.
export default function MantenimientoPage() {
  return (
    <main
      className="min-h-dvh flex items-center justify-center px-6 py-12"
      style={{
        background:
          'radial-gradient(120% 90% at 50% 0%, #ffe9c9 0%, #f8ded8 38%, #fbf9f5 78%)',
      }}
    >
      <div className="w-full max-w-md liquid-glass glossy-reflection rounded-[2rem] px-7 py-12 text-center animate-fade-up">
        <p className="text-[10px] font-bold tracking-[0.3em] text-tertiary font-sans uppercase mb-5">
          ✦ Luz de Orión
        </p>

        <div className="mb-6 animate-float select-none flex justify-center" aria-hidden="true">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontSize: '64px', fontVariationSettings: "'wght' 200, 'opsz' 48" }}
          >
            diamond
          </span>
        </div>

        <h1 className="font-display text-[2rem] leading-tight font-semibold text-on-background mb-4 text-balance">
          Estamos en mantenimiento, bellas
        </h1>

        <p className="text-on-surface-variant text-sm font-sans leading-relaxed opacity-90 mb-2">
          Estamos puliendo la tienda para que quede más linda que nunca.
        </p>
        <p className="text-on-surface-variant text-sm font-sans leading-relaxed opacity-90 mb-8">
          Volvemos enseguida ✨
        </p>

        <div className="h-px w-16 mx-auto mb-8 bg-primary/20" />

        <p className="text-xs font-sans text-on-surface-variant mb-4">
          Mientras tanto, escribinos y te atendemos igual:
        </p>

        <div className="flex flex-col gap-3">
          <a
            href="https://chat.whatsapp.com/CX7Pb8jNJULIuSEI1e4MCh?s=cl&p=a&ilr=1&amv=1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25D366] text-white text-sm font-semibold font-sans hover:brightness-105 active:scale-95 transition-all duration-300"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.892c0 2.096.549 4.142 1.595 5.945L0 24l6.335-1.652a11.882 11.882 0 005.71 1.447h.006c6.585 0 11.946-5.359 11.949-11.893a11.821 11.821 0 00-3.481-8.413z" />
            </svg>
            Escribinos por WhatsApp
          </a>

          <a
            href="https://www.tiktok.com/@luz_de_orion21"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl liquid-glass-dark text-on-background text-sm font-semibold font-sans hover:bg-primary-container/40 active:scale-95 transition-all duration-300"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
            Mirá las novedades en TikTok
          </a>
        </div>
      </div>
    </main>
  );
}
