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
const NAMESPACE_ID = '637a6848a0e84a5daa36c9019c3d6f7a';
// Se sube de a lotes con `wrangler kv bulk put`: un proceso por lote en vez
// de uno por foto. Baja la migracion de ~40 minutos a unos pocos.
const POR_LOTE = 20;
const DESCARGAS_EN_PARALELO = 6;

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
  return {
    clave,
    nueva: `${PREFIJO}${clave}`,
    datos: comprimida,
    original: original.length,
    final: comprimida.length,
  };
}

/** Sube un lote a KV y actualiza la base solo si la subida salio bien. */
async function subirLote(lote, carpeta, n) {
  const archivo = join(carpeta, `lote-${n}.json`);
  await writeFile(archivo, JSON.stringify(lote.map((x) => ({
    key: x.clave,
    value: x.datos.toString('base64'),
    base64: true,
    metadata: { contentType: 'image/webp' },
  }))));

  try {
    await ejecutar('npx', [
      'wrangler', 'kv', 'bulk', 'put', archivo,
      '--namespace-id', NAMESPACE_ID,
      '--remote',
    ], { maxBuffer: 200 * 1024 * 1024 });
  } finally {
    await unlink(archivo).catch(() => {});
  }

  for (const x of lote) {
    if (x.tabla === 'products') {
      await sql`UPDATE products SET image_url = ${x.nueva} WHERE id = ${x.id}`;
    } else {
      await sql`UPDATE announcements SET image_url = ${x.nueva} WHERE id = ${x.id}`;
    }
  }
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
  let ok = 0, pesoAntes = 0, pesoDespues = 0, nLote = 0;
  const errores = [];
  const cola = [...pendientes];
  let lote = [];

  // Descarga y comprime varias a la vez; cuando junta POR_LOTE, las sube de
  // una sola vez y recien ahi actualiza la base.
  const vaciarLote = async () => {
    if (lote.length === 0) return;
    const actual = lote;
    lote = [];
    nLote += 1;
    try {
      if (!DRY) await subirLote(actual, carpeta, nLote);
      ok += actual.length;
      for (const x of actual) { pesoAntes += x.original; pesoDespues += x.final; }
      console.log(`  lote ${nLote}: ${actual.length} fotos subidas  (total ${ok}/${pendientes.length})`);
    } catch (e) {
      for (const x of actual) errores.push({ etiqueta: `${x.tabla}#${x.id}`, motivo: e.message.split('\n')[0] });
      console.log(`  lote ${nLote}: FALLO -- ${e.message.split('\n')[0]}`);
    }
  };

  let cortar = false;
  const trabajador = async () => {
    for (;;) {
      if (cortar) return;
      const fila = cola.shift();
      if (!fila) return;
      try {
        const r = await migrarUna(fila);
        lote.push({ ...r, tabla: fila.tabla, id: fila.id });
        if (lote.length >= POR_LOTE) await vaciarLote();
      } catch (e) {
        const motivo = e.message.split('\n')[0];
        errores.push({ etiqueta: `${fila.tabla}#${fila.id}`, motivo });
        console.log(`  -- ${fila.tabla}#${fila.id}: ${motivo}`);
        if (motivo.includes('403')) {
          console.log('\nCortado: el store de Vercel volvio a bloquearse.');
          cortar = true;
          return;
        }
      }
    }
  };

  await Promise.all(Array.from({ length: DESCARGAS_EN_PARALELO }, trabajador));
  await vaciarLote();

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
