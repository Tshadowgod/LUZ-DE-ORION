import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Luz de Orion — Inventario',
  description: 'Sistema de inventario para joyería Luz de Orion',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        {/* Ambient orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="orb-1 absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-violet-700/25 blur-[130px]" />
          <div className="orb-2 absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-900/35 blur-[110px]" />
          <div className="orb-3 absolute top-[35%] right-[15%] w-[38vw] h-[38vw] rounded-full bg-pink-800/18 blur-[90px]" />
          <div className="orb-4 absolute top-[5%] right-[30%] w-[28vw] h-[28vw] rounded-full bg-amber-700/15 blur-[70px]" />
        </div>

        <div className="relative z-10">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
