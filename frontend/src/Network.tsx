import React, { useState } from 'react'
import Graph from './Graph'

type Profile = { id: string; name: string; score?: number }

export default function Network() {
  const [id, setId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [original, setOriginal] = useState<Profile | null>(null)
  const [similar, setSimilar] = useState<Profile[]>([])

  const apiBase = 'http://localhost:3000'

  const findSimilar = async () => {
    if (!id) return setError('Enter an id')
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/similar/${encodeURIComponent(id)}?limit=8`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      // backend returns { originalProfile: {id,name}, similarProfiles: [...] }
      setOriginal(body.originalProfile || { id, name: id })
      const s = (body.similarProfiles || body.similar || []).map((p: any) => ({ id: String(p._id || p.id || p), name: p.name || p.label || String(p._id || p.id), score: p.score }))
      setSimilar(s)
    } catch (e: any) {
      setError(e.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  // build nodes/links for Graph: center original -> similar nodes
  const nodes = original ? [{ id: original.id, label: original.name, group: 1 }, ...similar.map((s) => ({ id: s.id, label: s.name, group: 2 }))] : []
  const links = original ? similar.map((s) => ({ source: original.id, target: s.id, value: s.score ?? 1 })) : []

  return (
    <div style={{ padding: 20 }}>
      <h1>Network — find similar profiles</h1>
      <div style={{ marginBottom: 12 }}>
        <input id="profile-id" value={id} onChange={(e) => setId(e.target.value)} placeholder="Enter profile id" />
        <button onClick={findSimilar} style={{ marginLeft: 8 }} disabled={loading}>{loading ? 'Searching...' : 'Find Similar'}</button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </div>

      {original && (
        <div>
          <h3>Original: {original.name} ({original.id})</h3>
          <div style={{ marginTop: 8 }}>
            <Graph dataNodes={nodes as any} dataLinks={links as any} width={860} height={420} />
          </div>
          <div style={{ marginTop: 12 }}>
            <strong>Similar Profiles</strong>
            <ul>
              {similar.map((s) => (
                <li key={s.id}>{s.name} — score: {s.score ?? 'n/a'}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
