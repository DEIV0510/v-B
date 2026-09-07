'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      setError('Correo o contraseña incorrectos.');
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      {error && <div className="admin-alert admin-alert--error">{error}</div>}
      <div className="admin-field">
        <label htmlFor="email">Correo</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
      </div>
      <div className="admin-field">
        <label htmlFor="password">Contraseña</label>
        <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
        {loading ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}
