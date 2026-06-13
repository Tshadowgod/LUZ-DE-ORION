import AdminNav from '@/components/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <AdminNav slot="top" />
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
        <main className="py-6 pb-10 max-w-screen-xl mx-auto px-6 w-full">
          {children}
        </main>
      </div>
      <AdminNav slot="bottom" />
    </div>
  );
}
