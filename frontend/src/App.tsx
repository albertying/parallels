import React from 'react'
import './index.css'
import Graph from './Graph'

export default function App() {
  return (
    <div style={{ padding: 24, fontFamily: 'Inter, Arial, sans-serif' }}>
      <h1>Parallels — Architecture</h1>
      <p>Hover a node to highlight its connections. Click to lock selection.</p>
      <Graph />
    </div>
  )
}
