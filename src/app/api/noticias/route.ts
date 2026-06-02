export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { announcements } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';
import { isAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const showAll = request.nextUrl.searchParams.get('all') === 'true';
  const isAdmin = showAll ? await isAdminRequest(request) : false;

  const items = isAdmin
    ? await db.select().from(announcements).orderBy(desc(announcements.createdAt))
    : await db.select().from(announcements).where(eq(announcements.isActive, true)).orderBy(desc(announcements.createdAt));

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
  }).returning();

  return NextResponse.json(item, { status: 201 });
}
