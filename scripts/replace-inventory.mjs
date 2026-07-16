// Reemplaza todo el inventario con los 58 productos del Excel "Inventario_Joyeria_1.xlsx"
// - Borra productos anteriores (y sus imágenes en Vercel Blob)
// - Crea las categorías nuevas del Excel y elimina las que quedan vacías
// - Sube la imagen de cada producto y lo inserta con su precio en Bs
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { put, del } from '@vercel/blob';
import { readFileSync } from 'fs';
import { join } from 'path';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);
const MEDIA_DIR = 'C:\\Users\\ASUS\\AppData\\Local\\Temp\\claude\\C--Users-ASUS-Desktop-LUZ-DE-ORION\\9bb29f41-97e7-4cfc-a569-eccf9e8fcb7c\\scratchpad\\inv\\xl\\media';
const BLOB_PREFIX = 'catalogo/2026-07';
const STOCK_DISPONIBLE = 5; // valor por defecto; ajustable desde el admin

const NEW_CATEGORIES = [
  { name: 'Collares acero 316L',   slug: 'collares-acero-316l', icon: '📿', color: '#6b7f8c' },
  { name: 'Enchapado en oro 18k',  slug: 'enchapado-oro-18k',   icon: '✨', color: '#d4a017' },
  { name: 'Plata 925',             slug: 'plata-925',           icon: '🤍', color: '#9fa8b0' },
  { name: 'Manillas de acero',     slug: 'manillas-acero',      icon: '⛓️', color: '#7d8a95' },
  { name: 'Joyería de princesas',  slug: 'joyeria-princesas',   icon: '👑', color: '#d98bb6' },
  { name: 'Otros productos',       slug: 'otros-productos',     icon: '🛍️', color: '#8a7f6b' },
];

// [nº, nombre, slugCategoría, precio Bs (null = sin precio), agotado, descripción]
const P = [
  [1,  'Collar flor de loto blanco',                 'collares-acero-316l', 50,  false, 'Acero inoxidable 316L'],
  [2,  'Collar flores en colores pastel',            'collares-acero-316l', 50,  false, 'Acero inoxidable 316L'],
  [3,  'Collar flor de loto rosa',                   'collares-acero-316l', 50,  false, 'Acero inoxidable 316L'],
  [4,  'Pulsera estilo LV',                          'collares-acero-316l', 60,  false, 'Acero inoxidable 316L'],
  [5,  'Collar doble caída mariposa',                'collares-acero-316l', 50,  false, 'Acero inoxidable 316L'],
  [6,  'Collar giratorio rosa con pedrería',         'collares-acero-316l', 50,  false, 'Acero inoxidable 316L'],
  [7,  'Collar flor con difuminado rosa giratorio',  'collares-acero-316l', 50,  false, 'Acero inoxidable 316L'],
  [8,  'Collar piedra verde con circones',           'collares-acero-316l', 60,  false, 'Acero inoxidable 316L'],
  [9,  'Collar dije negro circular',                 'collares-acero-316l', 40,  false, 'Acero inoxidable 316L'],
  [10, 'Rosario dorado',                             'enchapado-oro-18k',   100, false, 'Enchapado en oro 18k'],
  [11, 'Rosario dorado',                             'enchapado-oro-18k',   90,  true,  'Enchapado en oro 18k'],
  [12, 'Manilla dorada',                             'enchapado-oro-18k',   80,  false, 'Enchapado en oro 18k'],
  [13, 'Cadenita italiana',                          'plata-925',           250, false, 'Plata 925 · 3.06 gr'],
  [14, 'Anillo esterlina',                           'plata-925',           150, false, 'Plata 925 · 1.97 gr'],
  [15, 'Manilla dorada / plateada',                  'manillas-acero',      35,  false, 'Precio unitario'],
  [16, 'Manilla dorada / plateada',                  'manillas-acero',      35,  false, 'Precio unitario'],
  [17, 'Manilla dorada / plateada',                  'manillas-acero',      35,  false, 'Precio unitario'],
  [18, 'Manilla dorada / plateada',                  'manillas-acero',      35,  false, 'Precio unitario'],
  [19, 'Manilla dorada / plateada',                  'manillas-acero',      35,  false, 'Precio unitario'],
  [20, 'Anillo enchapado en oro 18k',                'anillos',             35,  false, 'Precio unitario'],
  [21, 'Anillo enchapado en oro 18k',                'anillos',             35,  false, 'Precio unitario'],
  [22, 'Anillo enchapado en oro 18k',                'anillos',             35,  false, 'Precio unitario'],
  [23, 'Anillo enchapado en oro 18k',                'anillos',             35,  false, 'Precio unitario'],
  [24, 'Anillo enchapado en oro 18k',                'anillos',             50,  false, 'Precio unitario'],
  [25, 'Anillo enchapado en oro 18k',                'anillos',             50,  false, 'Precio unitario'],
  [26, 'Anillo en tendencia',                        'anillos',             40,  true,  null],
  [27, 'Anillo en tendencia',                        'anillos',             40,  false, null],
  [28, 'Anillo en tendencia',                        'anillos',             40,  false, null],
  [29, 'Anillo en tendencia',                        'anillos',             40,  true,  null],
  [30, 'Anillo en tendencia',                        'anillos',             40,  false, null],
  [31, 'Anillo giratorio antiestrés',                'anillos',             40,  false, null],
  [32, 'Anillo giratorio antiestrés',                'anillos',             40,  true,  null],
  [33, 'Anillo giratorio antiestrés',                'anillos',             40,  false, null],
  [34, 'Anillos giratorios antiestrés (2 modelos)',  'anillos',             40,  true,  null],
  [35, 'Anillo giratorio antiestrés',                'anillos',             40,  false, null],
  [36, 'Anillo giratorio antiestrés',                'anillos',             40,  false, null],
  [37, 'Anillo giratorio antiestrés',                'anillos',             40,  false, null],
  [38, 'Set joyería de princesas (collar + anillo + cajita)', 'joyeria-princesas', 150, false, 'Incluye cajita de princesa'],
  [39, 'Collar de princesas',                        'joyeria-princesas',   80,  false, 'Anillo suelto: 60 Bs'],
  [40, 'Pulsera',                                    'pulseras',            null, false, null],
  [41, 'Pulsera',                                    'pulseras',            null, false, null],
  [42, 'Pulsera',                                    'pulseras',            null, false, null],
  [43, 'Pulsera',                                    'pulseras',            null, false, null],
  [44, 'Collar',                                     'collares',            null, false, null],
  [45, 'Collar',                                     'collares',            null, false, null],
  [46, 'Collar',                                     'collares',            null, false, null],
  [47, 'Collar',                                     'collares',            null, false, null],
  [48, 'Collar',                                     'collares',            null, false, null],
  [49, 'Pulsera de tulipanes laminada en oro',       'pulseras',            120, true,  'Precio unitario'],
  [50, 'Llaveros de cereza',                         'llaveros',            40,  true,  'Precio unitario'],
  [51, 'Mini llaveros',                              'llaveros',            25,  false, 'Precio unitario'],
  [52, 'Mini llaveros',                              'llaveros',            25,  false, 'Precio unitario'],
  [53, 'Desinfectante Wink',                         'otros-productos',     60,  false, '6 aromas: manzana-cherry, melón-sandía, mora jabuticaba, aloe vera, after hours, pitanga'],
  [54, 'Productos para las pestañas',                'otros-productos',     25,  false, 'Precio unitario'],
  [55, 'Set de skin care',                           'otros-productos',     35,  false, 'Precio unitario'],
  [56, 'Joyero acrílico',                            'joyeros',             120, false, 'Precio unitario'],
  [57, 'Cajitas acrílicas',                          'joyeros',             5,   false, 'Caja de 20 unidades: 50 Bs'],
  [58, 'Joyero acrílico',                            'joyeros',             25,  false, 'Precio unitario'],
];

const JPEG = new Set([5, 6, 8, 11, 13, 14, 17, 54, 58]);
const imageFile = n => `image${n}.${JPEG.has(n) ? 'jpeg' : 'png'}`;

async function main() {
  // 1. Guardar URLs de imágenes antiguas para limpiarlas del Blob
  const old = await sql`SELECT image_url FROM products WHERE image_url IS NOT NULL`;
  const oldUrls = old.map(r => r.image_url).filter(u => u && u.includes('blob.vercel-storage.com'));
  console.log(`🗂  Productos anteriores con imagen: ${oldUrls.length}`);

  // 2. Borrar productos anteriores
  const deleted = await sql`DELETE FROM products RETURNING id`;
  console.log(`🗑  ${deleted.length} productos anteriores eliminados`);

  // 3. Borrar imágenes antiguas del Blob
  if (oldUrls.length) {
    try {
      await del(oldUrls, { token: process.env.BLOB_READ_WRITE_TOKEN });
      console.log(`🗑  ${oldUrls.length} imágenes antiguas borradas del Blob`);
    } catch (err) {
      console.log(`⚠ No se pudieron borrar blobs antiguos: ${err.message}`);
    }
  }

  // 4. Asegurar categorías nuevas
  for (const c of NEW_CATEGORIES) {
    await sql`INSERT INTO categories (name, slug, icon, color) VALUES (${c.name}, ${c.slug}, ${c.icon}, ${c.color})
              ON CONFLICT (slug) DO NOTHING`;
  }
  const cats = Object.fromEntries((await sql`SELECT id, slug FROM categories`).map(c => [c.slug, c.id]));

  // 5. Subir imágenes e insertar productos
  let ok = 0, errors = 0;
  for (const [n, name, catSlug, price, agotado, description] of P) {
    const file = imageFile(n);
    try {
      process.stdout.write(`📤 ${String(n).padStart(2)}/58 ${file} → ${name}... `);
      const buffer = readFileSync(join(MEDIA_DIR, file));
      const blob = await put(`${BLOB_PREFIX}/${file}`, buffer, {
        access: 'public',
        contentType: JPEG.has(n) ? 'image/jpeg' : 'image/png',
        addRandomSuffix: true,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      await sql`
        INSERT INTO products (name, description, price, stock, category_id, image_url)
        VALUES (${name}, ${description}, ${price}, ${agotado ? 0 : STOCK_DISPONIBLE}, ${cats[catSlug]}, ${blob.url})
      `;
      console.log('✓');
      ok++;
    } catch (err) {
      console.log(`✗ ${err.message}`);
      errors++;
    }
  }

  // 6. Eliminar categorías que quedaron sin productos
  const empty = await sql`
    DELETE FROM categories c
    WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id)
    RETURNING c.name`;
  if (empty.length) console.log(`🧹 Categorías vacías eliminadas: ${empty.map(e => e.name).join(', ')}`);

  console.log(`\n✅ Listo: ${ok} productos creados, ${errors} errores`);
}

main().catch(err => { console.error(err); process.exit(1); });
