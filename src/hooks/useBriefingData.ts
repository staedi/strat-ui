import { useState, useEffect } from 'react'
import type { Briefing } from '../components/BriefingTab'

import { BASE_URL } from '../config'

export function useBriefingData() {
    const [data, setData] = useState<Briefing | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setLoading(true)
        setError(null)
        setData(null)

        fetch(`${BASE_URL}/briefing.json`)
            .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
            .then((d: Briefing) => { setData(d); setLoading(false) })
            .catch(e => { setError(e.message); setLoading(false) })
    }, [])

    return { data, loading, error }
}