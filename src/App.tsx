import { useState } from 'react'
import TopicsTab from './components/TopicsTab'
import TickersTab from './components/TickersTab'

type Tab = 'topics' | 'tickers' | 'sentiment'
type Mode = 'recent' | 'full'

const TABS: { id: Tab; label: string }[] = [
  { id: 'topics', label: 'Topics' },
  { id: 'tickers', label: 'Tickers' },
  { id: 'sentiment', label: 'Sentiment' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('topics')
  const [mode, setMode] = useState<Mode>('recent')
  const [activeTicker, setActiveTicker] = useState<string | null>(null)
  const [activeCluster, setActiveCluster] = useState<number | null>(null)

  const navigateToTicker = (ticker: string) => {
    setActiveTicker(ticker)
    setTab('tickers')
  }

  const navigateToCluster = (clusterId: number) => {
    setActiveCluster(clusterId)
    setTab('topics')
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', background: 'var(--white)',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', height: 52, borderBottom: '1px solid var(--ink-5)',
        flexShrink: 0, background: 'var(--white)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect width="22" height="22" rx="5" fill="var(--ink)" />
            <polyline points="4,16 8,10 12,13 18,6"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            Financial News Explorer
          </span>
        </div>

        <nav style={{ display: 'flex', gap: 2 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '5px 16px', borderRadius: 'var(--radius-sm)',
              border: 'none', background: tab === t.id ? 'var(--ink)' : 'transparent',
              color: tab === t.id ? 'var(--white)' : 'var(--ink-3)',
              fontSize: 13, fontWeight: 500,
              transition: 'all .15s',
            }}>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Recent / Full toggle — shared across Topics and Tickers tabs */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--ink-6)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
          {(['recent', 'full'] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '3px 12px', borderRadius: 4, border: 'none',
              background: mode === m ? 'var(--white)' : 'transparent',
              color: mode === m ? 'var(--ink)' : 'var(--ink-3)',
              fontSize: 12, fontWeight: mode === m ? 600 : 400,
              boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all .15s', textTransform: 'capitalize',
              cursor: 'pointer',
            }}>
              {m === 'recent' ? 'Recent' : 'Full'}
            </button>
          ))}
        </div>
      </header>

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'topics' && (
          <TopicsTab
            onTickerClick={navigateToTicker}
            initialCluster={activeCluster}
            mode={mode}
            onModeChange={setMode}
          />
        )}
        {tab === 'tickers' && (
          <TickersTab
            initialTicker={activeTicker}
            onClusterClick={navigateToCluster}
            mode={mode}
          />
        )}
        {tab === 'sentiment' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)' }}>
            Sentiment — coming soon
          </div>
        )}
      </main>
    </div>
  )
}