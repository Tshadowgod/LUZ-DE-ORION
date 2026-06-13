'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) { router.push('/admin'); router.refresh(); }
      else setError('Contraseña incorrecta');
    } catch { setError('Error de conexión'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 animate-fade-up">
          <Link href="/" className="font-display text-3xl font-semibold text-primary inline-block hover:scale-105 transition-transform duration-300">
            ✦ Luz de Orion
          </Link>
          <p className="text-on-surface-variant text-sm font-sans mt-1">Panel Administrador</p>
        </div>

        <div className="liquid-glass glossy-reflection rounded-[2.5rem] p-8 animate-scale-in stagger-1"
          style={{ boxShadow: '0 24px 64px rgba(111,89,86,0.12)' }}>
          <p className="text-[11px] font-bold tracking-[0.2em] text-tertiary font-sans uppercase mb-1">ACCESO</p>
          <h2 className="font-display text-2xl font-semibold text-on-background mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold font-sans tracking-wider uppercase text-on-surface-variant mb-1.5">
                Contraseña
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required autoFocus
                className="liquid-glass-input w-full px-4 py-3 rounded-2xl text-sm font-sans" />
            </div>
            {error && <p className="text-red-400 text-sm font-sans text-center animate-scale-in">{error}</p>}
            <button type="submit" disabled={loading}
              className="glossy-reflection w-full py-3 rounded-2xl bg-primary text-white font-semibold font-sans text-sm hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] active:translate-y-0 transition-all duration-300 disabled:opacity-60">
              {loading ? 'Ingresando...' : 'Ingresar al panel'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-on-surface-variant/50 font-sans animate-fade-in stagger-3">
          <Link href="/" className="hover:text-primary transition-colors">← Volver a la tienda</Link>
        </p>
      </div>
    </div>
  );
}
