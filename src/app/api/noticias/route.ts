export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { announcements } from '@/lib/schema';
import { and, desc, eq } from 'drizzle-orm';
import { isAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const showAll = request.nextUrl.searchParams.get('all') === 'true';
  // Filtro opcional por ubicacion: 'carousel' o 'popup'
  const placement = request.nextUrl.searchParams.get('placement');
  const isAdmin = showAll ? await isAdminRequest(request) : false;

  const conditions = [];
  if (!isAdmin) conditions.push(eq(announcements.isActive, true));
  if (placement) conditions.push(eq(announcements.placement, placement));

  const where = conditions.length === 1 ? conditions[0]
    : conditions.length > 1 ? and(...conditions)
    : undefined;

  const items = await db.select().from(announcements)
    .where(where)
    .orderBy(desc(announcements.createdAt));

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const body = await request.json();
  if (!body.title) return NextResponse.json({ error: 'Título requerido' }, { status: 400 });

  const [item] = await db.insert(announcements).values({
    title: body.title,
    description: body.description || null,
    imageUrl: body.imageUrl || null,
    isActive: body.isActive ?? true,
    placement: body.placement === 'popup' ? 'popup' : 'carousel',
  }).returning();

  return NextResponse.json(item, { status: 201 });
}
