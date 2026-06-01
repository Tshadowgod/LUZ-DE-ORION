'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DeleteModal from '@/components/DeleteModal';

export default function DeleteButton({ productId, productName }: { productId: number; productName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/productos/${productId}`, { method: 'DELETE' });
    router.push('/productos'); router.refresh();
  };
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="px-4 py-3 rounded-2xl text-sm font-semibold font-sans border border-red-100 text-red-400 hover:bg-red-50 transition-colors">
        🗑️ Eliminar
      </button>
      <DeleteModal isOpen={open} productName={productName} onConfirm={handleDelete} onCancel={() => setOpen(false)} loading={loading} />
    </>
  );
}
