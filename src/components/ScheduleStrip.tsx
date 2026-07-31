import type { ScheduleEntry, Debut } from './BriefingTab'

const TYPE_LABELS: Record<string, string> = {
    fed: 'FED', cpi: 'CPI', nfp: 'NFP', jolts: 'JOLTS',
    pce: 'PCE', gdp: 'GDP', unrate: 'UNEMP', ecb: 'ECB', boe: 'BOE', boj: 'BOJ',
    debut: 'DEBUT',
}

const TYPE_COLORS: Record<string, string> = {
    fed: '#2563eb', ecb: '#7c3aed', boe: '#0891b2', boj: '#be185d',
    cpi: '#d97706', nfp: '#d97706', jolts: '#d97706',
    pce: '#d97706', gdp: '#16a34a', debut: '#c026d3',
}

function daysUntil(iso: string): number {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const target = new Date(iso); target.setHours(0, 0, 0, 0)
    return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function formatDate(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Props {
    entries: ScheduleEntry[]
    recentDebuts?: Debut[]
    availableTickers?: Set<string>
    onTickerClick?: (ticker: string) => void
}

export default function ScheduleStrip({ entries, recentDebuts = [], availableTickers, onTickerClick }: Props) {
    const upcoming = entries
        .filter(e => daysUntil(e.date) >= 0)
        .slice(0, 8)

    if (!upcoming.length && !recentDebuts.length) return null

    return (
        <div style={{ marginBottom: 4 }}>
            <p style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'var(--ink-4)',
                margin: '0 0 8px', fontFamily: 'var(--font-ui)',
            }}>
                Schedule
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {upcoming.map((e, i) => {
                    const days = daysUntil(e.date)
                    // const color = TYPE_COLORS[e.type] ?? 'var(--ink-4)'
                    const isToday = days === 0
                    // const isSoon = days <= 3

                    return (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '4px 9px', borderRadius: 20,
                            background: isToday ? 'var(--ink)' : 'var(--ink-7)',
                            // border: `1px solid ${isToday ? 'var(--ink)' : 'var(--ink-5)'}`,
                        }}>
                            <span style={{
                                fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                                color: isToday ? 'white' : 'var(--ink-2)',
                                fontFamily: e.ticker ? 'var(--font-ui)' : 'var(--font-ui)',
                            }}>
                                {e.ticker ?? TYPE_LABELS[e.type] ?? e.type.toUpperCase()}
                            </span>
                            <span style={{
                                fontSize: 11, fontFamily: 'var(--font-ui)',
                                color: isToday ? 'rgba(255,255,255,0.75)' : 'var(--ink-4)',
                            }}>
                                {isToday ? 'Today' : days === 1 ? 'Tomorrow' : formatDate(e.date)}
                            </span>
                        </div>
                    )
                })}

                {recentDebuts.map(d => {
                    const isAvailable = availableTickers?.has(d.ticker) ?? false
                    return (
                        <div
                            key={d.ticker}
                            onClick={isAvailable ? () => onTickerClick?.(d.ticker) : undefined}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '4px 9px', borderRadius: 20,
                                background: 'transparent',
                                border: '1px solid var(--ink-5)',
                                cursor: isAvailable ? 'pointer' : 'default',
                            }}
                        >
                            <span style={{
                                fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                                color: 'var(--ink-2)', fontFamily: 'var(--font-ui)',
                            }}>
                                {d.ticker}
                            </span>
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-ui)', color: 'var(--ink-4)' }}>
                                Debuted {formatDate(d.debut_date)}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}