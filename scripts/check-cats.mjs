import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
const rows = await sql`SELECT id, name, slug FROM categories ORDER BY id`;
console.log(JSON.stringify(rows, null, 2));
