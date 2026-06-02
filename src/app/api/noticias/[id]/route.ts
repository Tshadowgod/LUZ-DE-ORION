export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { announcements } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { isAdminRequest } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();

  const [updated] = await db.update(announcements).set({
    ...(body.title       !== undefined && { title: body.title }),
    ...(body.description !== undefined && { description: body.description || null }),
    ...(body.imageUrl    !== undefined && { imageUrl: body.imageUrl || null }),
    ...(body.isActive    !== undefined && { isActive: body.isActive }),
  }).where(eq(announcements.id, Number(id))).returning();

  if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;
  await db.delete(announcements).where(eq(announcements.id, Number(id)));
  return NextResponse.json({ ok: true });
}
