import type { Metadata } from 'next';
import './globals.css';
import TopHeader from '@/components/TopHeader';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'LUZ DE ORIÓN | Joyería de Lujo',
  description: 'Catálogo e inventario de joyería Luz de Orion',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className="min-h-screen">
        <TopHeader />
        <main className="pt-20 pb-28 max-w-screen-xl mx-auto px-6">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
