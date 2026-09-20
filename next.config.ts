import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    // AVIF y WebP pesan mucho menos que el JPEG original en el celular.
    formats: ['image/avif', 'image/webp'],
    // El nombre de cada archivo lleva la fecha, asi que una URL nunca cambia de
    // contenido: conviene cachear un año y no volver a optimizar la misma foto.
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
