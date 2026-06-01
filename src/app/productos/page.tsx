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

function ProductsContent() {
  const searchParams      = useSearchParams();
  const selectedCategory  = searchParams.get('categoria');
  const searchQuery       = searchParams.get('buscar');

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
      if (searchQuery)       params.set('buscar', searchQuery);
      const res  = await fetch(`/api/productos?${params}`);
      const data = await res.json();
      setProducts(data);
    } finally { setLoading(false); }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetch('/api/categorias').then((r) => r.json()).then(setCategories);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/productos/${deleteTarget.id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (search) params.set('buscar', search); else params.delete('buscar');
    window.location.href = `/productos?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">Inventario</h1>
        <Link href="/productos/nuevo" className="glass-btn-primary px-4 py-2.5 rounded-xl font-medium text-sm">
          + Agregar producto
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto…"
          className="glass-input flex-1 px-4 py-2.5 rounded-xl text-sm"
        />
        <button type="submit" className="px-4 py-2.5 rounded-xl text-sm glass-btn-primary">
          Buscar
        </button>
        {(selectedCategory || searchQuery) && (
          <Link href="/productos" className="px-4 py-2.5 rounded-xl text-sm glass-btn">
            Limpiar
          </Link>
        )}
      </form>

      <CategoryFilter categories={categories} selected={selectedCategory} />

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card rounded-3xl h-72 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4 filter drop-shadow-lg">🔍</span>
          <p className="text-white/50 font-medium">No se encontraron productos</p>
          <p className="text-white/30 text-sm mt-1">Intenta con otra categoría o búsqueda</p>
          <Link href="/productos/nuevo"
            className="inline-block mt-5 px-5 py-2.5 rounded-xl text-sm font-medium glass-btn-primary">
            Agregar primer producto
          </Link>
        </div>
      ) : (
        <>
          <p className="text-xs text-white/35">
            {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onDelete={() => setDeleteTarget(p)} />
            ))}
          </div>
        </>
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        productName={deleteTarget?.name ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="glass-card rounded-3xl h-72 animate-pulse" />
        ))}
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
