import { useState, useEffect } from 'react'
import type { TopicsData } from '../components/CirclePacking'

const BASE_URL = 'https://raw.githubusercontent.com/staedi/strat-data/main'

function currentISOWeek(): string {
  const now = new Date()
  const jan4 = new Date(now.getFullYear(), 0, 4)
  const weekNum = Math.ceil(((now.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

export function useTopicsData(mode: 'recent' | 'weekly' | 'full' = 'recent', week?: string) {
  const [data, setData] = useState<TopicsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setData(null)

    const resolvedWeek = week ?? currentISOWeek()
    const url = mode === 'recent'
      ? `${BASE_URL}/topics_recent.json`
      : mode === 'full'
        ? `${BASE_URL}/topics_full.json`
        : `${BASE_URL}/topics_weekly/topics_${resolvedWeek}.json`

    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: TopicsData) => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [mode, week])

  return { data, loading, error }
}