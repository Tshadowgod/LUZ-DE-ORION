import AdminNav from '@/components/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AdminNav />
      <main className="pt-20 pb-28 max-w-screen-xl mx-auto px-6">
        {children}
      </main>
    </div>
  );
}
