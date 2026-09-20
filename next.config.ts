import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    // En Cloudflare no corre el optimizador de imagenes de Next (eso lo daba
    // Vercel gratis; aca seria Cloudflare Images, que es pago). No hace falta:
    // las fotos ya se suben comprimidas a WebP 1400px desde el navegador, y
    // Cloudflare las cachea en su CDN.
    unoptimized: true,
  },
};

export default nextConfig;

// Permite que `next dev` vea los bindings de Cloudflare (R2, variables, etc).
initOpenNextCloudflareForDev();
