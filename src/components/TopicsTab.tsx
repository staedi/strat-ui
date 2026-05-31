import { useState, useCallback, useEffect, useRef } from 'react'
import CirclePacking from './CirclePacking'
import type { ClusterNode, MetaCategoryNode } from './CirclePacking'
import ClusterDetail from './ClusterDetail'
import { useTopicsData } from '../hooks/useTopicsData'

// ── Types ─────────────────────────────────────────────────────────────────────

type AppMode = 'recent' | 'full'      // owned by App.tsx, shared across tabs
interface Props {
  onTickerClick: (ticker: string) => void
  initialCluster?: number | null
  mode: AppMode
  onModeChange: (mode: AppMode) => void
}

export default function TopicsTab({ onTickerClick, initialCluster, mode, onModeChange }: Props) {
  const { data, loading, error } = useTopicsData(mode)
  const [activeCluster, setActiveCluster] = useState<number | null>(initialCluster ?? null)
  const [activeMeta, setActiveMeta] = useState<string | null>(null)
  const [selectedCluster, setSelectedCluster] = useState<ClusterNode | null>(null)
  const [selectedMeta, setSelectedMeta] = useState<MetaCategoryNode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setSize({ width, height })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Auto-select initialCluster once data is available
  useEffect(() => {
    if (!data || !initialCluster) return
    for (const meta of data.children) {
      const cluster = meta.children.find(c => c.cluster_id === initialCluster)
      if (cluster) { setSelectedCluster(cluster); setSelectedMeta(meta); break }
    }
  }, [data, initialCluster])

  // Reset selection on any mode change
  useEffect(() => {
    setSelectedCluster(null)
    setSelectedMeta(null)
    setActiveCluster(null)
    setActiveMeta(null)
  }, [mode])

  const handleClusterClick = useCallback((id: number) => {
    if (!data) return
    setActiveCluster(prev => {
      if (prev === id) {
        setSelectedCluster(null)
        setSelectedMeta(null)
        return null
      }
      for (const meta of data.children) {
        const cluster = meta.children.find(c => c.cluster_id === id)
        if (cluster) { setSelectedCluster(cluster); setSelectedMeta(meta); break }
      }
      return id
    })
  }, [data])

  const handleMetaClick = useCallback((name: string) => {
    setActiveMeta(prev => prev === name ? null : name)
  }, [])

  const stats = data ? {
    topics: data.children.length,
    clusters: data.children.reduce((s, m) => s + m.children.length, 0),
    articles: data.children.reduce((s, m) => m.children.reduce((ss, c) => ss + c.count, s), 0),
  } : null

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Sub-header: stats + local toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 20px', borderBottom: '1px solid var(--ink-5)',
        flexShrink: 0, background: 'var(--white)',
      }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 20 }}>
          {stats ? (
            <>
              <StatItem value={stats.topics} label="Topics" />
              <StatItem value={stats.clusters} label="Clusters" />
              <StatItem value={stats.articles} label="Articles" />
            </>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>—</span>
          )}
        </div>

      </div>

      {/* Viz area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', fontFamily: 'var(--font-ui)', fontSize: 13 }}>
              loading…
            </div>
          )}
          {error && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', fontSize: 13 }}>
              {error}
            </div>
          )}
          {data && size && (
            <>
              <CirclePacking
                key={`${data.updated_at}-${size.width}-${size.height}`}
                data={data}
                width={size.width}
                height={size.height}
                activeCluster={activeCluster}
                onClusterClick={handleClusterClick}
                activeMeta={activeMeta}
                onMetaClick={handleMetaClick}
              />
              <div style={{ position: 'absolute', bottom: 12, left: 16, fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-ui)' }}>
                updated {new Date(data.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </>
          )}
        </div>

        {/* Detail panel */}
        {selectedCluster && selectedMeta && (
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 320,
            background: 'var(--white)', borderLeft: '1px solid var(--ink-5)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            zIndex: 10, boxShadow: '-4px 0 16px rgba(0,0,0,0.04)',
          }}>
            <ClusterDetail
              cluster={selectedCluster}
              meta={selectedMeta}
              onClose={() => { setSelectedCluster(null); setSelectedMeta(null); setActiveCluster(null) }}
              onTickerClick={onTickerClick}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{label}</span>
    </div>
  )
}