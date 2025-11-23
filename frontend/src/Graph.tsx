import React, { useMemo, useRef, useState } from 'react'
import { nodes as rawNodes, links } from './data/graphData'

type Props = { width?: number; height?: number }

const Graph: React.FC<Props> = ({ width = 700, height = 360 }) => {
  const [hovered, setHovered] = useState<string | null>(null)
  const [locked, setLocked] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const cx = width / 2
  const cy = height / 2
  const r = Math.min(width, height) / 2 - 60

  // compute circular layout positions
  const nodes = useMemo(
    () =>
      rawNodes.map((n, i) => {
        const angle = (i / rawNodes.length) * Math.PI * 2
        return {
          ...n,
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle),
        }
      }),
    [cx, cy, r],
  )

  const find = (id: string) => nodes.find((n) => n.id === id)!

  const connections = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    for (const n of nodes) map[n.id] = new Set()
    for (const l of links) {
      map[l.source]?.add(l.target)
      map[l.target]?.add(l.source)
    }
    return map
  }, [nodes])

  const active = locked ?? hovered

  const linkIsActive = (l: typeof links[0]) => {
    if (!active) return true
    return l.source === active || l.target === active
  }

  const nodeIsConnectedToActive = (id: string) => {
    if (!active) return true
    return id === active || connections[active]?.has(id)
  }

  const onNodeClick = (id: string) => setLocked((prev) => (prev === id ? null : id))
  const onSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const tooltipNode = hovered ? nodes.find((n) => n.id === hovered) ?? null : null
  const neighbors = tooltipNode ? Array.from(connections[tooltipNode.id] || []) : []

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ borderRadius: 6, background: '#fafafa', display: 'block' }}
        onMouseMove={onSvgMouseMove}
      >
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.12" />
        </filter>
        <marker
          id="arrow"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="#94a3b8" />
        </marker>
      </defs>

      {links.map((l, i) => {
        const s = find(l.source)
        const t = find(l.target)
        const activeLink = linkIsActive(l)
        const stroke = activeLink ? (active ? '#2563eb' : '#cbd5e1') : '#e6eef8'
        const strokeWidth = activeLink ? Math.max(2, (l.value || 1) * 2) : Math.max(1, (l.value || 1) * 1.2)
        const opacity = active ? (activeLink ? 1 : 0.18) : 1

        return (
          <g key={i}>
            <line
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              markerEnd="url(#arrow)"
              opacity={opacity}
            />
            <text
              x={(s.x + t.x) / 2}
              y={(s.y + t.y) / 2 - 6}
              fontSize={10}
              fontFamily="Inter, Arial, sans-serif"
              fill="#475569"
              opacity={opacity}
              textAnchor="middle"
            >
              {l.value ? String(l.value) : ''}
            </text>
          </g>
        )
      })}

      {nodes.map((n) => {
        const isHover = hovered === n.id
        const connected = nodeIsConnectedToActive(n.id)
        const visibleOpacity = connected ? 1 : 0.28
        return (
          <g
            key={n.id}
            transform={`translate(${n.x},${n.y})`}
            style={{ cursor: 'pointer', opacity: visibleOpacity }}
            onMouseEnter={() => setHovered(n.id)}
            onMouseLeave={() => setHovered((prev) => (locked ? prev : null))}
            onClick={() => onNodeClick(n.id)}
          >
            <circle
              r={isHover || locked === n.id ? 26 : 22}
              fill={n.group === 1 ? '#60a5fa' : n.group === 2 ? '#34d399' : '#f59e0b'}
              filter="url(#shadow)"
              stroke={isHover || locked === n.id ? '#1e40af' : 'transparent'}
              strokeWidth={isHover || locked === n.id ? 2 : 0}
            />
            <text x={30} y={6} fontSize={12} fontFamily="Inter, Arial, sans-serif" fill="#0f172a">
              {n.label}
            </text>
          </g>
        )
      })}
      </svg>

      {tooltipNode && mousePos && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(mousePos.x + 12, width - 220),
            top: Math.max(mousePos.y + 12, 6),
            width: 220,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '8px 10px',
            boxShadow: '0 6px 18px rgba(2,6,23,0.08)',
            pointerEvents: 'none',
            fontSize: 12,
            zIndex: 40,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{tooltipNode.label}</div>
          <div style={{ color: '#475569', marginBottom: 6 }}>{tooltipNode.group ? (tooltipNode.group === 1 ? 'Application' : tooltipNode.group === 2 ? 'Infrastructure' : 'Indexing') : 'Unknown'}</div>
          <div style={{ color: '#0f172a', fontSize: 12, marginBottom: 6 }}>Connections: {neighbors.length}</div>
          {neighbors.length > 0 && (
            <div style={{ color: '#334155' }}>
              {neighbors.slice(0, 6).map((nid) => {
                const n = nodes.find((x) => x.id === nid)
                return (
                  <div key={nid} style={{ marginBottom: 4 }}>
                    • {n?.label || nid}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Graph
