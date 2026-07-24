import type { NlpMovers, PriceMover, Debut } from './BriefingTab'

const UP_COLOR = '#5ec98b'
const DOWN_COLOR = '#e06c75'

function changePctColor(pct: number): string {
    if (pct > 0) return UP_COLOR
    if (pct < 0) return DOWN_COLOR
    return 'var(--ink-4)'
}

function formatPct(pct: number): string {
    const sign = pct > 0 ? '+' : ''
    return `${sign}${pct.toFixed(2)}%`
}

function formatDate(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function TickerBadge({ ticker }: { ticker: string }) {
    return (
        <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 6px',
            borderRadius: 4, background: 'var(--ink)', color: 'var(--white)',
            flexShrink: 0, fontFamily: 'var(--font-mono)',
        }}>
            {ticker}
        </span>
    )
}

function ColumnHeader({ label }: { label: string }) {
    return (
        <p style={{
            fontSize: 10, fontWeight: 600, color: 'var(--ink-4)',
            letterSpacing: '0.05em', textTransform: 'uppercase',
            margin: '0 0 2px', paddingBottom: 6,
            borderBottom: '1px solid var(--ink-5)',
            fontFamily: 'var(--font-ui)',
        }}>
            {label}
        </p>
    )
}

interface Props {
    byNews: NlpMovers
    byPrice: PriceMover[]
    debuts: Debut[]
    onTickerClick: (ticker: string) => void
    onClusterClick: (clusterId: number) => void
}

export default function MoversSection({ byNews, byPrice, debuts, onTickerClick, onClusterClick }: Props) {
    return (
        <div>
            <p style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'var(--ink-4)',
                margin: '0 0 10px', fontFamily: 'var(--font-ui)',
            }}>
                Market Movers
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

                {/* By Coverage */}
                <div>
                    <ColumnHeader label="By Coverage" />
                    {byNews.top_tickers.map(t => (
                        <div
                            key={t.ticker}
                            onClick={() => onTickerClick(t.ticker)}
                            style={{
                                display: 'flex', alignItems: 'center',
                                padding: '9px 0', borderBottom: '1px solid var(--ink-6)',
                                gap: 12, cursor: 'pointer',
                            }}
                        >
                            <TickerBadge ticker={t.ticker} />
                            <span style={{
                                fontSize: 11, color: 'var(--ink-3)', flex: 1,
                                // fontWeight: 500,
                                fontFamily: 'var(--font-ui)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                                {t.name}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--ink-4)', flexShrink: 0, fontFamily: 'var(--font-ui)' }}>
                                {t.mentions}×
                            </span>
                            <span style={{
                                fontSize: 11, fontWeight: 600, flexShrink: 0,
                                color: t.score >= 0 ? UP_COLOR : DOWN_COLOR,
                                fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-ui)',
                            }}>
                                {t.score >= 0 ? '+' : ''}{(t.score * 100).toFixed(0)}%
                            </span>
                        </div>
                    ))}
                </div>

                {/* By Price */}
                <div>
                    <ColumnHeader label="By Price" />
                    {byPrice.map(m => (
                        <div
                            key={m.ticker}
                            onClick={() => onTickerClick(m.ticker)}
                            style={{
                                display: 'flex', alignItems: 'center',
                                padding: '9px 0', borderBottom: '1px solid var(--ink-6)',
                                gap: 12, cursor: 'pointer',
                            }}
                        >
                            <TickerBadge ticker={m.ticker} />
                            <span style={{
                                fontSize: 11, color: 'var(--ink-3)', flex: 1,
                                // fontWeight: 500,
                                fontFamily: 'var(--font-ui)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                                {m.name}
                            </span>
                            <span style={{
                                fontSize: 12, fontWeight: 600, flexShrink: 0,
                                color: changePctColor(m.change_pct),
                                fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-ui)',
                            }}>
                                {formatPct(m.change_pct)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Trending Topics */}
                <div>
                    <ColumnHeader label="Trending Topics" />
                    {byNews.top_clusters.map(c => (
                        <div
                            key={c.cluster_id}
                            onClick={() => onClusterClick(c.cluster_id)}
                            style={{
                                padding: '9px 0', borderBottom: '1px solid var(--ink-6)',
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{
                                fontSize: 12, color: 'var(--ink)', fontWeight: 500,
                                marginBottom: 3, lineHeight: 1.3, fontFamily: 'var(--font-ui)',
                            }}>
                                {c.label}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-ui)' }}>
                                    {c.meta_category}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-ui)' }}>
                                    {c.article_count} articles
                                </span>
                            </div>
                        </div>
                    ))}

                    {debuts.length > 0 && (
                        <>
                            <p style={{
                                fontSize: 10, fontWeight: 600, color: 'var(--ink-4)',
                                letterSpacing: '0.05em', textTransform: 'uppercase',
                                margin: '14px 0 2px', paddingBottom: 6,
                                borderBottom: '1px solid var(--ink-5)',
                                fontFamily: 'var(--font-ui)',
                            }}>
                                Recent Debuts
                            </p>
                            {debuts.map(d => (
                                <div
                                    key={d.ticker}
                                    onClick={() => onTickerClick(d.ticker)}
                                    style={{
                                        display: 'flex', alignItems: 'center',
                                        padding: '9px 0', borderBottom: '1px solid var(--ink-6)',
                                        gap: 12, cursor: 'pointer',
                                    }}
                                >
                                    <TickerBadge ticker={d.ticker} />
                                    <span style={{
                                        fontSize: 12, color: 'var(--ink-2)', flex: 1,
                                        fontFamily: 'var(--font-ui)',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {d.name}
                                    </span>
                                    <span style={{ fontSize: 11, color: 'var(--ink-4)', flexShrink: 0, fontFamily: 'var(--font-ui)' }}>
                                        {formatDate(d.debut_date)}
                                    </span>
                                </div>
                            ))}
                        </>
                    )}
                </div>

            </div>
        </div>
    )
}