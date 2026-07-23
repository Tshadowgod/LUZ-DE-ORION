export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { isAdminRequest } from '@/lib/auth';

// API exclusiva del panel admin: incluye el costo, que nunca debe
// exponerse en las rutas publicas de productos.

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const result = await db.select({
      id: products.id, name: products.name, imageUrl: products.imageUrl,
      price: products.price, cost: products.cost, stock: products.stock,
      categoryName: categories.name, categoryIcon: categories.icon,
    }).from(products).leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(asc(products.name));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Error al obtener inventario' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Producto invalido' }, { status: 400 });
    }

    const toMoney = (value: unknown) => {
      if (value === null || value === undefined || value === '') return null;
      const n = Number(value);
      return Number.isFinite(n) && n >= 0 ? n.toFixed(2) : undefined;
    };

    const set: { price?: string | null; cost?: string | null; stock?: number; updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if ('price' in body) {
      const price = toMoney(body.price);
      if (price === undefined) return NextResponse.json({ error: 'Precio invalido' }, { status: 400 });
      set.price = price;
    }
    if ('cost' in body) {
      const cost = toMoney(body.cost);
      if (cost === undefined) return NextResponse.json({ error: 'Costo invalido' }, { status: 400 });
      set.cost = cost;
    }
    if ('stock' in body) {
      const stock = Number(body.stock);
      if (!Number.isFinite(stock) || stock < 0) {
        return NextResponse.json({ error: 'Unidades invalidas' }, { status: 400 });
      }
      set.stock = Math.floor(stock);
    }

    const [updated] = await db.update(products).set(set)
      .where(eq(products.id, id)).returning();

    if (!updated) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    return NextResponse.json({ id: updated.id, price: updated.price, cost: updated.cost, stock: updated.stock });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ error: 'Error al actualizar inventario' }, { status: 500 });
  }
}
