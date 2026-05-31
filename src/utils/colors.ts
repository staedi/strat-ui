import type { MetaCategoryNode } from '../components/CirclePacking'

const PALETTE = [
  '#4e9af1','#f0a653','#5ec98b','#e06c75','#c792ea',
  '#56b6c2','#e5c07b','#98c379','#f07178','#7986cb',
  '#4db6ac','#ff8a65',
]

export function clusterColor(id: number): string {
  return PALETTE[id % PALETTE.length]
}

export function sentimentColor(score: number | undefined): string {
  if (score === undefined) return 'var(--ink-3)'
  if (score > 0.1) return '#16a34a'
  if (score < -0.1) return '#dc2626'
  return 'var(--ink-3)'
}

export function sentimentLabel(score: number | undefined): string {
  if (score === undefined) return '–'
  return `${score > 0 ? '+' : ''}${(score * 100).toFixed(0)}`
}

export function allTickers(metaCategories: MetaCategoryNode[]) {
  const map = new Map<string, { ticker: string; name: string; count: number; clusters: string[] }>()
  for (const meta of metaCategories) {
    for (const cluster of meta.children) {
      const tickers = [...(cluster.related_tickers_named ?? []), ...(cluster.related_tickers_semantic ?? [])]
      for (const t of tickers) {
        if (!map.has(t.ticker)) map.set(t.ticker, { ticker: t.ticker, name: t.name, count: 0, clusters: [] })
        const entry = map.get(t.ticker)!
        entry.count += t.count ?? 1
        if (!entry.clusters.includes(cluster.name)) entry.clusters.push(cluster.name)
      }
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}
