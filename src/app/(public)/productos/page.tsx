'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import CategoryFilter from '@/components/CategoryFilter';
import Link from 'next/link';

type Category = { id: number; name: string; slug: string; icon: string | null; color: string | null };
type Product  = { id: number; name: string; description: string | null; price: string | null;
                  stock: number; imageUrl: string | null; category: Category | null };

function CatalogoContent() {
  const router           = useRouter();
  const searchParams     = useSearchParams();
  const selectedCategory = searchParams.get('categoria');
  const searchQuery      = searchParams.get('buscar');
  const { addItem }      = useCart();

  // "loading" se deriva comparando la consulta cargada con la actual:
  // así el efecto no necesita setLoading(true) síncrono.
  const queryKey = `${selectedCategory ?? ''}|${searchQuery ?? ''}`;
  const [result,     setResult]     = useState<{ key: string; products: Product[] } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search,     setSearch]     = useState(searchQuery ?? '');

  const loading  = result?.key !== queryKey;
  const products = loading ? [] : result!.products;

  useEffect(() => { fetch('/api/categorias').then(r => r.json()).then(setCategories); }, []);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (selectedCategory) params.set('categoria', selectedCategory);
    if (searchQuery)      params.set('buscar', searchQuery);
    fetch(`/api/productos?${params}`)
      .then(r => r.json())
      .then((data: Product[]) => { if (!cancelled) setResult({ key: queryKey, products: data }); })
      .catch(() => { if (!cancelled) setResult({ key: queryKey, products: [] }); });
    return () => { cancelled = true; };
  }, [queryKey, selectedCategory, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) params.set('buscar', search.trim()); else params.delete('buscar');
    router.push(`/productos?${params.toString()}`);
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      categoryIcon: product.category?.icon ?? null,
    });
  };

  return (
    <div className="space-y-6">
      <section className="animate-fade-up">
        <p className="text-[11px] font-bold tracking-[0.2em] text-primary font-sans uppercase mb-1 opacity-80">LUZ DE ORIÓN</p>
        <h2 className="font-display text-3xl font-semibold text-on-background">Catálogo</h2>
      </section>

      <form onSubmit={handleSearch} className="flex gap-2 animate-fade-up stagger-1">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar pieza…"
          className="liquid-glass-input flex-1 px-4 py-2.5 rounded-full text-sm font-sans" />
        <button type="submit"
          className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold font-sans hover:bg-primary/90 transition-colors">
          Buscar
        </button>
        {(selectedCategory || searchQuery) && (
          <Link href="/productos"
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
          <span className="text-6xl block mb-4 animate-float">🔍</span>
          <p className="font-display text-xl font-medium text-on-background">No se encontraron piezas</p>
          <p className="text-on-surface-variant text-sm font-sans mt-1">Intenta con otra categoría</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-on-surface-variant/60 font-sans animate-fade-in">
            {products.length} pieza{products.length !== 1 ? 's' : ''} encontrada{products.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p, i) => (
              <div key={p.id} className={`cv-card animate-fade-up stagger-${Math.min((i % 6) + 1, 6)}`}>
                <ProductCard product={p} mode="public" onAddToCart={handleAddToCart} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {[...Array(6)].map((_, i) => <div key={i} className="liquid-glass skeleton-shimmer rounded-[2rem] h-96" />)}
      </div>
    }>
      <CatalogoContent />
    </Suspense>
  );
}
