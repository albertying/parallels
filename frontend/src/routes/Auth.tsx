import { useState } from 'react';

type FormEvent = React.FormEvent<HTMLFormElement>;

type LoginResult = { token?: string; profile?: any };

export default function Auth({ onLogin }: { onLogin?: (res: LoginResult) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profileId, setProfileId] = useState('');
  const [message, setMessage] = useState('');

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, username, password })
      });
      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch (e) { console.warn('Non-JSON register response', text); }
      if (!res.ok) throw new Error(data?.error || 'Registration failed');
      setMessage('Registered. You can now log in.');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as any).message : String(err);
      setMessage(msg);
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch (e) { console.warn('Non-JSON login response', text); }
      if (!res.ok) throw new Error(data?.error || 'Login failed');
      // store token
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      setMessage('Login successful');
      if (onLogin) onLogin({ token: data.token, profile: data.profile });
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as any).message : String(err);
      setMessage(msg);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '1rem auto' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setMode('login')} disabled={mode === 'login'}>Login</button>
        <button onClick={() => setMode('register')} disabled={mode === 'register'}>Register (link profile)</button>
      </div>

      {mode === 'register' ? (
        <form onSubmit={handleRegister}>
          <div>
            <label>Profile ID (from profiles collection)</label>
            <input value={profileId} onChange={(e) => setProfileId(e.target.value)} />
          </div>
          <div>
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit">Register</button>
        </form>
      ) : (
        <form onSubmit={handleLogin}>
          <div>
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit">Login</button>
        </form>
      )}

      {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
  );
}
