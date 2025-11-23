import React, { useMemo, useRef, useState } from 'react'
import { nodes as rawNodes, links as defaultLinks } from './data/graphData'
import type { Node as DataNode, Link as DataLink } from './data/graphData'

type Props = { width?: number; height?: number; dataNodes?: DataNode[]; dataLinks?: DataLink[] }

const Graph: React.FC<Props> = ({ width = 700, height = 360, dataNodes, dataLinks }) => {
  const [hovered, setHovered] = useState<string | null>(null)
  const [locked, setLocked] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const cx = width / 2
  const cy = height / 2
  // increase base radius so nodes are more spread out
  const r = Math.min(width, height) / 2 - 40

  // compute circular layout positions
  const sourceNodes = dataNodes ?? rawNodes
  const sourceLinks = dataLinks ?? defaultLinks

  // compute node positions with similarity-based radial shrink
  const { nodes } = useMemo(() => {
    // avg weight per node
    const sums: Record<string, { sum: number; count: number }> = {}
    for (const n of sourceNodes) sums[n.id] = { sum: 0, count: 0 }
    for (const l of sourceLinks) {
      const v = Number((l as any).value ?? 1)
      if (sums[(l as any).source]) {
        sums[(l as any).source].sum += v
        sums[(l as any).source].count += 1
      }
      if (sums[(l as any).target]) {
        sums[(l as any).target].sum += v
        sums[(l as any).target].count += 1
      }
    }

    const avgMap: Record<string, number> = {}
    let mx = 0
    for (const id of Object.keys(sums)) {
      const s = sums[id]
      const avg = s.count ? s.sum / s.count : 0
      avgMap[id] = avg
      if (avg > mx) mx = avg
    }

    // shrink factor controls how much closer high-similarity nodes move inward (0..1)
    // use smaller shrink so nodes remain more spread
    const shrinkFactor = 0.25

    const computed = sourceNodes.map((n: DataNode, i: number) => {
      const angle = (i / sourceNodes.length) * Math.PI * 2
      const avg = avgMap[n.id] ?? 0
      // normalize by max (avoid divide-by-zero)
      const norm = mx > 0 ? avg / mx : 0
      const dist = r * (1 - norm * shrinkFactor)
      return {
        ...n,
        x: cx + dist * Math.cos(angle),
        y: cy + dist * Math.sin(angle),
      }
    })

    return { nodes: computed }
  }, [cx, cy, r, sourceNodes, sourceLinks])

  const measureCanvas = useRef<HTMLCanvasElement | null>(null)

  const find = (id: string) => nodes.find((n: any) => n.id === id)!

  const connections = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    for (const n of nodes) map[n.id] = new Set()
    for (const l of sourceLinks) {
      map[(l as any).source]?.add((l as any).target)
      map[(l as any).target]?.add((l as any).source)
    }
    return map
  }, [nodes])

  const active = locked ?? hovered

  const linkIsActive = (l: typeof defaultLinks[0]) => {
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

  const tooltipNode = hovered ? nodes.find((n: any) => n.id === hovered) ?? null : null
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

      {sourceLinks.map((l: any, i: number) => {
        const s = find((l as any).source)
        const t = find((l as any).target)
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
            {/* link numeric labels are rendered in a top pass so they sit above nodes */}
          </g>
        )
      })}

      {nodes.map((n: any) => {
        const isHover = hovered === n.id
        const connected = nodeIsConnectedToActive(n.id)
        const visibleOpacity = connected ? 1 : 0.28
        const rNode = isHover || locked === n.id ? 26 : 22
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
              r={rNode}
              fill={n.group === 1 ? '#60a5fa' : n.group === 2 ? '#34d399' : '#f59e0b'}
              filter="url(#shadow)"
              stroke={isHover || locked === n.id ? '#1e40af' : 'transparent'}
              strokeWidth={isHover || locked === n.id ? 2 : 0}
            />
          </g>
        )
      })}

      {/* labels pass (drawn last so labels sit on top) */}
      {nodes.map((n: any) => {
        const isHover = hovered === n.id
        const rNode = isHover || locked === n.id ? 26 : 22
        const labelX = n.x + rNode + 8
        const labelY = n.y
        const text = n.label || n.id
        const estW = Math.min(300, (text.length || 10) * 7)
        const fontSize = 12
        return (
          <g key={`label-${n.id}`} pointerEvents="none">
            <rect
              x={labelX - 6}
              y={labelY - fontSize / 2 - 4}
              width={estW + 12}
              height={fontSize + 8}
              rx={6}
              fill="white"
              stroke="#e2e8f0"
            />
            <text x={labelX} y={labelY} fontSize={fontSize} fontFamily="Inter, Arial, sans-serif" fill="#0f172a" dominantBaseline="middle">
              {text}
            </text>
          </g>
        )
      })}

      {/* link labels pass: draw above nodes so numbers are never occluded */}
      {sourceLinks.map((l: any, i: number) => {
        const s = find((l as any).source)
        const t = find((l as any).target)
        const mx = (s.x + t.x) / 2
        const my = (s.y + t.y) / 2
        const dx = t.x - s.x
        const dy = t.y - s.y
        const len = Math.hypot(dx, dy) || 1
        const nx = -dy / len
        const ny = dx / len
        const offset = 10 + (l.value || 0) * 3
        const lx = mx + nx * offset
        const ly = my + ny * offset
        const text = l.value ? String(l.value) : ''
        const fontSize = 11

        let w = Math.min(220, (text.length || 1) * 8)
        if (typeof document !== 'undefined') {
          try {
            const canvas = measureCanvas.current ?? (measureCanvas.current = document.createElement('canvas'))
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.font = `${fontSize}px Inter, Arial, sans-serif`
              const m = ctx.measureText(text)
              if (m && m.width) w = Math.min(220, m.width)
            }
          } catch (e) {
            // ignore and use estimate
          }
        }

        return (
          <g key={`linklabel-${i}`} pointerEvents="none">
            <rect
              x={lx - w / 2 - 6}
              y={ly - fontSize / 2 - 4}
              width={w + 12}
              height={fontSize + 8}
              rx={6}
              fill="white"
              stroke="#e2e8f0"
            />
            <text x={lx} y={ly} fontSize={fontSize} fontFamily="Inter, Arial, sans-serif" fill="#475569" textAnchor="middle" dominantBaseline="middle">
              {text}
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
                const n = nodes.find((x: any) => x.id === nid)
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
