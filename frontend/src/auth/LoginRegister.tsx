import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function LoginRegister() {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState<any>({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e: any) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body: any = { email: form.email, password: form.password };
      if (mode === 'register') body.name = form.name;

      const res = await fetch('http://localhost:3000' + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '24px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        <button onClick={() => setMode('login')} disabled={mode === 'login'}>Login</button>
        <button onClick={() => setMode('register')} disabled={mode === 'register'}>Register</button>
      </div>

      <form onSubmit={submit} style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        {mode === 'register' && (
          <input name="name" placeholder="Name" value={form.name} onChange={handle} />
        )}
        <input name="email" placeholder="Email" value={form.email} onChange={handle} />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handle} />
        <button type="submit" disabled={loading}>{loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}</button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>
    </div>
  );
}
