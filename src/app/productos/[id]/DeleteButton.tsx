'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DeleteModal from '@/components/DeleteModal';

type Props = { productId: number; productName: string };

export default function DeleteButton({ productId, productName }: Props) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/productos/${productId}`, { method: 'DELETE' });
    router.push('/productos');
    router.refresh();
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="px-4 py-3 rounded-xl text-sm font-medium glass-btn-red">
        🗑️ Eliminar
      </button>
      <DeleteModal isOpen={open} productName={productName}
        onConfirm={handleDelete} onCancel={() => setOpen(false)} loading={loading} />
    </>
  );
}
