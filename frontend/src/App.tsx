import { useEffect, useState } from 'react'
import './App.css'
import Graph from './Graph'
import Auth from './routes/Auth'

type Person = { id: number; name: string; email?: string }

export default function App() {
  const [items, setItems] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [profile, setProfile] = useState<any>(() => {
    try {
      return localStorage.getItem('profile') ? JSON.parse(localStorage.getItem('profile') as string) : null
    } catch { return null }
  })
  const [showAuth, setShowAuth] = useState(!token)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('http://localhost:4000/api/query')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const body = await res.json()
        setItems(body.data || [])
      } catch (e: any) {
        setError(e.message || 'Fetch error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function handleLogin(result: { token?: string; profile?: any }) {
    if (result.token) setToken(result.token)
    if (result.profile) {
      setProfile(result.profile)
      localStorage.setItem('profile', JSON.stringify(result.profile))
    }
    setShowAuth(false)
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Parallels — DB Query + Graph</h1>

      {!token ? (
        <div>
          <p>Please log in or register to continue.</p>
          <button onClick={() => setShowAuth(true)}>Open Auth</button>
          {showAuth && <Auth onLogin={handleLogin} />}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <strong>Signed in as:</strong> {profile?.name || 'Unknown'}
            <button style={{ marginLeft: 12 }} onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('profile'); setToken(null); setProfile(null); }}>Logout</button>
          </div>

          <div className="card">
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!loading && !error && (
              <ul>
                {items.map((it) => (
                  <li key={it.id}>{it.name} — {it.email}</li>
                ))}
              </ul>
            )}
          </div>

          <section style={{ marginTop: 18 }}>
            <h2>Architecture Graph</h2>
            <Graph />
          </section>
        </>
      )}
    </div>
  )
}
 
