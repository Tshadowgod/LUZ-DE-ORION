import { CartProvider } from '@/context/CartContext';
import TopHeader from '@/components/TopHeader';
import BottomNav from '@/components/BottomNav';
import CartSidebar from '@/components/CartSidebar';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {/* App shell: las barras son parte del armazón (no flotantes),
          solo el contenido central hace scroll */}
      <div className="app-shell">
        <TopHeader />
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
          <main className="py-6 pb-10 max-w-screen-xl mx-auto px-6 w-full">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
      <CartSidebar />
    </CartProvider>
  );
}
