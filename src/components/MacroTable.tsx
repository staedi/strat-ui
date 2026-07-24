import type { MacroOutcome, ScheduleEntry } from './BriefingTab'

const TYPE_LABELS: Record<string, string> = {
    fed: 'FED', cpi: 'CPI', nfp: 'NFP', jolts: 'JOLTS',
    pce: 'PCE', gdp: 'GDP', ecb: 'ECB', boe: 'BOE', boj: 'BOJ',
}

const TYPE_COLORS: Record<string, string> = {
    fed: '#2563eb', ecb: '#7c3aed', boe: '#0891b2', boj: '#be185d',
    cpi: '#d97706', nfp: '#d97706', jolts: '#d97706',
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

function MacroRow({ o, schedule }: { o: MacroOutcome; schedule: ScheduleEntry[] }) {
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

    const match = o.latest_value.match(/^([\d,.$]+(?:\.\d+)?%?)(.*)?$/)
    const valueNum = match?.[1] ?? o.latest_value
    const valueUnit = match?.[2]?.trim() ?? ''

    // Highlight pill if latest release was today
    const isToday = o.latest_date?.slice(0, 10) === TODAY_ISO
    const pillBg = isToday ? (TYPE_COLORS[o.type] ?? 'var(--ink)') : 'var(--ink-6)'
    const pillColor = isToday ? 'white' : 'var(--ink-3)'

    return (
        <div style={{
            display: 'flex', alignItems: 'center',
            padding: '9px 0', borderBottom: '1px solid var(--ink-6)',
            gap: 12, fontFamily: 'var(--font-ui)',
        }}>
            {/* Type pill — colored if released today */}
            <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px',
                borderRadius: 3, background: pillBg,
                color: pillColor, minWidth: 44, textAlign: 'center',
                flexShrink: 0, fontFamily: 'var(--font-mono)',
            }}>
                {TYPE_LABELS[o.type] ?? o.type.toUpperCase()}
            </span>

            {/* Name */}
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-4)', flex: 1, minWidth: 0 }}>
                {o.name}
            </span>

            {/* Direction */}
            <span style={{ width: 28, flexShrink: 0, textAlign: 'center' }}>
                {showUp && <span style={{ fontSize: 13, fontWeight: 600, color: UP_COLOR }}>↑</span>}
                {showDown && <span style={{ fontSize: 13, fontWeight: 600, color: DOWN_COLOR }}>↓</span>}
                {showHold && (
                    <span style={{
                        fontSize: 9, fontWeight: 600, padding: '1px 5px',
                        borderRadius: 3, background: 'var(--ink-6)',
                        color: 'var(--ink-4)', letterSpacing: '0.04em',
                    }}>
                        HOLD
                    </span>
                )}
            </span>

            {/* Value */}
            <span style={{ flexShrink: 0, minWidth: 60 }}>
                <span style={{
                    fontSize: 13, fontWeight: 700, color: 'var(--ink)',
                    fontVariantNumeric: 'tabular-nums',
                }}>
                    {valueNum}
                </span>
                {valueUnit && (
                    <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-3)', marginLeft: 3 }}>
                        {valueUnit}
                    </span>
                )}
            </span>

            {/* Latest */}
            <span style={{
                flexShrink: 0, minWidth: 90,
                display: 'flex', alignItems: 'center', gap: 5,
            }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-4)' }}>Latest</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)' }}>
                    {formatDate(o.latest_date)}
                </span>
            </span>

            {/* Upcoming */}
            <span style={{
                flexShrink: 0, minWidth: 120,
                display: 'flex', alignItems: 'center', gap: 5,
            }}>
                {scheduled ? (
                    <>
                        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-4)' }}>Upcoming</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)' }}>
                            {scheduled}
                        </span>
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
    if (!outcomes.length) return null

    const usMacro = outcomes.filter(o => ['cpi', 'pce', 'nfp', 'jolts', 'gdp'].includes(o.type))
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                <div>
                    <GroupHeader label="US Economic" />
                    {usMacro.map(o => <MacroRow key={o.type} o={o} schedule={schedule} />)}
                </div>
                <div>
                    <GroupHeader label="Central Banks" />
                    {cbRates.map(o => <MacroRow key={o.type} o={o} schedule={schedule} />)}
                </div>
            </div>
        </div>
    )
}