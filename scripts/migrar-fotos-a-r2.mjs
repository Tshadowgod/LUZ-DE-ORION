// Migra las fotos de Vercel Blob a Cloudflare R2.
//
// Que hace con cada imagen: la descarga, la comprime a WebP 1400px, la sube a
// R2 y actualiza la URL en la base. Toca las tablas products y announcements.
//
// Uso:
//   node scripts/migrar-fotos-a-r2.mjs --dry    ver que haria, sin tocar nada
//   node scripts/migrar-fotos-a-r2.mjs          hacerlo de verdad
//
// Se puede cortar y volver a correr: saltea las que ya estan en R2.
//
// Necesita en .env.local: DATABASE_URL y las cinco R2_*

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { AwsClient } from 'aws4fetch';
import sharp from 'sharp';

config({ path: '.env.local', quiet: true });

const DRY = process.argv.includes('--dry');
const MAX_LADO = 1400;
const CALIDAD = 80;
const EN_PARALELO = 4;

const req = (k) => {
  const v = process.env[k];
  if (!v) { console.error(`Falta la variable ${k} en .env.local`); process.exit(1); }
  return v;
};

const DATABASE_URL = req('DATABASE_URL');
const ACCOUNT_ID = req('R2_ACCOUNT_ID');
const BUCKET = req('R2_BUCKET');
const PUBLIC_URL = req('R2_PUBLIC_URL').replace(/\/+$/, '');

const cliente = new AwsClient({
  accessKeyId: req('R2_ACCESS_KEY_ID'),
  secretAccessKey: req('R2_SECRET_ACCESS_KEY'),
  service: 's3',
  region: 'auto',
});

const sql = neon(DATABASE_URL);
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

function nombreDesdeUrl(url) {
  const base = decodeURIComponent(url.split('/').pop() ?? 'imagen');
  const slug = base
    .replace(/\.[^.]+$/, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  return `${slug || 'imagen'}.webp`;
}

async function subir(clave, cuerpo) {
  const res = await cliente.fetch(
    `https://${ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET}/${clave}`,
    {
      method: 'PUT',
      body: cuerpo,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  );
  if (!res.ok) {
    throw new Error(`R2 respondio ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`);
  }
}

async function migrarUna(fila) {
  const { tabla, id, imageUrl } = fila;

  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(
      res.status === 403
        ? 'HTTP 403 — el store de Vercel sigue bloqueado, hay que desbloquearlo primero'
        : `HTTP ${res.status} al descargar`,
    );
  }

  const original = Buffer.from(await res.arrayBuffer());
  const comprimida = await sharp(original, { failOn: 'none' })
    .rotate()
    .resize({ width: MAX_LADO, height: MAX_LADO, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: CALIDAD })
    .toBuffer();

  const clave = `productos/${id}-${nombreDesdeUrl(imageUrl)}`;
  const nueva = `${PUBLIC_URL}/${clave}`;

  if (!DRY) {
    await subir(clave, comprimida);
    if (tabla === 'products') {
      await sql`UPDATE products SET image_url = ${nueva} WHERE id = ${id}`;
    } else {
      await sql`UPDATE announcements SET image_url = ${nueva} WHERE id = ${id}`;
    }
  }

  return { original: original.length, final: comprimida.length, nueva };
}

async function main() {
  console.log(DRY ? '— MODO PRUEBA: no se sube ni se modifica nada —\n' : '— MIGRACION REAL —\n');

  const productos = await sql`SELECT id, image_url FROM products WHERE image_url IS NOT NULL`;
  const anuncios = await sql`SELECT id, image_url FROM announcements WHERE image_url IS NOT NULL`;

  const todas = [
    ...productos.map((r) => ({ tabla: 'products', id: r.id, imageUrl: r.image_url })),
    ...anuncios.map((r) => ({ tabla: 'announcements', id: r.id, imageUrl: r.image_url })),
  ];

  const pendientes = todas.filter((f) => !f.imageUrl.startsWith(PUBLIC_URL));
  const yaEstaban = todas.length - pendientes.length;

  console.log(`Imagenes en la base : ${todas.length}`);
  console.log(`Ya estaban en R2    : ${yaEstaban}`);
  console.log(`A migrar            : ${pendientes.length}\n`);

  if (pendientes.length === 0) { console.log('No hay nada que hacer.'); return; }

  let ok = 0, pesoAntes = 0, pesoDespues = 0;
  const errores = [];
  const cola = [...pendientes];

  const trabajador = async () => {
    for (;;) {
      const fila = cola.shift();
      if (!fila) return;
      const etiqueta = `${fila.tabla}#${fila.id}`;
      try {
        const r = await migrarUna(fila);
        ok += 1; pesoAntes += r.original; pesoDespues += r.final;
        console.log(`  ok  ${etiqueta.padEnd(20)} ${kb(r.original)} -> ${kb(r.final)}`);
      } catch (e) {
        errores.push({ etiqueta, motivo: e.message });
        console.log(`  --  ${etiqueta.padEnd(20)} ${e.message}`);
      }
    }
  };

  await Promise.all(Array.from({ length: EN_PARALELO }, trabajador));

  console.log(`\nMigradas: ${ok} de ${pendientes.length}`);
  if (ok > 0) {
    console.log(`Peso: ${kb(pesoAntes)} -> ${kb(pesoDespues)} (${(100 - pesoDespues / pesoAntes * 100).toFixed(1)}% menos)`);
  }
  if (errores.length) {
    console.log(`\nFallaron ${errores.length}:`);
    for (const e of errores.slice(0, 10)) console.log(`  ${e.etiqueta}: ${e.motivo}`);
    if (errores.length > 10) console.log(`  ... y ${errores.length - 10} mas`);
    console.log('\nPodes volver a correr el script: saltea las que ya migraron.');
    process.exitCode = 1;
  }
  if (DRY) console.log('\nFue una prueba. Corre sin --dry para aplicarlo.');
}

main().catch((e) => { console.error('Error:', e.message); process.exit(1); });
