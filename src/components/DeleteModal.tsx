'use client';

type Props = {
  isOpen: boolean;
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export default function DeleteModal({ isOpen, productName, onConfirm, onCancel, loading }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div
        className="rounded-3xl p-8 max-w-sm w-full text-center"
        style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 0 24px rgba(239,68,68,0.25)' }}
        >
          <span className="text-3xl">🗑️</span>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">¿Eliminar producto?</h2>
        <p className="text-white/50 text-sm mb-7 leading-relaxed">
          ¿Estás segura de eliminar{' '}
          <strong className="text-white/80">&ldquo;{productName}&rdquo;</strong>?{' '}
          Esta acción no se puede deshacer.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium glass-btn disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-all"
            style={{
              background: 'rgba(239,68,68,0.25)',
              border: '1px solid rgba(239,68,68,0.4)',
              color: '#fca5a5',
            }}
          >
            {loading ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
