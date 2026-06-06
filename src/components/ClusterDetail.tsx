import { useState, useMemo } from 'react'
import type { ClusterNode, MetaCategoryNode, TickerInfo } from './CirclePacking'

const PALETTE = [
  '#4e9af1', '#f0a653', '#5ec98b', '#e06c75', '#c792ea',
  '#56b6c2', '#e5c07b', '#98c379', '#f07178', '#7986cb',
  '#4db6ac', '#ff8a65',
]
function clusterColor(id: number) { return PALETTE[id % PALETTE.length] }

interface Props {
  cluster: ClusterNode
  meta: MetaCategoryNode
  onClose: () => void
  onTickerClick: (ticker: string) => void
}

export default function ClusterDetail({ cluster, meta, onClose, onTickerClick }: Props) {
  const [showAll, setShowAll] = useState(false)
  const color = clusterColor(cluster.cluster_id)

  const tickers = useMemo(() => {
    const map = new Map<string, TickerInfo>()
    for (const t of [...(cluster.related_tickers ?? [])]) {
      if (!map.has(t.ticker)) map.set(t.ticker, t)
    }
    return [...map.values()]
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
      .sort((a, b) => {
        const aHas = cluster.ticker_summary?.[a.ticker] ? 1 : 0
        const bHas = cluster.ticker_summary?.[b.ticker] ? 1 : 0
        return bHas - aHas
      })
  }, [cluster])

  const visible = showAll ? tickers : tickers.slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--font-ui)' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--ink-6)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: 'var(--ink-4)',
            }}>
              {meta.name}
            </p>
            <h3 style={{
              margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: 'var(--ink)',
              lineHeight: 1.25, letterSpacing: '-0.01em',
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {cluster.name.replace(/^"|"$/g, '')}
            </h3>
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'var(--ink-4)', fontSize: 18, lineHeight: 1,
            padding: '0 4px', marginTop: -2, flexShrink: 0,
          }}>×</button>
        </div>

        {/* Stats */}
        <div style={{ marginTop: 10, display: 'flex', gap: 20 }}>
          <Stat label="Articles" value={cluster.count} />
          <Stat label="Tickers" value={tickers.length} />
        </div>
      </div>

      {/* Ticker list */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '10px 16px 12px' }}>
        {tickers.length === 0 && (
          <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-4)' }}>No tickers found</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {visible.map(t => {
            const summary = cluster.ticker_summary?.[t.ticker]
            return (
              <div key={t.ticker} style={{
                padding: summary ? '8px 0' : '5px 0',
                borderBottom: '1px solid var(--ink-7)',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <button
                    onClick={() => onTickerClick(t.ticker)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', padding: 0, cursor: 'pointer', minWidth: 0 }}
                  >
                    <span style={{
                      flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: 11,
                      fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: color, color: '#fff',
                    }}>
                      {t.ticker}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.name}
                    </span>
                  </button>
                </div>
                {summary && (
                  <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 400, color: 'var(--ink-4)', lineHeight: 1.4 }}>
                    {summary}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {tickers.length > 5 && (
          <button
            onClick={() => setShowAll(v => !v)}
            style={{ marginTop: 8, fontSize: 12, color: 'var(--accent-2)', background: 'none', border: 'none', padding: 0, fontWeight: 500, cursor: 'pointer' }}
          >
            {showAll ? 'Show less' : `+${tickers.length - 5} more`}
          </button>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ fontFamily: 'var(--font-ui)' }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-4)', fontFamily: 'var(--font-ui)' }}>
        {label}
      </p>
      <p style={{ margin: '1px 0 0', fontSize: 17, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-ui)', WebkitFontSmoothing: 'antialiased' }}>
        {value}
      </p>
    </div>
  )
}