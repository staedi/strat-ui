import React, { useState, useMemo } from 'react'
import type { TopicsData, ClusterNode, MetaCategoryNode } from './CirclePacking'
import { useTopicsData } from '../hooks/useTopicsData'
import { usePricesData } from '../hooks/usePricesData'
import type { PricePoint } from '../hooks/usePricesData'
import { useSentimentData } from '../hooks/useSentimentData'
import type { TickerSentiment, SentimentDay, SentimentCluster } from '../hooks/useSentimentData'
import { useCompanyData } from '../hooks/useCompanyData'
import type { CompanyMeta } from '../hooks/useCompanyData'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AggregatedTicker {
  ticker: string
  name: string
  count: number
  clusters: {
    cluster_id: number
    name: string
    meta: string
    summary?: string
    context?: string[]
  }[]
}

// ── Palette ───────────────────────────────────────────────────────────────────

const PALETTE = [
  '#4e9af1', '#f0a653', '#5ec98b', '#e06c75', '#c792ea',
  '#56b6c2', '#e5c07b', '#98c379', '#f07178', '#7986cb',
  '#4db6ac', '#ff8a65',
]
function clusterColor(id: number) { return PALETTE[id % PALETTE.length] }

// ── Aggregation ───────────────────────────────────────────────────────────────

function aggregateTickers(data: TopicsData): AggregatedTicker[] {
  const map = new Map<string, AggregatedTicker>()

  for (const meta of data.children) {
    for (const cluster of meta.children) {
      const tickers = [
        ...(cluster.related_tickers ?? []),
      ]
      for (const t of tickers) {
        if (!map.has(t.ticker)) {
          map.set(t.ticker, { ticker: t.ticker, name: t.name, count: 0, clusters: [] })
        }
        const entry = map.get(t.ticker)!
        entry.count += t.count ?? 0
        if (!entry.clusters.find(c => c.cluster_id === cluster.cluster_id)) {
          entry.clusters.push({
            cluster_id: cluster.cluster_id,
            name: cluster.name.replace(/^"|"$/g, ''),
            meta: meta.name,
            summary: cluster.ticker_summary?.[t.ticker],
            context: cluster.ticker_context?.[t.ticker],
          })
        }
      }
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count)
}

// ── Shared chart helpers ─────────────────────────────────────────────────────

function fmtDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZoneName: 'short' })
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
  textTransform: 'uppercase' as const, color: 'var(--ink-4)',
  margin: 0, fontFamily: 'var(--font-ui)',
}

const SECTION_STATS: React.CSSProperties = {
  fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-ui)',
  fontVariantNumeric: 'tabular-nums',
}

function fmtVol(v: number): string {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return String(v)
}

// ── Price chart ───────────────────────────────────────────────────────────────

function periodLabel(dateFirst: string, dateLast: string): string {
  if (!dateFirst || !dateLast) return ''
  const msPerDay = 86400000
  const days = Math.round((new Date(dateLast).getTime() - new Date(dateFirst).getTime()) / msPerDay)
  if (days <= 7) return '1w'
  if (days <= 14) return '2w'
  if (days <= 31) return '1m'
  return `${Math.round(days / 7)}w`
}

function PriceChart({ points }: { points: PricePoint[] }) {
  const closes = points.map(p => p.close).filter((c): c is number => c !== null)
  if (closes.length < 2) return null

  const first = closes[0]
  const last = closes[closes.length - 1]
  const chg = ((last - first) / first) * 100
  const up = chg >= 0
  const color = up ? '#5ec98b' : '#e06c75'

  const dateFirst = points[0]?.date ?? ''
  const dateLast = points[points.length - 1]?.date ?? ''
  const period = periodLabel(dateFirst, dateLast)

  const minPrice = Math.min(...closes)
  const maxPrice = Math.max(...closes)
  const avgPrice = closes.reduce((a, b) => a + b, 0) / closes.length

  const W = 600, H = 36
  const minRange = first * 0.02
  const priceMin = Math.min(minPrice, first - minRange)
  const priceMax = Math.max(maxPrice, first + minRange)
  const priceRange = priceMax - priceMin || 1

  const xs = closes.map((_, i) => (i / (closes.length - 1)) * W)
  const ys = closes.map(c => H - ((c - priceMin) / priceRange) * (H - 4) - 2)
  const baselineY = H - ((first - priceMin) / priceRange) * (H - 4) - 2
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')

  return (
    <div>
      {/* Section label + stats */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <p style={SECTION_LABEL}>Price</p>
        <span style={{
          fontSize: 14, fontWeight: 700, color: 'var(--ink)',
          fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-ui)'
        }}>
          ${last.toFixed(2)}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, color,
          fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-ui)'
        }}>
          {up ? '+' : ''}{chg.toFixed(2)}% ({period})
        </span>
        <span style={SECTION_STATS}>min ${minPrice.toFixed(2)}</span>
        <span style={SECTION_STATS}>max ${maxPrice.toFixed(2)}</span>
      </div>
      {/* Chart */}
      <div style={{ background: 'var(--ink-7)', borderRadius: 4, padding: '4px 0' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
          style={{ display: 'block', height: H }}>
          <line x1={0} y1={baselineY} x2={W} y2={baselineY}
            stroke="var(--ink-5)" strokeWidth={0.75} strokeDasharray="3 3" />
          <path d={path} fill="none" stroke={color} strokeWidth={1.75}
            strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r={2.5} fill={color} />
        </svg>
      </div>
    </div>
  )
}

// ── Volume chart ──────────────────────────────────────────────────────────────

function VolumeChart({ points }: { points: PricePoint[] }) {
  const volumes = points.map(p => p.volume).filter((v): v is number => v !== null)
  if (volumes.length < 2) return null

  const color = '#7986cb'  // neutral blue — volume has no inherent direction

  const latestVol = volumes[volumes.length - 1]
  const minVol = Math.min(...volumes)
  const maxVol = Math.max(...volumes)
  const avgVol = volumes.reduce((a, b) => a + b, 0) / volumes.length
  const volChg = ((latestVol - avgVol) / avgVol) * 100
  const volUp = volChg >= 0

  const dateFirst = points[0]?.date ?? ''
  const dateLast = points[points.length - 1]?.date ?? ''
  const period = periodLabel(dateFirst, dateLast)

  const W = 600, H = 36
  const barW = Math.max(2, W / volumes.length - 2)
  const avgY = H - (avgVol / maxVol) * (H - 4) - 2

  return (
    <div>
      {/* Section label + stats */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <p style={SECTION_LABEL}>Volume</p>
        <span style={{
          fontSize: 14, fontWeight: 700, color: 'var(--ink)',
          fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-ui)'
        }}>
          {fmtVol(latestVol)}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: volUp ? '#5ec98b' : '#e06c75',
          fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-ui)'
        }}>
          {volUp ? '+' : ''}{volChg.toFixed(1)}% vs avg ({period})
        </span>
        <span style={SECTION_STATS}>min {fmtVol(minVol)}</span>
        <span style={SECTION_STATS}>max {fmtVol(maxVol)}</span>
      </div>
      {/* Chart */}
      <div style={{ background: 'var(--ink-7)', borderRadius: 4, padding: '4px 0' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
          style={{ display: 'block', height: H }}>
          {/* Avg line */}
          <line x1={0} y1={avgY} x2={W} y2={avgY}
            stroke="var(--ink-4)" strokeWidth={0.75} strokeDasharray="3 3" />
          {/* Bars */}
          {volumes.map((v, i) => {
            const x = (i / (volumes.length - 1)) * W
            const bh = Math.max(2, (v / maxVol) * (H - 4))
            return (
              <rect key={i}
                x={x - barW / 2} y={H - bh}
                width={barW} height={bh}
                rx={1} fill={color} opacity={0.45}
              />
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  initialTicker?: string | null
  onClusterClick: (clusterId: number) => void
  mode?: 'recent' | 'full'
}

export default function TickersTab({ initialTicker, onClusterClick, mode = 'recent' }: Props) {
  const topicsMode = mode === 'full' ? 'full' : 'recent'
  const { data, loading, error } = useTopicsData(topicsMode)
  const { data: pricesData } = usePricesData(topicsMode)
  const { data: sentimentDataFull } = useSentimentData(topicsMode)
  const { data: companyData } = useCompanyData()
  const [selected, setSelected] = useState<string | null>(initialTicker ?? null)
  const [sort, setSort] = useState<'count' | 'alpha'>('count')
  const [search, setSearch] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const tickers = useMemo(() => {
    if (!data) return []
    const all = aggregateTickers(data)
    const filtered = search
      ? all.filter(t =>
        t.ticker.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase()))
      : all
    return sort === 'alpha'
      ? [...filtered].sort((a, b) => a.ticker.localeCompare(b.ticker))
      : filtered
  }, [data, sort, search])

  const selectedTicker = tickers.find(t => t.ticker === selected) ?? null

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'var(--font-ui)' }}>

      {/* Left: ticker list */}
      <div style={{
        width: isMobile ? 64 : 280, flexShrink: 0, borderRight: '1px solid var(--ink-5)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transition: 'width .2s',
      }}>
        {/* Search + sort — hidden on mobile */}
        {!isMobile && (
          <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--ink-6)', flexShrink: 0 }}>
            <input
              type="text"
              placeholder="Search tickers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '5px 10px', fontSize: 12,
                border: '1px solid var(--ink-5)', borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-ui)', color: 'var(--ink-2)',
                outline: 'none', background: 'var(--ink-7)',
              }}
            />
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              {(['count', 'alpha'] as const).map(s => (
                <button key={s} onClick={() => setSort(s)} style={{
                  padding: '3px 10px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--ink-5)',
                  background: sort === s ? 'var(--ink)' : 'transparent',
                  color: sort === s ? 'var(--white)' : 'var(--ink-3)',
                  fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                }}>
                  {s === 'count' ? 'By mentions' : 'A–Z'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loading && (
            <div style={{ padding: 20, color: 'var(--ink-4)', fontSize: 12 }}>Loading…</div>
          )}
          {error && (
            <div style={{ padding: 20, color: '#dc2626', fontSize: 12 }}>{error}</div>
          )}
          {tickers.map(t => {
            const isSelected = t.ticker === selected
            const hasSummary = t.clusters.some(c => c.summary)
            const hasPrice = !!pricesData?.prices[t.ticker]
            const hasCompany = !!companyData?.companies[t.ticker]
            return (
              <div
                key={t.ticker}
                onClick={() => setSelected(t.ticker === selected ? null : t.ticker)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 14px', cursor: 'pointer',
                  borderBottom: '1px solid var(--ink-7)',
                  background: isSelected ? 'var(--ink-6)' : 'transparent',
                  transition: 'background .1s',
                }}
              >
                {/* Badge */}
                <span style={{
                  flexShrink: 0, fontSize: 11, fontWeight: 700,
                  padding: '2px 6px', borderRadius: 4,
                  background: isSelected ? 'var(--ink)' : 'var(--ink-6)',
                  color: isSelected ? 'var(--white)' : 'var(--ink-3)',
                  fontFamily: 'var(--font-mono)', minWidth: 36, textAlign: 'center',
                }}>
                  {t.ticker}
                </span>

                {/* Name — hidden on mobile */}
                {!isMobile && (
                  <span style={{
                    flex: 1, fontSize: 12, color: isSelected ? 'var(--ink)' : 'var(--ink-2)',
                    fontWeight: isSelected ? 600 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {t.name}
                  </span>
                )}

                {/* Count + dots — hidden on mobile */}
                {!isMobile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    {hasSummary && (
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-2)', display: 'inline-block' }} />
                    )}
                    {hasPrice && (
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#5ec98b', display: 'inline-block' }} />
                    )}
                    {hasCompany && (
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f0a653', display: 'inline-block' }} />
                    )}
                    <span style={{ fontSize: 11, color: 'var(--ink-4)', fontVariantNumeric: 'tabular-nums' }}>
                      {t.count}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer count — hidden on mobile */}
        {data && !isMobile && (
          <div style={{ padding: '6px 14px', borderTop: '1px solid var(--ink-6)', fontSize: 11, color: 'var(--ink-4)', flexShrink: 0 }}>
            {tickers.length} tickers · {tickers.filter(t => t.clusters.some(c => c.summary)).length} with summaries
          </div>
        )}
      </div>

      {/* Right: ticker detail */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!selectedTicker ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--ink-4)' }}>
            <span style={{ fontSize: 24 }}>○</span>
            <span style={{ fontSize: 13 }}>Select a ticker to explore</span>
          </div>
        ) : (
          <TickerDetail
            ticker={selectedTicker}
            pricePoints={pricesData?.prices[selectedTicker.ticker] ?? []}
            sentimentData={sentimentDataFull?.tickers[selectedTicker.ticker] ?? null}
            sentimentWindowStart={sentimentDataFull?.window_start}
            sentimentUpdatedAt={sentimentDataFull?.updated_at}
            pricesUpdatedAt={pricesData?.updated_at}
            topicsUpdatedAt={data?.updated_at}
            companyMeta={companyData?.companies[selectedTicker.ticker] ?? null}
            onClusterClick={onClusterClick}
          />
        )}
      </div>
    </div>
  )
}

// ── Ticker detail ─────────────────────────────────────────────────────────────

function TickerDetail({
  ticker,
  pricePoints,
  sentimentData,
  sentimentWindowStart,
  sentimentUpdatedAt,
  pricesUpdatedAt,
  topicsUpdatedAt,
  companyMeta,
  onClusterClick,
}: {
  ticker: AggregatedTicker
  pricePoints: PricePoint[]
  sentimentData: TickerSentiment | null
  sentimentWindowStart?: string
  sentimentUpdatedAt?: string
  pricesUpdatedAt?: string
  topicsUpdatedAt?: string
  companyMeta: CompanyMeta | null
  onClusterClick: (clusterId: number) => void
}) {
  const [tab, setTab] = useState<'overview' | 'profile'>('overview')
  const clustersWithSummary = ticker.clusters.filter(c => c.summary)
  const clustersWithoutSummary = ticker.clusters.filter(c => !c.summary)
  const hasProfile = !!companyMeta
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--font-ui)' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid var(--ink-5)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: isMobile ? 6 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', fontFamily: 'var(--font-ui)' }}>
              {ticker.ticker}
            </h2>
            <span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 400 }}>
              {ticker.name}
            </span>
          </div>
          {/* Tab toggle */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(['overview', 'profile'] as const).map(t => (
              <button
                key={t}
                onClick={() => hasProfile || t === 'overview' ? setTab(t) : undefined}
                style={{
                  padding: '3px 10px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--ink-5)',
                  background: tab === t ? 'var(--ink)' : 'transparent',
                  color: tab === t ? 'var(--white)' : (!hasProfile && t === 'profile' ? 'var(--ink-5)' : 'var(--ink-3)'),
                  fontSize: 11, fontWeight: 500,
                  cursor: (!hasProfile && t === 'profile') ? 'default' : 'pointer',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                {t === 'overview' ? 'Overview' : 'Profile'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
          <Stat label="Mentions" value={ticker.count} />
          <Stat label="Clusters" value={ticker.clusters.length} />
          <Stat label="Summaries" value={clustersWithSummary.length} />
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '16px 24px' }}>

        {tab === 'overview' && (<>
          {/* Price + Volume — side by side on desktop, stacked on mobile */}
          {pricePoints.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={SECTION_LABEL}><span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-ui)' }}>Price · Volume</span></p>
                {pricesUpdatedAt && <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-ui)' }}>Updated {fmtDate(pricesUpdatedAt)}</span>}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                  <PriceChart points={pricePoints} />
                </div>
                <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                  <VolumeChart points={pricePoints} />
                </div>
              </div>
            </div>
          )}

          {/* Sentiment */}
          {sentimentData && <SentimentChart sentiment={sentimentData} windowStart={sentimentWindowStart} updatedAt={sentimentUpdatedAt} />}

          {/* Context clusters */}
          {clustersWithSummary.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={SECTION_LABEL}><span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-ui)' }}>Context</span></p>
                {topicsUpdatedAt && <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-ui)' }}>Updated {fmtDate(topicsUpdatedAt)}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {clustersWithSummary.map(c => (
                  <ClusterCard key={c.cluster_id} cluster={c} onClusterClick={onClusterClick} />
                ))}
              </div>
            </>
          )}

          {clustersWithoutSummary.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 10, fontFamily: 'var(--font-ui)' }}>Also appears in</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {clustersWithoutSummary.map(c => (
                  <span key={c.cluster_id} style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 20,
                    border: '1px solid var(--ink-5)', color: 'var(--ink-3)',
                    background: 'var(--ink-7)',
                  }}>
                    {c.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </>)}

        {tab === 'profile' && companyMeta && (
          <CompanySection meta={companyMeta} ticker={ticker} />
        )}
      </div>
    </div>
  )
}

// ── Sentiment chart ───────────────────────────────────────────────────────────

function SentimentChart({ sentiment, windowStart, updatedAt }: { sentiment: TickerSentiment; windowStart?: string; updatedAt?: string }) {
  const { daily, clusters, positive_pct, negative_pct, total } = sentiment

  if (!daily || daily.length === 0) return null

  const W = 600, H = 60
  const midY = H / 2

  // Build complete day range including N/A days
  const dailyMap = Object.fromEntries(daily.map(d => [d.date, d]))
  const start = windowStart ? new Date(windowStart) : new Date(daily[0].date)
  const end = daily.length > 0 ? new Date(daily[daily.length - 1].date) : new Date()
  const allDays: Array<{ date: string; data: typeof daily[0] | null; isNA: boolean }> = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    const data = dailyMap[key] ?? null
    allDays.push({ date: key, data, isNA: data === null })
  }

  const n = allDays.length || 1
  const barW = Math.max(4, Math.min(W / n - 2, 40))  // cap at 40px so sparse data doesn't stretch
  const PAD = barW / 2
  const xs = allDays.map((_, i) => n === 1 ? W - PAD : PAD + (i / Math.max(n - 1, 1)) * (W - PAD * 2))

  const maxVal = Math.max(...daily.map(d => Math.max(d.pos, d.neg)), 1)

  const dateFirst = daily[0]?.date?.slice(5) ?? ''
  const dateLast = daily[daily.length - 1]?.date?.slice(5) ?? ''
  const days = Math.round((new Date(daily[daily.length - 1].date).getTime() - new Date(daily[0].date).getTime()) / 86400000)
  const period = days <= 7 ? '1w' : days <= 14 ? '2w' : days <= 31 ? '1m' : `${Math.round(days / 7)}w`

  // Top clusters sorted by total desc
  const topClusters = [...(clusters ?? [])].filter(c => c.total >= 2).sort((a, b) => b.total - a.total).slice(0, 4)

  const dominant = positive_pct >= negative_pct
  const pct = dominant ? positive_pct : negative_pct
  const color = dominant ? '#5ec98b' : '#e06c75'
  const label = dominant ? 'Positive' : 'Negative'
  const sign = dominant ? '+' : '-'

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Section label row — matches Price · Volume style */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <p style={SECTION_LABEL}><span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-ui)' }}>Sentiment</span></p>
        {updatedAt && <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-ui)' }}>Updated {fmtDate(updatedAt)}</span>}
      </div>
      {/* Stats row — SENTIMENT label + pct + label + mentions, matches Price/Volume pattern */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <p style={SECTION_LABEL}>Sentiment</p>
        <span style={{ fontSize: 14, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-ui)' }}>
          {sign}{pct.toFixed(1)}%
        </span>
        <span style={{ ...SECTION_STATS, color: 'var(--ink-3)' }}>{label}</span>
        <span style={{ ...SECTION_STATS, marginLeft: 'auto', color: 'var(--ink-4)' }}>{total} mentions ({period})</span>
      </div>

      {/* Daily bar chart */}
      <div style={{ background: 'var(--ink-7)', borderRadius: 4, padding: '4px 0', marginBottom: 10 }}>
        <svg width='100%' viewBox={`0 0 ${W} ${H}`} preserveAspectRatio='none'
          style={{ display: 'block', height: H }}>
          {/* Baseline */}
          <line x1={0} y1={midY} x2={W} y2={midY}
            stroke='var(--ink-4)' strokeWidth={0.75} strokeDasharray='3 3' />
          {/* Bars — active, zero, or N/A */}
          {allDays.map((day, i) => {
            const x = xs[i] - barW / 2
            if (day.isNA) return null
            const d = day.data!
            if (d.pos === 0 && d.neg === 0) {
              return (
                <g key={i}>
                  <rect x={x} y={midY - 3} width={barW} height={6} rx={1} fill='var(--ink-5)' opacity={0.5} />
                  <circle cx={xs[i]} cy={midY} r={2.5} fill='var(--ink-4)' opacity={0.5} />
                </g>
              )
            }
            const posH = Math.max(1, (d.pos / maxVal) * (midY - 4))
            const negH = Math.max(1, (d.neg / maxVal) * (midY - 4))
            return (
              <g key={i}>
                {d.pos > 0 && <rect x={x} y={midY - posH} width={barW} height={posH} rx={1} fill='#5ec98b' opacity={0.8} />}
                {d.neg > 0 && <rect x={x} y={midY} width={barW} height={negH} rx={1} fill='#e06c75' opacity={0.8} />}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Cluster breakdown */}
      {topClusters.length > 0 && (
        <>
          <p style={{ ...SECTION_LABEL, marginBottom: 6 }}>By cluster</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {topClusters.map(c => {
              const dominant = c.positive_pct >= 50
              const color = dominant ? '#5ec98b' : '#e06c75'
              const pct = dominant ? c.positive_pct : c.negative_pct
              return (
                <div key={c.cluster_id} style={{
                  flex: '1 1 280px', minWidth: 0,
                  padding: '6px 10px', borderRadius: 4,
                  background: 'var(--ink-7)', border: '1px solid var(--ink-6)',
                }}>
                  <p style={{
                    margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
                    textTransform: 'uppercase', color: 'var(--ink-4)', fontFamily: 'var(--font-ui)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {c.label}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, color, fontFamily: 'var(--font-ui)',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      {dominant ? '+' : ''}{pct.toFixed(0)}%
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-ui)' }}>
                      {dominant ? 'positive' : 'negative'} · {c.total} mentions
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── Company section ───────────────────────────────────────────────────────────

function CompanySection({
  meta,
  ticker,
}: {
  meta: CompanyMeta
  ticker: AggregatedTicker
}) {
  const {
    summary, news_role,
    contextual_peers, contextual_peer_names,
    industry, industry_peers, industry_peer_names, industry_peer_theme,
  } = meta

  // Group news peers by cluster using display names for matching
  const clusterGroups: { name: string; meta: string; cluster_id: number; peers: string[] }[] = []
  const assignedPeers = new Set<string>()

  for (const cluster of ticker.clusters) {
    const ctx = cluster.context ?? []
    const inCluster = (contextual_peers ?? []).filter(
      p => !assignedPeers.has(p) &&
        ctx.some((s: string) => s.includes(contextual_peer_names?.[p] ?? p))
    )
    if (inCluster.length > 0) {
      clusterGroups.push({
        name: cluster.name,
        meta: cluster.meta ?? '',
        cluster_id: cluster.cluster_id,
        peers: inCluster,
      })
      inCluster.forEach(p => assignedPeers.add(p))
    }
  }
  const ungroupedPeers = (contextual_peers ?? []).filter(p => !assignedPeers.has(p))
  const hasPeers = clusterGroups.length > 0 || ungroupedPeers.length > 0

  const PeerBadge = ({ t, names }: { t: string; names?: Record<string, string> }) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 4,
      background: 'var(--ink-6)', border: '1px solid var(--ink-5)',
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>{t}</span>
      <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-ui)' }}>{names?.[t] ?? t}</span>
    </span>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Industry badge */}
      {industry && (
        <div>
          <p style={{ ...SECTION_LABEL, marginBottom: 6 }}>Industry</p>
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
            textTransform: 'uppercase', padding: '3px 8px', borderRadius: 20,
            border: '1px solid var(--ink-5)', color: 'var(--ink-3)',
            fontFamily: 'var(--font-ui)',
          }}>
            {industry}
          </span>
        </div>
      )}

      {/* About */}
      {summary && (
        <div>
          <p style={{ ...SECTION_LABEL, marginBottom: 8 }}>About</p>
          <p style={{
            fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6,
            fontFamily: 'var(--font-ui)', margin: 0,
            padding: '10px 14px', borderRadius: 4,
            background: 'var(--ink-7)', border: '1px solid var(--ink-6)',
          }}>
            {summary}
          </p>
        </div>
      )}

      {/* Current positioning */}
      {news_role && (
        <div>
          <p style={{ ...SECTION_LABEL, marginBottom: 8 }}>Current positioning</p>
          <p style={{
            fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6,
            fontFamily: 'var(--font-ui)', margin: 0,
            padding: '10px 14px', borderRadius: 4,
            background: 'var(--ink-7)', border: '1px solid var(--ink-6)',
          }}>
            {news_role}
          </p>
        </div>
      )}

      {/* News peers — cluster cards with accent color */}
      {hasPeers && (
        <div>
          <p style={{ ...SECTION_LABEL, marginBottom: 10 }}>News peers</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

            {clusterGroups.map(group => {
              const color = clusterColor(group.cluster_id)
              return (
                <div key={group.name} style={{
                  padding: '10px 14px', borderRadius: 'var(--radius)',
                  border: '1px solid var(--ink-6)', background: 'var(--ink-7)',
                }}>
                  {group.meta && (
                    <p style={{
                      fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
                      textTransform: 'uppercase', color: 'var(--ink-4)',
                      fontFamily: 'var(--font-ui)', marginBottom: 2,
                    }}>
                      {group.meta}
                    </p>
                  )}
                  <p style={{
                    fontSize: 12, fontWeight: 600, color,
                    fontFamily: 'var(--font-ui)', marginBottom: 8,
                  }}>
                    {group.name}
                  </p>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {group.peers.map(t => <PeerBadge key={t} t={t} names={contextual_peer_names} />)}
                  </div>
                </div>
              )
            })}

            {ungroupedPeers.length > 0 && (
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--radius)',
                border: '1px solid var(--ink-6)', background: 'var(--ink-7)',
              }}>
                <p style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
                  textTransform: 'uppercase', color: 'var(--ink-4)',
                  fontFamily: 'var(--font-ui)', marginBottom: 8,
                }}>
                  Other
                </p>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {ungroupedPeers.map(t => <PeerBadge key={t} t={t} names={contextual_peer_names} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Industry peers */}
      {industry_peers && industry_peers.length > 0 && (
        <div>
          <p style={{ ...SECTION_LABEL, marginBottom: 10 }}>Industry peers</p>
          <div style={{
            padding: '10px 14px', borderRadius: 'var(--radius)',
            border: '1px solid var(--ink-6)', background: 'var(--ink-7)',
          }}>
            {industry_peer_theme && (
              <p style={{
                fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase', color: 'var(--ink-4)',
                fontFamily: 'var(--font-ui)', marginBottom: 8,
              }}>
                {industry_peer_theme}
              </p>
            )}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {industry_peers.map(t => <PeerBadge key={t} t={t} names={industry_peer_names} />)}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function ClusterCard({ cluster, onClusterClick }: { cluster: AggregatedTicker['clusters'][0]; onClusterClick: (clusterId: number) => void }) {
  const color = clusterColor(cluster.cluster_id)
  return (
    <div
      onClick={() => onClusterClick(cluster.cluster_id)}
      style={{
        padding: '10px 14px', borderRadius: 'var(--radius)',
        border: '1px solid var(--ink-6)', background: 'var(--ink-7)',
        cursor: 'pointer', transition: 'border-color .15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--ink-4)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--ink-6)')}
    >
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 3, fontFamily: 'var(--font-ui)' }}>
        {cluster.meta}
      </p>
      <p style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 6, fontFamily: 'var(--font-ui)' }}>
        {cluster.name}
      </p>
      {cluster.summary && (
        <p style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5, fontFamily: 'var(--font-ui)' }}>
          {cluster.summary}
        </p>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ fontFamily: 'var(--font-ui)' }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-4)', fontFamily: 'var(--font-ui)' }}>
        {label}
      </p>
      <p style={{ margin: '1px 0 0', fontSize: 17, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-ui)' }}>
        {value}
      </p>
    </div>
  )
}