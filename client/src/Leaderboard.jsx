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
          <h3 className="leaderboard-title">Time Trial</h3>
          <p className="leaderboard-subtitle">{kanaSet === 'hiragana' ? 'Hiragana' : 'Katakana'}</p>
          {loading ? (
            <p className="leaderboard-loading">Loading…</p>
          ) : (
            <ol className="leaderboard-list">
              {entries.length === 0 ? (
                <li className="leaderboard-empty">No scores yet</li>
              ) : (
                entries.map((row, i) => (
                  <li key={row.id} className="leaderboard-item">
                    <span className="leaderboard-rank">{i + 1}</span>
                    <span className="leaderboard-name">{row.player_name}</span>
                    <span className="leaderboard-time">{formatTime(row.time_ms)}</span>
                  </li>
                ))
              )}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}

export { formatTime }
