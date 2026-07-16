import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
const moved = await sql`
  UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'collares')
  WHERE name ILIKE 'collar%' AND category_id = (SELECT id FROM categories WHERE slug = 'otros-productos')
  RETURNING id, name`;
console.log('Movidos a Collares:', moved.map(m => `${m.id} ${m.name}`).join(', ') || '(ninguno)');
console.table(await sql`
  SELECT c.name, COUNT(p.id)::int AS productos
  FROM categories c LEFT JOIN products p ON p.category_id = c.id
  GROUP BY c.name ORDER BY productos DESC`);
