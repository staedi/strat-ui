import { useState, useEffect } from 'react'
import { BASE_URL } from '../config'

export interface EarningsEntry {
  date: string
  eps_estimate: number | null
  eps_actual: number | null
  surprise_pct: number | null
}

export interface EarningsData {
  updated_at: string
  earnings: Record<string, EarningsEntry[]>
}

export function useEarningsData() {
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`${BASE_URL}/earnings.json`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: EarningsData) => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  return { data, loading, error }
}
