import { CartProvider } from '@/context/CartContext';
import TopHeader from '@/components/TopHeader';
import BottomNav from '@/components/BottomNav';
import CartSidebar from '@/components/CartSidebar';
import CartButton from '@/components/CartButton';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <TopHeader />
      <main className="pt-20 pb-28 max-w-screen-xl mx-auto px-6">
        {children}
      </main>
      <BottomNav />
      <CartSidebar />
      <CartButton />
    </CartProvider>
  );
}
