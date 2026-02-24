import { useState, useEffect } from 'react'
import './Leaderboard.css'

function formatTime(ms) {
  const sec = Math.floor(ms / 1000)
  const min = Math.floor(sec / 60)
  const s = sec % 60
  return min > 0 ? `${min}:${String(s).padStart(2, '0')}` : `${sec}.${String(Math.floor((ms % 1000) / 100))}s`
}

export default function Leaderboard({ kanaSet = 'hiragana', collapsed: controlledCollapsed, onToggle, refreshKey }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [internalCollapsed, setInternalCollapsed] = useState(false)

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed
  const setCollapsed = onToggle || (() => setInternalCollapsed((c) => !c))

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leaderboard?kana_set=${encodeURIComponent(kanaSet)}&limit=20`)
      .then((res) => res.json())
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [kanaSet, refreshKey])

  const handleClear = async () => {
    const pwd = window.prompt('Enter admin password to clear leaderboard:')
    if (!pwd) return
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      })
      if (res.ok) {
        setEntries([])
      } else {
        const text = await res.text()
        window.alert('Failed to clear leaderboard.')
        console.warn('Clear leaderboard failed', res.status, text)
      }
    } catch (err) {
      console.warn('Clear leaderboard error', err)
      window.alert('Failed to clear leaderboard.')
    }
  }

  const basic = entries.filter((e) => !e.variant || e.variant === 'basic')
  const dakutenOnly = entries.filter((e) => e.variant === 'dakuten')
  const dakutenCombo = entries.filter((e) => e.variant === 'dakuten_combo')

  return (
    <div className={`leaderboard ${isCollapsed ? 'collapsed' : ''}`}>
      <button
        type="button"
        className="leaderboard-toggle"
        onClick={setCollapsed}
        aria-expanded={!isCollapsed}
      >
        {isCollapsed ? '◀ Leaderboard' : '▶ Leaderboard'}
      </button>
      {!isCollapsed && (
        <div className="leaderboard-panel">
          <div className="leaderboard-header">
            <div>
              <h3 className="leaderboard-title">Time Trial</h3>
              <p className="leaderboard-subtitle">{kanaSet === 'hiragana' ? 'Hiragana' : 'Katakana'}</p>
            </div>
            <button type="button" className="leaderboard-clear" onClick={handleClear}>
              Clear
            </button>
          </div>
          {loading ? (
            <p className="leaderboard-loading">Loading…</p>
          ) : (
            <>
              <h4 className="leaderboard-section-title">Basic</h4>
              <ol className="leaderboard-list">
                {basic.length === 0 ? (
                  <li className="leaderboard-empty">No scores yet</li>
                ) : (
                  basic.map((row, i) => (
                    <li key={row.id} className="leaderboard-item">
                      <span className="leaderboard-rank">{i + 1}</span>
                      <span className="leaderboard-name">{row.player_name}</span>
                      <span className="leaderboard-time">{formatTime(row.time_ms)}</span>
                    </li>
                  ))
                )}
              </ol>
              <h4 className="leaderboard-section-title">Dakuten</h4>
              <ol className="leaderboard-list">
                {dakutenOnly.length === 0 ? (
                  <li className="leaderboard-empty">No scores yet</li>
                ) : (
                  dakutenOnly.map((row, i) => (
                    <li key={row.id} className="leaderboard-item">
                      <span className="leaderboard-rank">{i + 1}</span>
                      <span className="leaderboard-name">{row.player_name}</span>
                      <span className="leaderboard-time">{formatTime(row.time_ms)}</span>
                    </li>
                  ))
                )}
              </ol>
              <h4 className="leaderboard-section-title">Dakuten + combinations</h4>
              <ol className="leaderboard-list">
                {dakutenCombo.length === 0 ? (
                  <li className="leaderboard-empty">No scores yet</li>
                ) : (
                  dakutenCombo.map((row, i) => (
                    <li key={row.id} className="leaderboard-item">
                      <span className="leaderboard-rank">{i + 1}</span>
                      <span className="leaderboard-name">{row.player_name}</span>
                      <span className="leaderboard-time">{formatTime(row.time_ms)}</span>
                    </li>
                  ))
                )}
              </ol>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export { formatTime }
