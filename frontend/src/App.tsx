import { useEffect, useState } from 'react'
import './App.css'
import Graph from './Graph'

type Person = { id: number; name: string; email?: string }

export default function App() {
  const [items, setItems] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div style={{ padding: 20 }}>
      <h1>Parallels — DB Query + Graph</h1>

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
    </div>
  )
}
 
