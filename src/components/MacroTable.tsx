import { useState, useEffect } from 'react'
import type { MacroOutcome, ScheduleEntry } from './BriefingTab'

const TYPE_LABELS: Record<string, string> = {
    fed: 'FED', cpi: 'CPI', nfp: 'NFP', jolts: 'JOLTS',
    pce: 'PCE', gdp: 'GDP', unrate: 'UNEMP', ecb: 'ECB', boe: 'BOE', boj: 'BOJ',
}

const TYPE_COLORS: Record<string, string> = {
    fed: '#2563eb', ecb: '#7c3aed', boe: '#0891b2', boj: '#be185d',
    cpi: '#d97706', nfp: '#d97706', unrate: '#d97706', jolts: '#d97706',
    pce: '#d97706', gdp: '#16a34a',
}

const CB_TYPES = new Set(['fed', 'ecb', 'boe', 'boj'])
const UP_COLOR = '#5ec98b'
const DOWN_COLOR = '#e06c75'
const TODAY_ISO = new Date().toISOString().slice(0, 10)

function formatDate(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function nextScheduled(type: string, schedule: ScheduleEntry[]): string | null {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const match = schedule
        .filter(e => e.type === type && new Date(e.date) >= today)
        .sort((a, b) => a.date.localeCompare(b.date))[0]
    return match ? formatDate(match.date) : null
}

type Direction = 'hike' | 'cut' | 'hold' | null

function deriveDirection(o: MacroOutcome): Direction {
    if (!CB_TYPES.has(o.type)) return null
    if (o.direction === 'hike' || o.direction === 'cut') return o.direction
    if (o.trend && o.trend.length >= 2) {
        const diff = o.trend[o.trend.length - 1].raw - o.trend[o.trend.length - 2].raw
        if (diff > 0.01) return 'hike'
        if (diff < -0.01) return 'cut'
        return 'hold'
    }
    if (o.direction === 'hold') return 'hold'
    return null
}

function MacroRow({ o, schedule, isMobile }: { o: MacroOutcome; schedule: ScheduleEntry[]; isMobile: boolean }) {
    const isCB = CB_TYPES.has(o.type)
    const direction = deriveDirection(o)

    const trendUp = !isCB && o.trend && o.trend.length >= 2
        && (o.trend[o.trend.length - 1].raw - o.trend[o.trend.length - 2].raw) > 0.01
    const trendDown = !isCB && o.trend && o.trend.length >= 2
        && (o.trend[o.trend.length - 1].raw - o.trend[o.trend.length - 2].raw) < -0.01

    const showUp = isCB ? direction === 'hike' : trendUp
    const showDown = isCB ? direction === 'cut' : trendDown
    const showHold = isCB && direction === 'hold'

    const scheduled = nextScheduled(o.type, schedule)

    const isRange = o.latest_value.includes('–')
    const rangeParts = isRange ? o.latest_value.split('–').map(s => s.trim()) : null
    const match = !isRange ? o.latest_value.match(/^([\d,.$]+(?:\.\d+)?%?)(.*)?$/) : null
    const valueNum = isRange ? '' : (match?.[1] ?? o.latest_value)
    const valueUnit = isRange ? '' : (match?.[2]?.trim() ?? '')

    const RangeValue = () => rangeParts ? (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{rangeParts[0]}</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-4)', margin: '0 3px' }}>–</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{rangeParts[1]}</span>
        </span>
    ) : null

    const isToday = o.latest_date?.slice(0, 10) === TODAY_ISO
    const pillBg = isToday ? (TYPE_COLORS[o.type] ?? 'var(--ink)') : 'var(--ink-6)'
    const pillColor = isToday ? 'white' : 'var(--ink-3)'

    if (isMobile) {
        // Mobile: two-line layout
        return (
            <div style={{
                padding: '8px 0', borderBottom: '1px solid var(--ink-6)',
                fontFamily: 'var(--font-ui)',
            }}>
                {/* Line 1: pill + name + direction + value */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px',
                        borderRadius: 3, background: pillBg,
                        color: pillColor, minWidth: 40, textAlign: 'center',
                        flexShrink: 0, fontFamily: 'var(--font-mono)',
                    }}>
                        {TYPE_LABELS[o.type] ?? o.type.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--ink-4)', flex: 1, minWidth: 0 }}>
                        {o.name}
                    </span>
                    <span style={{ width: 36, flexShrink: 0, textAlign: 'center' }}>
                        {showUp && <span style={{ fontSize: 12, fontWeight: 600, color: UP_COLOR }}>↑</span>}
                        {showDown && <span style={{ fontSize: 12, fontWeight: 600, color: DOWN_COLOR }}>↓</span>}
                        {showHold && (
                            <span style={{
                                fontSize: 9, fontWeight: 600, padding: '2px 5px',
                                borderRadius: 3, background: 'var(--ink-6)',
                                color: 'var(--ink-4)', letterSpacing: '0.04em',
                            }}>HOLD</span>
                        )}
                    </span>
                    <span style={{ flexShrink: 0 }}>
                        {isRange ? <RangeValue /> : (
                            <>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                                    {valueNum}
                                </span>
                                {valueUnit && (
                                    <span style={{ fontSize: 10, color: 'var(--ink-3)', marginLeft: 2 }}>{valueUnit}</span>
                                )}
                            </>
                        )}
                    </span>
                </div>
                {/* Line 2: Latest + Upcoming dates */}
                <div style={{ display: 'flex', gap: 16, paddingLeft: 52 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>As of</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-2)' }}>
                            {formatDate(o.latest_date)}
                        </span>
                    </span>
                    {scheduled && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>Scheduled</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink)' }}>
                                {scheduled}
                            </span>
                        </span>
                    )}
                </div>
            </div>
        )
    }

    // Desktop: single row
    return (
        <div style={{
            display: 'flex', alignItems: 'center',
            padding: '9px 0', borderBottom: '1px solid var(--ink-6)',
            gap: 12, fontFamily: 'var(--font-ui)',
        }}>
            <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px',
                borderRadius: 3, background: pillBg,
                color: pillColor, minWidth: 44, textAlign: 'center',
                flexShrink: 0, fontFamily: 'var(--font-mono)',
            }}>
                {TYPE_LABELS[o.type] ?? o.type.toUpperCase()}
            </span>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-4)', flex: 1, minWidth: 0 }}>
                {o.name}
            </span>
            <span style={{ width: 40, flexShrink: 0, textAlign: 'center' }}>
                {showUp && <span style={{ fontSize: 13, fontWeight: 600, color: UP_COLOR }}>↑</span>}
                {showDown && <span style={{ fontSize: 13, fontWeight: 600, color: DOWN_COLOR }}>↓</span>}
                {showHold && (
                    <span style={{
                        fontSize: 9, fontWeight: 600, padding: '2px 5px',
                        borderRadius: 3, background: 'var(--ink-6)',
                        color: 'var(--ink-4)', letterSpacing: '0.04em',
                    }}>HOLD</span>
                )}
            </span>
            <span style={{ flexShrink: 0, minWidth: 90 }}>
                {isRange ? <RangeValue /> : (
                    <>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                            {valueNum}
                        </span>
                        {valueUnit && (
                            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-3)', marginLeft: 3 }}>{valueUnit}</span>
                        )}
                    </>
                )}
            </span>
            <span style={{ flexShrink: 0, minWidth: 90, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-4)' }}>As of</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)' }}>{formatDate(o.latest_date)}</span>
            </span>
            <span style={{ flexShrink: 0, minWidth: 120, display: 'flex', alignItems: 'center', gap: 5 }}>
                {scheduled ? (
                    <>
                        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-4)' }}>Scheduled</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)' }}>{scheduled}</span>
                    </>
                ) : (
                    <span style={{ color: 'var(--ink-5)', fontSize: 12 }}>—</span>
                )}
            </span>
        </div>
    )
}

interface Props {
    outcomes: MacroOutcome[]
    schedule: ScheduleEntry[]
}

export default function MacroTable({ outcomes, schedule }: Props) {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640)
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])

    if (!outcomes.length) return null

    const usMacro = outcomes.filter(o => ['cpi', 'pce', 'nfp', 'unrate', 'jolts', 'gdp'].includes(o.type))
    const cbRates = outcomes.filter(o => CB_TYPES.has(o.type))

    const GroupHeader = ({ label }: { label: string }) => (
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

    return (
        <div>
            <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'var(--ink-4)',
                margin: '0 0 10px', fontFamily: 'var(--font-ui)',
            }}>
                Macro Indicators
            </p>
            {/* Mobile: single column stacked, Desktop: two-column grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: isMobile ? '0' : '0 32px',
            }}>
                <div>
                    <GroupHeader label="US Economic" />
                    {usMacro.map(o => <MacroRow key={o.type} o={o} schedule={schedule} isMobile={isMobile} />)}
                </div>
                <div style={{ marginTop: isMobile ? 16 : 0 }}>
                    <GroupHeader label="Central Banks" />
                    {cbRates.map(o => <MacroRow key={o.type} o={o} schedule={schedule} isMobile={isMobile} />)}
                </div>
            </div>
        </div>
    )
}