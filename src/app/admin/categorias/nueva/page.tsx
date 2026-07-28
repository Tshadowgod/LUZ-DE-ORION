import CategoryForm from '@/components/CategoryForm';
import Link from 'next/link';

export default function AdminNuevaCategoriaPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-8 text-sm font-sans animate-fade-in">
        <Link href="/admin/categorias" className="text-on-surface-variant/60 hover:text-primary hover:-translate-x-0.5 transition-all inline-block">← Categorías</Link>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface-variant font-medium">Nueva categoría</span>
      </div>
      <div className="liquid-glass glossy-reflection rounded-[2.5rem] p-8 animate-scale-in">
        <p className="text-[11px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase mb-1">NUEVA CATEGORÍA</p>
        <h2 className="font-display text-2xl font-semibold text-on-background mb-6">Crear categoría</h2>
        <CategoryForm mode="create" />
      </div>
    </div>
  );
}
