import { CartProvider } from '@/context/CartContext';
import TopHeader from '@/components/TopHeader';
import BottomNav from '@/components/BottomNav';
import CartSidebar from '@/components/CartSidebar';
import CartButton from '@/components/CartButton';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <TopHeader />
      {/* El scroll vive en este contenedor (no en el body) para que
          las barras fijas no salten cuando el navegador móvil
          oculta/muestra su barra de direcciones */}
      <div className="fixed inset-0 overflow-y-auto overscroll-contain">
        <main className="pt-20 pb-28 max-w-screen-xl mx-auto px-6">
          {children}
        </main>
      </div>
      <BottomNav />
      <CartSidebar />
      <CartButton />
    </CartProvider>
  );
}
