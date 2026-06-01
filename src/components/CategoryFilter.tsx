'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

type Category = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
};

type Props = {
  categories: Category[];
  selected: string | null;
};

const catGlows: Record<string, string> = {
  anillos:       '0 0 16px rgba(236,72,153,0.45)',
  collares:      '0 0 16px rgba(139,92,246,0.45)',
  aritos:        '0 0 16px rgba(245,158,11,0.45)',
  joyeros:       '0 0 16px rgba(59,130,246,0.45)',
  llaveros:      '0 0 16px rgba(16,185,129,0.45)',
  desinfectante: '0 0 16px rgba(6,182,212,0.45)',
};

export default function CategoryFilter({ categories, selected }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilter = useCallback(
    (slug: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) params.set('categoria', slug);
      else params.delete('categoria');
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleFilter(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          !selected
            ? 'glass-btn-primary'
            : 'glass-btn text-white/60'
        }`}
        style={!selected ? { boxShadow: '0 0 20px rgba(124,58,237,0.4)' } : {}}
      >
        Todos
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleFilter(cat.slug)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
            selected === cat.slug ? 'glass-btn-primary' : 'glass-btn text-white/60'
          }`}
          style={selected === cat.slug ? { boxShadow: catGlows[cat.slug] ?? '' } : {}}
        >
          {cat.icon && <span>{cat.icon}</span>}
          {cat.name}
        </button>
      ))}
    </div>
  );
}
