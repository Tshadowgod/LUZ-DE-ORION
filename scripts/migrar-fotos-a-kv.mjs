// Migra las fotos de Vercel Blob a Cloudflare Workers KV.
//
// Con cada imagen: la descarga, la comprime a WebP 1400px, la guarda en KV y
// actualiza la URL en la base. Toca las tablas products y announcements.
//
// Las URLs quedan relativas (/fotos/...), asi siguen funcionando aunque la
// tienda cambie de dominio.
//
// Uso:
//   node scripts/migrar-fotos-a-kv.mjs --dry    ver que haria, sin tocar nada
//   node scripts/migrar-fotos-a-kv.mjs          hacerlo de verdad
//
// Se puede cortar y volver a correr: saltea las que ya estan migradas.
//
// No necesita tokens de API: escribe con el CLI de wrangler, que ya esta
// autenticado con tu cuenta de Cloudflare (npx wrangler login).
//
// Necesita en .env.local: DATABASE_URL

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, unlink, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const ejecutar = promisify(execFile);
config({ path: '.env.local', quiet: true });

const DRY = process.argv.includes('--dry');
const MAX_LADO = 1400;
const CALIDAD = 80;
// De a uno: cada escritura levanta un proceso de wrangler y varios en
// paralelo se pelean por la sesion.
const NAMESPACE_ID = '637a6848a0e84a5daa36c9019c3d6f7a';

const req = (k) => {
  const v = process.env[k];
  if (!v) { console.error(`Falta la variable ${k} en .env.local`); process.exit(1); }
  return v;
};

const sql = neon(req('DATABASE_URL'));
const PREFIJO = '/fotos/';
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

async function migrarUna(fila, carpeta) {
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
    .rotate() // aplica la orientacion EXIF: sin esto salen acostadas
    .resize({ width: MAX_LADO, height: MAX_LADO, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: CALIDAD })
    .toBuffer();

  const clave = `productos/${id}-${nombreDesdeUrl(imageUrl)}`;
  const nueva = `${PREFIJO}${clave}`;

  if (!DRY) {
    const temporal = join(carpeta, `${tabla}-${id}.webp`);
    await writeFile(temporal, comprimida);
    try {
      await ejecutar('npx', [
        'wrangler', 'kv', 'key', 'put', clave,
        '--path', temporal,
        '--namespace-id', NAMESPACE_ID,
        '--metadata', JSON.stringify({ contentType: 'image/webp' }),
        '--remote',
      ], { maxBuffer: 10 * 1024 * 1024 });
    } finally {
      await unlink(temporal).catch(() => {});
    }

    if (tabla === 'products') {
      await sql`UPDATE products SET image_url = ${nueva} WHERE id = ${id}`;
    } else {
      await sql`UPDATE announcements SET image_url = ${nueva} WHERE id = ${id}`;
    }
  }

  return { original: original.length, final: comprimida.length };
}

async function main() {
  console.log(DRY ? '— MODO PRUEBA: no se sube ni se modifica nada —\n' : '— MIGRACION REAL —\n');

  const productos = await sql`SELECT id, image_url FROM products WHERE image_url IS NOT NULL`;
  const anuncios = await sql`SELECT id, image_url FROM announcements WHERE image_url IS NOT NULL`;

  const todas = [
    ...productos.map((r) => ({ tabla: 'products', id: r.id, imageUrl: r.image_url })),
    ...anuncios.map((r) => ({ tabla: 'announcements', id: r.id, imageUrl: r.image_url })),
  ];

  const pendientes = todas.filter((f) => !f.imageUrl.startsWith(PREFIJO));

  console.log(`Imagenes en la base : ${todas.length}`);
  console.log(`Ya migradas         : ${todas.length - pendientes.length}`);
  console.log(`A migrar            : ${pendientes.length}\n`);

  if (pendientes.length === 0) { console.log('No hay nada que hacer.'); return; }

  const carpeta = await mkdtemp(join(tmpdir(), 'ldo-migracion-'));
  let ok = 0, pesoAntes = 0, pesoDespues = 0;
  const errores = [];

  for (const [i, fila] of pendientes.entries()) {
    const etiqueta = `${fila.tabla}#${fila.id}`;
    const avance = `[${i + 1}/${pendientes.length}]`;
    try {
      const r = await migrarUna(fila, carpeta);
      ok += 1; pesoAntes += r.original; pesoDespues += r.final;
      console.log(`  ${avance} ok  ${etiqueta.padEnd(18)} ${kb(r.original)} -> ${kb(r.final)}`);
    } catch (e) {
      errores.push({ etiqueta, motivo: e.message.split('\n')[0] });
      console.log(`  ${avance} --  ${etiqueta.padEnd(18)} ${e.message.split('\n')[0]}`);
      // Si el store sigue bloqueado no tiene sentido seguir con 147 mas.
      if (e.message.includes('403')) {
        console.log('\nCortado: hay que desbloquear el store de Vercel antes de migrar.');
        break;
      }
    }
  }

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
