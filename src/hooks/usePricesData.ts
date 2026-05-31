import { useState, useEffect } from 'react'

const BASE_URL = 'https://raw.githubusercontent.com/staedi/strat-data/main'

function currentISOWeek(): string {
  const now = new Date()
  const jan4 = new Date(now.getFullYear(), 0, 4)
  const weekNum = Math.ceil(((now.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PricePoint {
  date: string
  close: number | null
  volume: number | null
  market_cap: number | null
}

export interface PricesData {
  mode: string
  updated_at: string
  window_start?: string
  prices: Record<string, PricePoint[]>
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePricesData(mode: 'recent' | 'weekly' | 'full' = 'recent', week?: string) {
  const [data, setData] = useState<PricesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setData(null)

    const resolvedWeek = week ?? currentISOWeek()
    const url = mode === 'recent'
      ? `${BASE_URL}/prices_recent.json`
      : mode === 'full'
        ? `${BASE_URL}/prices_full.json`
        : `${BASE_URL}/prices_weekly/prices_${resolvedWeek}.json`

    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: PricesData) => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [mode, week])

  return { data, loading, error }
}