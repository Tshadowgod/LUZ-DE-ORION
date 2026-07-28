export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { isAdminRequest } from '@/lib/auth';

export async function GET() {
  try {
    const result = await db.select().from(categories)
      .orderBy(categories.sortOrder, categories.name);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
  }
}

// Genera un slug (identificador para la URL) a partir del nombre:
// minusculas, sin acentos y con guiones en lugar de espacios.
function slugify(text: string) {
  return text.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'categoria';
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const body = await request.json();
  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
  }

  // Aseguramos un slug unico: si ya existe, agregamos -2, -3, ...
  const base = slugify(body.name);
  let slug = base;
  let n = 2;
  while ((await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug))).length > 0) {
    slug = `${base}-${n++}`;
  }

  const [item] = await db.insert(categories).values({
    name: body.name.trim(),
    slug,
    icon: body.icon?.trim() || null,
    color: body.color?.trim() || null,
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
  }).returning();

  return NextResponse.json(item, { status: 201 });
}
