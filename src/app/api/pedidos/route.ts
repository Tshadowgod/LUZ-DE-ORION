export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, products } from '@/lib/schema';
import { desc, inArray, eq } from 'drizzle-orm';
import { isAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
  if (allOrders.length === 0) return NextResponse.json([]);

  const items = await db.select().from(orderItems)
    .where(inArray(orderItems.orderId, allOrders.map(o => o.id)));

  return NextResponse.json(allOrders.map(o => ({
    ...o,
    items: items.filter(i => i.orderId === o.id),
  })));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const requested: { id?: number; quantity?: number }[] = Array.isArray(body?.items) ? body.items : [];
  if (requested.length === 0) {
    return NextResponse.json({ error: 'Pedido vacío' }, { status: 400 });
  }

  // Nombre, precio e imagen se toman de la base de datos, no del cliente
  const ids = [...new Set(requested.map(i => Number(i.id)).filter(Number.isInteger))];
  if (ids.length === 0) return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 });
  const found = await db.select().from(products).where(inArray(products.id, ids));

  const lines = requested.flatMap(r => {
    const p = found.find(f => f.id === Number(r.id));
    if (!p) return [];
    const quantity = Math.min(99, Math.max(1, Math.trunc(Number(r.quantity) || 1)));
    return [{ productId: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl, quantity }];
  });
  if (lines.length === 0) return NextResponse.json({ error: 'Productos no encontrados' }, { status: 400 });

  const total = lines.reduce((sum, l) => sum + Number(l.price ?? 0) * l.quantity, 0);

  const [order] = await db.insert(orders).values({
    customerName: typeof body.customerName === 'string' ? body.customerName.slice(0, 255) || null : null,
    customerPhone: typeof body.customerPhone === 'string' ? body.customerPhone.slice(0, 50) || null : null,
    total: total.toFixed(2),
  }).returning();

  await db.insert(orderItems).values(lines.map(l => ({ ...l, orderId: order.id })));

  return NextResponse.json({ id: order.id }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const body = await request.json();
  const id = Number(body?.id);
  const status = body?.status === 'atendido' ? 'atendido' : 'nuevo';
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Id inválido' }, { status: 400 });

  const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
  if (!updated) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const id = Number(request.nextUrl.searchParams.get('id'));
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Id inválido' }, { status: 400 });

  await db.delete(orders).where(eq(orders.id, id));
  return NextResponse.json({ ok: true });
}
