export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories, products } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { isAdminRequest } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();

  // No cambiamos el slug al editar: se mantiene estable para no romper los
  // enlaces ni el filtro por categoria de los productos existentes.
  const [updated] = await db.update(categories).set({
    ...(body.name      !== undefined && { name: String(body.name).trim() }),
    ...(body.icon      !== undefined && { icon: body.icon?.trim() || null }),
    ...(body.color     !== undefined && { color: body.color?.trim() || null }),
    ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) || 0 }),
  }).where(eq(categories.id, Number(id))).returning();

  if (!updated) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;

  // No se puede eliminar una categoria que aun tiene productos asignados.
  const inUse = await db.select({ id: products.id }).from(products)
    .where(eq(products.categoryId, Number(id))).limit(1);
  if (inUse.length > 0) {
    return NextResponse.json(
      { error: 'No se puede eliminar: hay productos en esta categoría. Cámbialos de categoría o elimínalos primero.' },
      { status: 409 },
    );
  }

  await db.delete(categories).where(eq(categories.id, Number(id)));
  return NextResponse.json({ ok: true });
}
