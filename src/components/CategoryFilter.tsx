'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

type Category = { id: number; name: string; slug: string; icon: string | null; color: string | null };
type Props = { categories: Category[]; selected: string | null };

export default function CategoryFilter({ categories, selected }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilter = useCallback((slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set('categoria', slug); else params.delete('categoria');
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  return (
    <div className="flex gap-2 overflow-x-auto scroll-hide pb-1">
      <button onClick={() => handleFilter(null)}
        className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold font-sans tracking-wide transition-all duration-300 active:scale-95 ${
          !selected
            ? 'bg-primary text-white shadow-md scale-105'
            : 'liquid-glass-dark text-on-surface-variant hover:text-primary hover:-translate-y-0.5'
        }`}>
        Todas
      </button>
      {categories.map((cat) => (
        <button key={cat.id} onClick={() => handleFilter(cat.slug)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold font-sans tracking-wide transition-all duration-300 active:scale-95 flex items-center gap-1.5 ${
            selected === cat.slug
              ? 'bg-primary text-white shadow-md scale-105'
              : 'liquid-glass-dark text-on-surface-variant hover:text-primary hover:-translate-y-0.5'
          }`}>
          {cat.icon} {cat.name}
        </button>
      ))}
    </div>
  );
}
