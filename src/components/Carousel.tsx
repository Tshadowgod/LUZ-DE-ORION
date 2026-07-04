'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

type Announcement = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
};

export default function Carousel({ items }: { items: Announcement[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % items.length), 4500);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="relative liquid-glass glossy-reflection rounded-[2.5rem] overflow-hidden h-56 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, rgba(244,215,211,0.4) 0%, rgba(255,224,136,0.3) 100%)' }}>
        <div className="text-center px-6">
          <p className="font-display text-3xl font-semibold text-primary mb-2">✦ Luz de Orion</p>
          <p className="text-on-surface-variant text-sm font-sans">Joyería artesanal de lujo</p>
        </div>
      </div>
    );
  }

  const item = items[current];

  return (
    <div className="relative rounded-[2.5rem] overflow-hidden h-56 select-none"
      style={{ boxShadow: '0 12px 40px rgba(111,89,86,0.15), inset 0 1px 0 rgba(255,255,255,0.3)' }}>
      {/* Slides */}
      {items.map((slide, i) => (
        <div key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-out ${i === current ? 'opacity-100' : 'opacity-0'}`}>
          {slide.imageUrl ? (
            <Image src={slide.imageUrl} alt={slide.title} fill priority={i === 0}
              sizes="(max-width: 768px) 100vw, 768px"
              className={`object-cover ${i === current ? 'animate-ken-burns' : ''}`} unoptimized />
          ) : (
            <div className="w-full h-full"
              style={{ background: 'linear-gradient(135deg, rgba(244,215,211,0.5) 0%, rgba(255,224,136,0.4) 100%)' }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        </div>
      ))}

      {/* Text overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <p key={`t-${item.id}`} className="font-display text-white text-xl font-semibold leading-tight drop-shadow-sm animate-fade-up">
          {item.title}
        </p>
        {item.description && (
          <p key={`d-${item.id}`} className="text-white/80 text-sm font-sans mt-1 line-clamp-2 drop-shadow-sm animate-fade-up stagger-1">
            {item.description}
          </p>
        )}
      </div>

      {/* Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-4 right-5 flex gap-1.5 z-10">
          {items.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-5' : 'bg-white/50 w-1.5'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
