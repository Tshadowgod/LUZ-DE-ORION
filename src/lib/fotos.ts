import { getCloudflareContext } from '@opennextjs/cloudflare';

// Guarda las fotos en Workers KV.
//
// Lo ideal para archivos seria R2, pero exige un medio de pago aunque uses el
// plan gratis. KV viene incluido en el plan gratis de Workers y para esta
// tienda sobra: el limite es 1 GB y las 148 fotos comprimidas pesan ~33 MB.
//
// Las fotos se sirven desde /fotos/... del mismo dominio (ver la ruta
// src/app/fotos/[...ruta]/route.ts), asi que las URLs guardadas en la base son
// relativas y siguen funcionando si la tienda cambia de dominio.

// Tipamos el binding a mano en vez de usar worker-configuration.d.ts: esos
// tipos son del runtime de Workers y pisan los del navegador, rompiendo el
// res.json() de los componentes del cliente.
type AlmacenKV = {
  put(
    clave: string,
    valor: ArrayBuffer,
    opciones?: { metadata?: { contentType?: string } },
  ): Promise<void>;
  getWithMetadata(
    clave: string,
    tipo: 'arrayBuffer',
  ): Promise<{ value: ArrayBuffer | null; metadata: { contentType?: string } | null }>;
};

function almacen(): AlmacenKV {
  const { env } = getCloudflareContext() as unknown as { env: { FOTOS: AlmacenKV } };
  return env.FOTOS;
}

/**
 * Guarda una foto y devuelve la ruta publica con la que mostrarla.
 * `clave` es la ruta interna, por ejemplo "productos/anillo.webp".
 */
export async function guardarFoto(
  clave: string,
  cuerpo: ArrayBuffer,
  contentType: string,
): Promise<string> {
  await almacen().put(clave, cuerpo, { metadata: { contentType } });
  return `/fotos/${clave}`;
}

/** Devuelve el contenido de una foto, o null si no existe. */
export async function leerFoto(
  clave: string,
): Promise<{ cuerpo: ArrayBuffer; contentType: string } | null> {
  const { value, metadata } = await almacen().getWithMetadata(clave, 'arrayBuffer');
  if (!value) return null;
  return { cuerpo: value, contentType: metadata?.contentType ?? 'image/webp' };
}
