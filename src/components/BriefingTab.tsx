import React, { useMemo } from 'react'
import { useBriefingData } from '../hooks/useBriefingData'
import { useTopicsData } from '../hooks/useTopicsData'
import { aggregateTickers } from './TickersTab'
import SnapshotSection from './SnapshotSection'
import MacroTable from './MacroTable'
import MoversSection from './MoversSection'
import ScheduleStrip from './ScheduleStrip'

export interface ScheduleEntry {
    date: string
    type: string
    label: string
    ticker?: string
}

export interface TrendPoint {
    date: string
    value: string
    raw: number
}

export interface MacroOutcome {
    name: string
    type: string
    latest_value: string
    latest_date: string
    trend?: TrendPoint[]
    direction?: string | null
    source?: string
}

export interface SnapshotItem {
    ticker: string
    label: string
    close: number
    change_pct: number | null
    as_of: string
}

export interface Snapshot {
    indices: SnapshotItem[]
    bonds: SnapshotItem[]
    fx: SnapshotItem[]
    crypto: SnapshotItem[]
    commodities: SnapshotItem[]
}

export interface NlpTicker {
    ticker: string
    name: string
    mentions: number
    score: number
    positive_pct: number
    negative_pct: number
    top_cluster: string | null
}

export interface NlpCluster {
    cluster_id: number
    label: string
    meta_category: string
    article_count: number
}

export interface NlpMovers {
    top_tickers: NlpTicker[]
    top_clusters: NlpCluster[]
}

export interface PriceMover {
    ticker: string
    name: string
    close: number
    change_pct: number
}

export interface Debut {
    ticker: string
    name: string
    debut_date: string
}

export interface Briefing {
    generated_at: string
    snapshot_date: string
    disclaimer: string
    schedule: ScheduleEntry[]
    macro_outcomes: MacroOutcome[]
    snapshot: Snapshot
    movers: {
        by_news: NlpMovers
        by_price: PriceMover[]
        debuts: Debut[]
    }
}

function fmtDate(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', timeZoneName: 'short',
    })
}

interface Props {
    onTickerClick: (ticker: string) => void
    onClusterClick: (clusterId: number) => void
    mode: 'recent' | 'full'
}

export default function BriefingTab({ onTickerClick, onClusterClick, mode }: Props) {
    const { data, loading, error } = useBriefingData()
    // Ground truth for "does this ticker have a Tickers-tab page": the same
    // aggregation TickersTab itself uses (related_tickers across topics_{mode}.json
    // clusters) — not briefing.json's own by_news/by_price lists, which are
    // independently-generated and can disagree with it.
    const { data: topicsData } = useTopicsData(mode)
    const availableTickers = useMemo(
        () => new Set(topicsData ? aggregateTickers(topicsData).map(t => t.ticker) : []),
        [topicsData]
    )

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100%', color: 'var(--ink-4)', fontSize: 13,
                fontFamily: 'var(--font-ui)',
            }}>
                loading…
            </div>
        )
    }

    if (error || !data) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100%', color: '#dc2626', fontSize: 13,
                fontFamily: 'var(--font-ui)',
            }}>
                {error ?? 'Failed to load briefing data'}
            </div>
        )
    }

    return (
        <div style={{
            flex: 1, overflowY: 'auto',
            padding: '16px 24px 40px',
            fontFamily: 'var(--font-ui)',
        }}>

            {/* Header — date only, no updated at */}
            <div style={{ marginBottom: 16 }}>
                <h2 style={{
                    fontSize: 22, fontWeight: 700, color: 'var(--ink)',
                    letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-ui)',
                }}>
                    Market Briefing
                </h2>
                <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2, fontFamily: 'var(--font-ui)' }}>
                    {/* {new Date(data.snapshot_date).toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                    })} */}
                    {fmtDate(data.snapshot_date)}
                </p>
            </div>

            {/* Schedule strip — recently-debuted tickers render as chips
                alongside the upcoming pills, rather than a separate card */}
            <ScheduleStrip
                entries={data.schedule}
                recentDebuts={data.movers.debuts}
                availableTickers={availableTickers}
                onTickerClick={onTickerClick}
            />

            {/* Snapshot card */}
            <div style={{
                background: 'var(--ink-7)', borderRadius: 6,
                padding: '12px 16px', marginTop: 16, marginBottom: 12,
            }}>
                <SnapshotSection snapshot={data.snapshot} />
            </div>

            {/* Macro card */}
            <div style={{
                background: 'var(--ink-7)', borderRadius: 6,
                padding: '12px 16px', marginBottom: 12,
            }}>
                <MacroTable outcomes={data.macro_outcomes} schedule={data.schedule} />
            </div>

            {/* Movers card */}
            <div style={{
                background: 'var(--ink-7)', borderRadius: 6,
                padding: '12px 16px', marginBottom: 12,
            }}>
                <MoversSection
                    byNews={data.movers.by_news}
                    byPrice={data.movers.by_price}
                    availableTickers={availableTickers}
                    onTickerClick={onTickerClick}
                    onClusterClick={onClusterClick}
                />
            </div>

            {/* Footer — updated at + disclaimer */}
            <div style={{ marginTop: 8 }}>
                <p style={{
                    fontSize: 11, color: 'var(--ink-4)',
                    fontFamily: 'var(--font-ui)', margin: '0 0 2px',
                }}>
                    Updated {fmtDate(data.generated_at)}
                </p>
                <p style={{
                    fontSize: 11, color: 'var(--ink-4)',
                    fontStyle: 'italic', fontFamily: 'var(--font-ui)', margin: 0,
                }}>
                    {data.disclaimer}
                </p>
            </div>

        </div>
    )
}