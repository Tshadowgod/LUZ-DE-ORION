import { getCloudflareContext } from '@opennextjs/cloudflare';

// Guarda las fotos en Cloudflare R2.
//
// Como la app corre dentro de Workers, el bucket viene conectado por un
// binding declarado en wrangler.jsonc ("FOTOS"). Eso significa que no hay
// claves de API ni secretos que rotar: Cloudflare le da acceso al worker
// directamente, y la escritura no sale a internet.
//
// Unica variable necesaria (no es secreta):
//   R2_PUBLIC_URL   dominio publico del bucket, ej https://fotos.luzdeorion.store

// Tipamos el bucket a mano en vez de usar worker-configuration.d.ts: esos
// tipos son del runtime de Workers y pisan los del navegador, rompiendo el
// res.json() de los componentes del cliente.
type BucketR2 = {
  put(
    clave: string,
    valor: ArrayBuffer,
    opciones?: { httpMetadata?: { contentType?: string; cacheControl?: string } },
  ): Promise<unknown>;
};

export function urlPublica(): string | null {
  const base = process.env.R2_PUBLIC_URL;
  return base ? base.replace(/\/+$/, '') : null;
}

/**
 * Sube un archivo al bucket y devuelve su URL publica.
 * `clave` es la ruta dentro del bucket, por ejemplo "productos/anillo.webp".
 */
export async function subirAR2(
  clave: string,
  cuerpo: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const base = urlPublica();
  if (!base) {
    throw new Error('Falta la variable R2_PUBLIC_URL');
  }

  const { env } = getCloudflareContext() as unknown as { env: { FOTOS: BucketR2 } };

  await env.FOTOS.put(clave, cuerpo, {
    httpMetadata: {
      contentType,
      // Un ano de cache: el nombre lleva la fecha, asi que el contenido de una
      // URL nunca cambia.
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });

  return `${base}/${clave}`;
}
