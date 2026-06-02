export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/schema';
import { eq, desc, ilike, and } from 'drizzle-orm';
import { isAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('categoria');
    const search = searchParams.get('buscar');
    const conditions = [];

    if (categorySlug) {
      const [category] = await db.select().from(categories).where(eq(categories.slug, categorySlug)).limit(1);
      if (category) conditions.push(eq(products.categoryId, category.id));
    }
    if (search) conditions.push(ilike(products.name, `%${search}%`));

    const result = await db.select({
      id: products.id, name: products.name, description: products.description,
      price: products.price, stock: products.stock, categoryId: products.categoryId,
      imageUrl: products.imageUrl, createdAt: products.createdAt, updatedAt: products.updatedAt,
      category: { id: categories.id, name: categories.name, slug: categories.slug,
                   icon: categories.icon, color: categories.color },
    }).from(products).leftJoin(categories, eq(products.categoryId, categories.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(products.createdAt));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { name, description, price, stock, categoryId, imageUrl } = body;
    if (!name || !categoryId) {
      return NextResponse.json({ error: 'Nombre y categoría son requeridos' }, { status: 400 });
    }
    const [product] = await db.insert(products).values({
      name, description: description || null, price: price ? String(price) : null,
      stock: Number(stock) || 0, categoryId: Number(categoryId), imageUrl: imageUrl || null,
    }).returning();
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}
