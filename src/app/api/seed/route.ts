import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';

const DEFAULT_CATEGORIES = [
  { name: 'Anillos', slug: 'anillos', icon: '💍', color: 'bg-pink-100 text-pink-800' },
  { name: 'Collares', slug: 'collares', icon: '📿', color: 'bg-purple-100 text-purple-800' },
  { name: 'Aritos', slug: 'aritos', icon: '✨', color: 'bg-yellow-100 text-yellow-800' },
  { name: 'Joyeros', slug: 'joyeros', icon: '💎', color: 'bg-blue-100 text-blue-800' },
  { name: 'Llaveros', slug: 'llaveros', icon: '🔑', color: 'bg-green-100 text-green-800' },
  { name: 'Desinfectante', slug: 'desinfectante', icon: '🧴', color: 'bg-cyan-100 text-cyan-800' },
];

export async function POST() {
  try {
    for (const cat of DEFAULT_CATEGORIES) {
      await db.insert(categories).values(cat).onConflictDoNothing();
    }
    return NextResponse.json({ message: 'Categorías creadas exitosamente' });
  } catch (error) {
    console.error('Error seeding:', error);
    return NextResponse.json({ error: 'Error al crear categorías' }, { status: 500 });
  }
}
