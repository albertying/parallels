import React, { useMemo, useState } from 'react'
import { nodes as rawNodes, links } from './data/graphData'

type Props = { width?: number; height?: number }

const Graph: React.FC<Props> = ({ width = 700, height = 360 }) => {
  const [hovered, setHovered] = useState<string | null>(null)

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

  // quick lookup of connections
  const connected = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    for (const n of nodes) map[n.id] = new Set()
    for (const l of links) {
      map[l.source]?.add(l.target)
      map[l.target]?.add(l.source)
    }
    return map
  }, [nodes])

  const isConnected = (link: typeof links[0]) => {
    if (!hovered) return false
    return link.source === hovered || link.target === hovered
  }

  return (
    <svg width={width} height={height} style={{ borderRadius: 6, background: '#fafafa' }}>
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

      {/* links (drawn first so nodes sit on top) */}
      {links.map((l, i) => {
        const s = find(l.source)
        const t = find(l.target)
        const highlighted = isConnected(l)
        const stroke = highlighted ? '#2563eb' : '#cbd5e1'
        const strokeWidth = highlighted ? Math.max(2, (l.value || 1) * 2) : Math.max(1, (l.value || 1) * 1.2)
        return (
          <line
            key={i}
            x1={s.x}
            y1={s.y}
            x2={t.x}
            y2={t.y}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            markerEnd="url(#arrow)"
            opacity={highlighted || !hovered ? 1 : 0.25}
          />
        )
      })}

      {/* nodes */}
      {nodes.map((n) => {
        const isHover = hovered === n.id
        return (
          <g
            key={n.id}
            transform={`translate(${n.x},${n.y})`}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovered(n.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <circle
              r={isHover ? 26 : 22}
              fill={n.group === 1 ? '#60a5fa' : n.group === 2 ? '#34d399' : '#f59e0b'}
              filter="url(#shadow)"
              stroke={isHover ? '#1e40af' : 'transparent'}
              strokeWidth={isHover ? 2 : 0}
            />
            <text x={30} y={6} fontSize={12} fontFamily="Inter, Arial, sans-serif" fill="#0f172a">
              {n.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default Graph
