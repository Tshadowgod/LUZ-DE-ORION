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

export default function CategoryFilter({ categories, selected }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilter = useCallback(
    (slug: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) {
        params.set('categoria', slug);
      } else {
        params.delete('categoria');
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleFilter(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
          !selected
            ? 'bg-violet-800 text-white border-violet-800 shadow-md'
            : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-700'
        }`}
      >
        Todos
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleFilter(cat.slug)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all border flex items-center gap-1 ${
            selected === cat.slug
              ? 'bg-violet-800 text-white border-violet-800 shadow-md'
              : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-700'
          }`}
        >
          {cat.icon && <span>{cat.icon}</span>}
          {cat.name}
        </button>
      ))}
    </div>
  );
}
