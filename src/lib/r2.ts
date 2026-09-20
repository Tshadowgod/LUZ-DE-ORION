import { AwsClient } from 'aws4fetch';

// Cliente de Cloudflare R2 por su API compatible con S3.
//
// Usamos aws4fetch y no el SDK de AWS a proposito: pesa unos pocos KB, no tiene
// dependencias, y evita el problema conocido de los checksums que el SDK nuevo
// manda por defecto y R2 rechaza.
//
// Variables necesarias (Vercel > Settings > Environment Variables):
//   R2_ACCOUNT_ID         el id de cuenta de Cloudflare
//   R2_ACCESS_KEY_ID      del token de API de R2
//   R2_SECRET_ACCESS_KEY  idem
//   R2_BUCKET             nombre del bucket, por ejemplo luz-de-orion
//   R2_PUBLIC_URL         dominio publico, por ejemplo https://fotos.luzdeorion.store

export type ConfigR2 = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
};

export function leerConfigR2(): ConfigR2 | null {
  const {
    R2_ACCOUNT_ID: accountId,
    R2_ACCESS_KEY_ID: accessKeyId,
    R2_SECRET_ACCESS_KEY: secretAccessKey,
    R2_BUCKET: bucket,
    R2_PUBLIC_URL: publicUrl,
  } = process.env;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    // sin barra final, para poder concatenar sin duplicarla
    publicUrl: publicUrl.replace(/\/+$/, ''),
  };
}

/** Nombra las variables que falten, para poder avisar con precision. */
export function faltantesR2(): string[] {
  return [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET',
    'R2_PUBLIC_URL',
  ].filter((k) => !process.env[k]);
}

/**
 * Sube un archivo al bucket y devuelve su URL publica.
 * `clave` es la ruta dentro del bucket, por ejemplo "productos/anillo.webp".
 */
export async function subirAR2(
  clave: string,
  cuerpo: Uint8Array | ArrayBuffer,
  contentType: string,
  config: ConfigR2,
): Promise<string> {
  const cliente = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: 's3',
    region: 'auto',
  });

  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${clave}`;

  const res = await cliente.fetch(endpoint, {
    method: 'PUT',
    body: cuerpo as BodyInit,
    headers: {
      'Content-Type': contentType,
      // Un ano de cache: el nombre lleva la fecha, asi que el contenido de una
      // URL nunca cambia.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    throw new Error(`R2 respondio ${res.status}: ${detalle.slice(0, 300)}`);
  }

  return `${config.publicUrl}/${clave}`;
}
