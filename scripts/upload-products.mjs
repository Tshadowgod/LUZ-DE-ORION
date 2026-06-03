import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { put } from '@vercel/blob';
import { readFileSync } from 'fs';
import { join } from 'path';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);
const MEDIA_DIR = 'C:\\Users\\ASUS\\Downloads\\LDO_imagenes\\xl\\media';

// Ensure Pulseras category exists
async function ensureCategories() {
  const existing = await sql`SELECT id, slug FROM categories`;
  const slugs = existing.map(r => r.slug);
  if (!slugs.includes('pulseras')) {
    await sql`INSERT INTO categories (name, slug, icon, color) VALUES ('Pulseras', 'pulseras', '📿', '#b5813d')`;
    console.log('✓ Categoría Pulseras creada');
  }
  const cats = await sql`SELECT id, slug FROM categories`;
  return Object.fromEntries(cats.map(c => [c.slug, c.id]));
}

async function uploadImage(filename) {
  const filepath = join(MEDIA_DIR, filename);
  const buffer = readFileSync(filepath);
  const blob = await put(`catalogo/${filename}`, buffer, {
    access: 'public',
    contentType: 'image/png',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return blob.url;
}

// Product definitions: [imageFile, name, categorySlug, price, stock, description]
const PRODUCTS = [
  ['image1.png',  'Collar Doble Caída Flor de Loto Blanca',    'collares',    336, 50, 'Collar doble cadena dorada con colgante flor de loto blanca y cristales'],
  ['image2.png',  'Collar Flores Rosas con Perlas',            'collares',    336, 50, 'Collar cadena dorada con flores rosas y perlas blancas'],
  ['image9.png',  'Collar Doble Cadena con Mariposa Dorada',   'collares',    336, 50, 'Collar doble cadena con colgante de mariposa dorada'],
  ['image10.png', 'Collar Flor de Loto Rosa',                  'collares',    336, 50, 'Collar doble cadena dorada con colgante flor de loto color rosa'],
  ['image11.png', 'Collar Cadena Cubana Dorada',               'collares',    336, 50, 'Collar estilo cubano con eslabones dorados y detalles de circonitas'],
  ['image21.png', 'Collar con Colgante de Rosa',               'collares',    336, 50, 'Collar cadena dorada con colgante de rosa en tono rosa y dorado'],
  ['image22.png', 'Collar Colgante Flor Estrella',             'collares',    336, 50, 'Collar cadena dorada con colgante de flor estrella con circonitas'],
  ['image23.png', 'Collar Colgante Planeta Saturno',           'collares',    336, 50, 'Collar cadena dorada con colgante de planeta con destellos'],
  ['image25.png', 'Collar Mariposa Azul Dorada',               'collares',    336, 50, 'Collar cadena dorada con colgante de mariposa azul y dorada'],
  ['image26.png', 'Collar Doble Flores Rojas y Cherries',      'collares',    336, 50, 'Collar doble cadena con flores rojas y colgante de cherries'],
  ['image27.png', 'Collar Corazón Fresa Rosa',                 'collares',    336, 50, 'Collar cadena dorada con colgante de corazón tipo fresa en tono rosa'],
  ['image3.png',  'Anillo Solitario Corazón Dorado',           'anillos',     270, 35, 'Anillo dorado con piedra corazón de circonita transparente'],
  ['image4.png',  'Anillo Corazón con Motivos Dorados',        'anillos',     270, 35, 'Anillo dorado con piedra corazón grande y detalles decorativos'],
  ['image5.png',  'Anillo Cuadrado con Circonitas',            'anillos',     270, 35, 'Anillo dorado con piedra cuadrada rodeada de circonitas'],
  ['image7.png',  'Anillo Solitario con Circonitas Laterales', 'anillos',     260, 35, 'Anillo solitario dorado con circonita central y laterales'],
  ['image8.png',  'Anillo Solitario Clásico Dorado',           'anillos',     240, 35, 'Anillo solitario clásico con base dorada trenzada'],
  ['image13.png', 'Anillo Tulipán Turquesa',                   'anillos',     300, 20, 'Anillo dorado con piedra turquesa en forma de tulipán'],
  ['image14.png', 'Anillo Tulipán con Cristal',                'anillos',     300, 20, 'Anillo dorado con piedra cristal en forma de tulipán y circonitas'],
  ['image15.png', 'Set Anillos Corazón de Colores',            'anillos',     440, 50, 'Set de anillos corazón dorados en 5 colores: azul, rojo, verde, rosa y blanco'],
  ['image6.png',  'Set Mariposa Dorada con Aretes',            'aritos',      300, 20, 'Conjunto de anillo mariposa dorada con aretes a juego de circonitas'],
  ['image12.png', 'Aretes Mariposa con Brillantes',            'aritos',      300, 50, 'Aretes de mariposa dorada con circonitas brillantes en las alas'],
  ['image19.png', 'Pulsera Charms Marina',                     'pulseras',    300, 20, 'Pulsera cadena dorada con charms de caballito de mar, cangrejo y concha'],
  ['image20.png', 'Pulsera Charms Dorados',                    'pulseras',    300, 20, 'Pulsera cadena dorada con charms de estrella de mar, flor y pájaro'],
  ['image24.png', 'Pulsera Doble Dorada con Medallón',         'pulseras',    300, 20, 'Pulsera doble cadena dorada con medallón central y perlas'],
  ['image16.png', 'Spray Desinfectante Wink',                  'desinfectante', 50, 50, 'Spray desinfectante Wink disponible en varios colores con llavero'],
  ['image17.png', 'Caja para Joyería',                         'joyeros',     580, 50, 'Caja organizadora de joyería en cuero sintético, disponible en 4 colores'],
  ['image18.png', 'Cajas Acrílicas para Anillos',              'joyeros',     580, 50, 'Set de cajas acrílicas transparentes para exhibición y almacenamiento de anillos'],
];

async function main() {
  console.log('🔑 Configurando categorías...');
  const cats = await ensureCategories();
  console.log('Categorías:', cats);

  let created = 0;
  let errors = 0;

  for (const [img, name, catSlug, price, stock, description] of PRODUCTS) {
    try {
      process.stdout.write(`📤 Subiendo ${img} → ${name}... `);
      const imageUrl = await uploadImage(img);
      const categoryId = cats[catSlug];

      await sql`
        INSERT INTO products (name, description, price, stock, category_id, image_url)
        VALUES (${name}, ${description}, ${price}, ${stock}, ${categoryId}, ${imageUrl})
      `;
      console.log(`✓`);
      created++;
    } catch (err) {
      console.log(`✗ Error: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n✅ Completado: ${created} productos creados, ${errors} errores`);
}

main().catch(console.error);
