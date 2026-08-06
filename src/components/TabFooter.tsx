const STYLE: React.CSSProperties = {
  fontSize: 11, color: 'var(--ink-4)',
  fontStyle: 'italic', fontFamily: 'var(--font-ui)', margin: 0,
}

interface Props {
  showMacro?: boolean
}

export default function TabFooter({ showMacro = false }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <p style={STYLE}>Topic clusters reflect the past 7 days. Market data and sentiment updated daily.</p>
      <p style={STYLE}>News sourced from CNBC.</p>
      {showMacro && (
        <p style={STYLE}>Macro indicators sourced from FRED and respective central banks (FED, ECB, BOJ, and BOE).</p>
      )}
      <p style={STYLE}>Price and earnings data via yfinance.</p>
      <p style={STYLE}>Summaries and topic labels are AI-generated and may contain errors.</p>
    </div>
  )
}
