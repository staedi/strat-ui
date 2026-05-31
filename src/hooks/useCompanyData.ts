import { useState, useEffect } from 'react'

const BASE_URL = 'https://raw.githubusercontent.com/staedi/strat-data/main'

export interface CompanyMeta {
  name: string
  summary: string
  news_role: string | null
  contextual_peers: string[]
  contextual_peer_names: Record<string, string>
  industry_peer_names: Record<string, string>
  industry_peer_theme: string | null
  industry: string | null
  exchange: string | null
  industry_peers: string[]
  filing_date: string | null
  enriched_at: string

}

interface CompanyData {
  updated_at: string
  companies: Record<string, CompanyMeta>
}

interface UseCompanyDataResult {
  data: CompanyData | null
  loading: boolean
  error: string | null
}

export function useCompanyData(): UseCompanyDataResult {
  const [data, setData] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const url = `${BASE_URL}/company_meta.json`
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((json: CompanyData) => {
        setData(json)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  return { data, loading, error }
}
