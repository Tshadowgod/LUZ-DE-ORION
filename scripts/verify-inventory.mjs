import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

const byCat = await sql`
  SELECT c.name, COUNT(p.id)::int AS productos, COUNT(*) FILTER (WHERE p.stock = 0)::int AS agotados
  FROM categories c LEFT JOIN products p ON p.category_id = c.id
  GROUP BY c.name ORDER BY productos DESC`;
console.table(byCat);
const [tot] = await sql`SELECT COUNT(*)::int AS total, COUNT(image_url)::int AS con_imagen FROM products`;
console.log(tot);

// comprobar que una imagen del Blob responde
const [{ image_url }] = await sql`SELECT image_url FROM products ORDER BY id LIMIT 1`;
const res = await fetch(image_url, { method: 'HEAD' });
console.log('Blob HEAD:', res.status, image_url.slice(0, 80) + '...');
