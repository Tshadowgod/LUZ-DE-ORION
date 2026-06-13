import AdminNav from '@/components/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AdminNav />
      {/* Scroll en contenedor interno para que las barras fijas
          no se muevan con la barra de direcciones del navegador */}
      <div className="fixed inset-0 overflow-y-auto overscroll-contain">
        <main className="pt-20 pb-28 max-w-screen-xl mx-auto px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
