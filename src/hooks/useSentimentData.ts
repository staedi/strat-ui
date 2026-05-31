import { useState, useEffect } from 'react'

const BASE_URL = 'https://raw.githubusercontent.com/staedi/strat-data/main'

function currentISOWeek(): string {
    const now = new Date()
    const jan4 = new Date(now.getFullYear(), 0, 4)
    const weekNum = Math.ceil(((now.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SentimentDay {
    date: string
    pos: number
    neg: number
    neu: number
    total: number
    positive_pct: number
    negative_pct: number
}

export interface SentimentCluster {
    cluster_id: number
    label: string
    meta_category: string
    pos: number
    neg: number
    neu: number
    total: number
    positive_pct: number
    negative_pct: number
    score: number
}

export interface TickerSentiment {
    name: string
    pos: number
    neg: number
    neu: number
    total: number
    positive_pct: number
    negative_pct: number
    score: number
    daily: SentimentDay[]
    clusters: SentimentCluster[]
}

export interface SentimentData {
    mode: string
    updated_at: string
    window_start?: string
    tickers: Record<string, TickerSentiment>
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSentimentData(mode: 'recent' | 'weekly' | 'full' = 'recent', week?: string) {
    const [data, setData] = useState<SentimentData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setLoading(true)
        setError(null)
        setData(null)

        const resolvedWeek = week ?? currentISOWeek()
        const url = mode === 'recent'
            ? `${BASE_URL}/sentiment_recent.json`
            : mode === 'full'
                ? `${BASE_URL}/sentiment_full.json`
                : `${BASE_URL}/sentiment_weekly/sentiment_${resolvedWeek}.json`

        fetch(url)
            .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
            .then((d: SentimentData) => { setData(d); setLoading(false) })
            .catch(e => { setError(e.message); setLoading(false) })
    }, [mode, week])

    return { data, loading, error }
}