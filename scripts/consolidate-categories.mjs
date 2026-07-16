// Consolida el catálogo a 6 categorías: Anillos, Collares, Joyeros, Llaveros, Desinfectantes, Otros productos
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

// Asegurar que existan las 6 categorías finales
await sql`INSERT INTO categories (name, slug, icon, color) VALUES ('Desinfectantes', 'desinfectantes', '🧴', '#7fa88a')
          ON CONFLICT (slug) DO NOTHING`;
const cats = Object.fromEntries((await sql`SELECT id, slug FROM categories`).map(c => [c.slug, c.id]));
for (const s of ['anillos', 'collares', 'joyeros', 'llaveros', 'desinfectantes', 'otros-productos']) {
  if (!cats[s]) throw new Error(`Falta categoría ${s}`);
}

// Reasignaciones (por categoría actual, con excepciones por nombre)
const moves = [
  // Collares acero 316L → Collares, salvo la pulsera
  sql`UPDATE products SET category_id = ${cats['otros-productos']} WHERE category_id = (SELECT id FROM categories WHERE slug = 'collares-acero-316l') AND name ILIKE 'pulsera%'`,
  sql`UPDATE products SET category_id = ${cats['collares']} WHERE category_id = (SELECT id FROM categories WHERE slug = 'collares-acero-316l')`,
  // Enchapado oro 18k: rosarios → Collares, manilla → Otros
  sql`UPDATE products SET category_id = ${cats['collares']} WHERE category_id = (SELECT id FROM categories WHERE slug = 'enchapado-oro-18k') AND name ILIKE 'rosario%'`,
  sql`UPDATE products SET category_id = ${cats['otros-productos']} WHERE category_id = (SELECT id FROM categories WHERE slug = 'enchapado-oro-18k')`,
  // Plata 925: cadenita → Collares, anillo → Anillos
  sql`UPDATE products SET category_id = ${cats['collares']} WHERE category_id = (SELECT id FROM categories WHERE slug = 'plata-925') AND name ILIKE 'cadenita%'`,
  sql`UPDATE products SET category_id = ${cats['anillos']} WHERE category_id = (SELECT id FROM categories WHERE slug = 'plata-925')`,
  // Manillas y pulseras → Otros productos
  sql`UPDATE products SET category_id = ${cats['otros-productos']} WHERE category_id IN (SELECT id FROM categories WHERE slug IN ('manillas-acero', 'pulseras'))`,
  // Joyería de princesas (collar y set con collar) → Collares
  sql`UPDATE products SET category_id = ${cats['collares']} WHERE category_id = (SELECT id FROM categories WHERE slug = 'joyeria-princesas')`,
  // Desinfectante Wink → Desinfectantes
  sql`UPDATE products SET category_id = ${cats['desinfectantes']} WHERE name ILIKE 'desinfectante%'`,
];
for (const m of moves) await m;

// Borrar categorías que quedaron vacías
const removed = await sql`
  DELETE FROM categories c
  WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id)
  RETURNING c.name`;
console.log('Categorías eliminadas:', removed.map(r => r.name).join(', ') || '(ninguna)');

console.table(await sql`
  SELECT c.name, COUNT(p.id)::int AS productos
  FROM categories c LEFT JOIN products p ON p.category_id = c.id
  GROUP BY c.name ORDER BY productos DESC`);
