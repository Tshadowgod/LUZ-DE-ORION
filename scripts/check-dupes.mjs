import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

const [tot] = await sql`SELECT COUNT(*)::int AS total FROM products`;
console.log('Total productos:', tot.total);
console.table(await sql`
  SELECT name, price, COUNT(*)::int AS n, MIN(id) AS min_id, MAX(id) AS max_id,
         COUNT(DISTINCT image_url)::int AS imgs
  FROM products GROUP BY name, price HAVING COUNT(*) > 1 ORDER BY n DESC`);
console.table(await sql`SELECT id, name, price, stock, created_at FROM products ORDER BY created_at DESC, id DESC LIMIT 12`);
