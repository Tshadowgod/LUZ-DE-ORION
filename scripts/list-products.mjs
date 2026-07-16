import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
const rows = await sql`
  SELECT p.id, p.name, p.price, c.name AS cat
  FROM products p JOIN categories c ON c.id = p.category_id
  ORDER BY c.name, p.name, p.id`;
for (const r of rows) console.log(`${String(r.id).padStart(3)} | ${r.cat.padEnd(16)} | ${r.name} | ${r.price ?? '—'}`);
