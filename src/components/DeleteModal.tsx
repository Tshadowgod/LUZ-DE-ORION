'use client';

type Props = { isOpen: boolean; productName: string; onConfirm: () => void; onCancel: () => void; loading?: boolean };

export default function DeleteModal({ isOpen, productName, onConfirm, onCancel, loading }: Props) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(251,249,245,0.7)', backdropFilter: 'blur(12px)' }}>
      <div className="liquid-glass rounded-[2.5rem] p-8 max-w-sm w-full text-center glossy-reflection"
        style={{ boxShadow: '0 24px 64px rgba(111,89,86,0.15)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-red-50 border border-red-100">
          <span className="text-3xl">🗑️</span>
        </div>
        <h2 className="font-display text-xl font-semibold text-on-background mb-2">¿Eliminar producto?</h2>
        <p className="text-on-surface-variant text-sm font-sans mb-7 leading-relaxed">
          ¿Segura que deseas eliminar{' '}
          <strong className="text-primary">&ldquo;{productName}&rdquo;</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold font-sans liquid-glass-dark text-on-surface-variant hover:bg-primary-container/30 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold font-sans bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50">
            {loading ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
