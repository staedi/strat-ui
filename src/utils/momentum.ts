// Recent-rate vs baseline-rate activity ratio, computed backend-side for
// both clusters (export_topics_json.py) and tickers (export_sentiment_json.py),
// "full" mode only — "recent" mode's window IS the recent window, so there's
// no baseline to compare against.

const MOMENTUM_SURGE_THRESHOLD = 1.75
const MOMENTUM_COOL_THRESHOLD = 0.5
// Cooling needs enough volume to be signal rather than noise — a 2-mention
// entity with 0 recent mentions isn't a real trend, just a small sample.
// Surging isn't gated the same way: a sudden concentration is itself the
// signal even off a small base, so it's fine to flag early.
const MOMENTUM_COOL_MIN_COUNT = 6

export function momentumLabel(m?: number | null, count?: number): { icon: string; text: string } | null {
  if (m === undefined) return null   // recent mode — field not populated
  if (m === null) return { icon: '🆕', text: 'New this window' }
  if (m >= MOMENTUM_SURGE_THRESHOLD) return { icon: '🔥', text: `${m.toFixed(1)}× recent pace` }
  if (m <= MOMENTUM_COOL_THRESHOLD && (count ?? 0) >= MOMENTUM_COOL_MIN_COUNT) {
    return { icon: '❄️', text: `${m.toFixed(1)}× recent pace` }
  }
  return null
}
