import { useState, useEffect } from 'react'
import type { Snapshot, SnapshotItem } from './BriefingTab'

const FX_EXCLUDE = new Set(['AUDUSD=X', 'CNY=X'])

const UP_COLOR = '#5ec98b'
const DOWN_COLOR = '#e06c75'

function changePctColor(pct: number | null): string {
    if (pct === null) return 'var(--ink-4)'
    if (pct > 0) return UP_COLOR
    if (pct < 0) return DOWN_COLOR
    return 'var(--ink-4)'
}

function formatPct(pct: number | null): string {
    if (pct === null) return '—'
    const sign = pct > 0 ? '+' : ''
    return `${sign}${pct.toFixed(2)}%`
}

function formatClose(close: number, ticker: string): string {
    if (ticker === '^TNX') return `${close.toFixed(3)}%`
    if (close >= 1000) return close.toLocaleString('en-US', { maximumFractionDigits: 0 })
    if (close >= 10) return close.toFixed(2)
    return close.toFixed(4)
}

function formatAsOf(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function AssetRow({ items, label, shaded }: { items: SnapshotItem[]; label: string; shaded: boolean }) {
    const filtered = items.filter(i => !FX_EXCLUDE.has(i.ticker))
    if (!filtered.length) return null

    // Peers in the same row share a trading session in the common case — an
    // item whose as_of is older than the freshest peer (e.g. ^N225/^KS11
    // lagging ^GSPC/^VIX due to delayed-quote data availability) gets a
    // stale marker rather than silently looking like same-day data.
    const freshestAsOf = filtered.reduce((max, i) => (i.as_of > max ? i.as_of : max), filtered[0].as_of)

    return (
        <div style={{
            display: 'flex', alignItems: 'baseline',
            padding: '7px 8px', gap: 12,
            borderRadius: 4,
            borderBottom: '1px solid var(--ink-6)',
            marginBottom: 4,
        }}>
            <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'var(--ink-4)',
                minWidth: 90, flexShrink: 0, fontFamily: 'var(--font-ui)',
            }}>
                {label}
            </span>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'baseline' }}>
                {filtered.map(item => {
                    const isStale = item.as_of < freshestAsOf
                    return (
                        <div key={item.ticker} style={{
                            display: 'flex', alignItems: 'baseline', gap: 4
                        }}>
                            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-4)', fontFamily: 'var(--font-ui)' }}>
                                {item.label}
                            </span>
                            <span style={{
                                fontSize: 13, fontWeight: 700, color: 'var(--ink)',
                                fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums',
                            }}>
                                {formatClose(item.close, item.ticker)}
                            </span>
                            <span style={{
                                fontSize: 11, fontWeight: 600,
                                color: changePctColor(item.change_pct),
                                fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums',
                            }}>
                                {formatPct(item.change_pct)}
                            </span>
                            {isStale && (
                                <span
                                    title={`Historical bar not yet finalized — showing ${formatAsOf(item.as_of)} data`}
                                    style={{
                                        fontSize: 9, fontWeight: 600, letterSpacing: '0.04em',
                                        textTransform: 'uppercase', color: 'var(--ink-4)',
                                        background: 'var(--ink-6)', borderRadius: 3,
                                        padding: '2px 5px', flexShrink: 0, cursor: 'default',
                                    }}
                                >
                                    delayed
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

interface Props {
    snapshot: Snapshot
}

export default function SnapshotSection({ snapshot }: Props) {
    const groups = [
        { items: snapshot.indices, label: 'Indices' },
        { items: snapshot.bonds, label: 'Bonds' },
        { items: snapshot.fx, label: 'FX' },
        { items: snapshot.crypto, label: 'Crypto' },
        { items: snapshot.commodities, label: 'Commodities' },
    ]

    return (
        <div>
            <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'var(--ink-4)',
                margin: '0 0 6px', fontFamily: 'var(--font-ui)',
            }}>
                Market Snapshot
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {groups.map((g, i) => (
                    <AssetRow key={g.label} items={g.items} label={g.label} shaded={i % 2 === 1} />
                ))}
            </div>
        </div>
    )
}