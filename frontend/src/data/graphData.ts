export type Node = {
  id: string
  label: string
  group?: number
}

export type Link = {
  source: string
  target: string
  value?: number
}

export const nodes: Node[] = [
  { id: '1', label: 'Frontend', group: 1 },
  { id: '2', label: 'Backend', group: 1 },
  { id: '3', label: 'Auth', group: 2 },
  { id: '4', label: 'DB', group: 2 },
  { id: '5', label: 'Indexer', group: 3 },
  { id: '6', label: 'Vector DB', group: 3 },
  { id: '7', label: 'Search API', group: 3 },
  { id: '8', label: 'Worker', group: 2 },
]

export const links: Link[] = [
  { source: '1', target: '2', value: 1 },
  { source: '2', target: '3', value: 1 },
  { source: '2', target: '4', value: 1 },
  { source: '2', target: '5', value: 1 },
  { source: '5', target: '6', value: 1 },
  { source: '7', target: '6', value: 1 },
  { source: '2', target: '7', value: 1 },
  { source: '8', target: '4', value: 1 },
  { source: '8', target: '5', value: 1 },
]
