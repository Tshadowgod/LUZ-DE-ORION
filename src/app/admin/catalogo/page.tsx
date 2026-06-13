'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import CategoryFilter from '@/components/CategoryFilter';
import DeleteModal from '@/components/DeleteModal';
import Link from 'next/link';

type Category = { id: number; name: string; slug: string; icon: string | null; color: string | null };
type Product  = { id: number; name: string; description: string | null; price: string | null;
                  stock: number; imageUrl: string | null; category: Category | null };

function AdminCatalogoContent() {
  const searchParams     = useSearchParams();
  const selectedCategory = searchParams.get('categoria');
  const searchQuery      = searchParams.get('buscar');

  const [products,     setProducts]     = useState<Product[]>([]);
  const [categories,   setCategories]   = useState<Category[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [search,       setSearch]       = useState(searchQuery ?? '');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('categoria', selectedCategory);
      if (searchQuery)      params.set('buscar', searchQuery);
      const res = await fetch(`/api/productos?${params}`);
      setProducts(await res.json());
    } finally { setLoading(false); }
  }, [selectedCategory, searchQuery]);

  useEffect(() => { fetch('/api/categorias').then(r => r.json()).then(setCategories); }, []);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/productos/${deleteTarget.id}`, { method: 'DELETE' });
      setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (search) params.set('buscar', search); else params.delete('buscar');
    window.location.href = `/admin/catalogo?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 animate-fade-up">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase mb-1">ADMIN</p>
          <h2 className="font-display text-3xl font-semibold text-on-background">Catálogo</h2>
        </div>
        <Link href="/admin/catalogo/nuevo"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-white text-sm font-semibold font-sans hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-300">
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'wght' 200, 'opsz' 20" }}>add</span>
          Nueva pieza
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 animate-fade-up stagger-1">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar pieza…"
          className="liquid-glass-input flex-1 px-4 py-2.5 rounded-full text-sm font-sans" />
        <button type="submit"
          className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold font-sans hover:bg-primary/90 transition-colors">
          Buscar
        </button>
        {(selectedCategory || searchQuery) && (
          <Link href="/admin/catalogo"
            className="px-4 py-2.5 rounded-full text-sm font-sans liquid-glass-dark text-on-surface-variant hover:text-primary transition-colors">
            Limpiar
          </Link>
        )}
      </form>

      <div className="animate-fade-up stagger-2">
        <CategoryFilter categories={categories} selected={selectedCategory} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="liquid-glass skeleton-shimmer rounded-[2rem] h-96" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 animate-scale-in">
          <span className="text-6xl block mb-4 animate-float">📦</span>
          <p className="font-display text-xl font-medium text-on-background">No hay productos</p>
          <Link href="/admin/catalogo/nuevo"
            className="inline-block mt-5 px-6 py-3 rounded-full bg-primary text-white text-sm font-semibold font-sans hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            Agregar primera pieza
          </Link>
        </div>
      ) : (
        <>
          <p className="text-xs text-on-surface-variant/60 font-sans animate-fade-in">{products.length} pieza{products.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p, i) => (
              <div key={p.id} className={`animate-fade-up stagger-${Math.min((i % 6) + 1, 6)}`}>
                <ProductCard product={p} mode="admin" onDelete={() => setDeleteTarget(p)} />
              </div>
            ))}
          </div>
        </>
      )}

      <DeleteModal isOpen={!!deleteTarget} productName={deleteTarget?.name ?? ''}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  );
}

export default function AdminCatalogoPage() {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {[...Array(6)].map((_, i) => <div key={i} className="liquid-glass skeleton-shimmer rounded-[2rem] h-96" />)}
      </div>
    }>
      <AdminCatalogoContent />
    </Suspense>
  );
}
