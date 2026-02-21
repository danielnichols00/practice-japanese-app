import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import Leaderboard, { formatTime } from './Leaderboard'
import './TimeTrial.css'
import './Quiz.css'

const romajiEqual = (a, b) =>
  String(a).trim().toLowerCase() === String(b).trim().toLowerCase()

const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function TimeTrial({ kana }) {
  const [playerName, setPlayerName] = useState('')
  const [playerNameSubmitted, setPlayerNameSubmitted] = useState(false)
  const [mode, setMode] = useState('hiragana')
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [flashClass, setFlashClass] = useState('')
  const [timerStarted, setTimerStarted] = useState(false)
  const [timerStopped, setTimerStopped] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const [leaderboardCollapsed, setLeaderboardCollapsed] = useState(false)
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0)
  const startTimeRef = useRef(null)

  const shuffledList = useMemo(() => {
    const list = mode === 'hiragana' ? kana.hiragana : kana.katakana
    return shuffleArray(list)
  }, [mode, kana])

  const current = shuffledList[index]
  const total = shuffledList.length
  const elapsedMs = timerStopped && startTimeRef.current && endTime
    ? endTime - startTimeRef.current
    : startTimeRef.current
    ? Date.now() - startTimeRef.current
    : 0

  const check = useCallback(() => {
    if (!current) return

    if (!timerStarted) {
      const now = Date.now()
      startTimeRef.current = now
      setStartTime(now)
      setTimerStarted(true)
    }

    const ok = romajiEqual(input, current.romaji)

    if (ok) {
      setFlashClass('flash-correct')
      const nextIndex = (index + 1) % total
      const isLast = index === total - 1

      setTimeout(() => {
        setInput('')
        setFlashClass('')
        setIndex(nextIndex)

        if (isLast) {
          const finishedAt = Date.now()
          setEndTime(finishedAt)
          setTimerStopped(true)
          const finalTime = startTimeRef.current ? finishedAt - startTimeRef.current : 0
          fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              player_name: (playerName && playerName.trim()) || 'Anonymous',
              time_ms: Number(finalTime),
              kana_set: mode,
            }),
          })
            .then(async (res) => {
              if (res.ok) setLeaderboardRefreshKey((k) => k + 1)
              else console.warn('Leaderboard save failed:', res.status, await res.text())
            })
            .catch((err) => console.warn('Leaderboard save error:', err))
        }
      }, 400)
    } else {
      setFlashClass('flash-incorrect')
      setTimeout(() => setFlashClass(''), 400)
    }
  }, [current, input, total, index, timerStarted, mode, playerName])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') check()
  }

  const handleSubmitName = (e) => {
    e.preventDefault()
    if (playerName.trim()) setPlayerNameSubmitted(true)
  }

  if (!playerNameSubmitted) {
    return (
      <div className="time-trial time-trial-prompt">
        <div className="time-trial-prompt-card">
          <h2 className="time-trial-prompt-title">Time Trial</h2>
          <p className="time-trial-prompt-subtitle">Who&apos;s playing?</p>
          <form onSubmit={handleSubmitName} className="time-trial-prompt-form">
            <input
              type="text"
              className="time-trial-name-input"
              placeholder="Enter name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={32}
              autoFocus
            />
            <button type="submit" className="time-trial-name-submit">
              Start
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="time-trial-layout">
      <div className="time-trial-main">
        <div className="time-trial">
          <div className="time-trial-header">
            <div className="quiz-tabs">
              <button
                className={`quiz-tab ${mode === 'hiragana' ? 'active' : ''}`}
                onClick={() => { setMode('hiragana'); setIndex(0); setInput(''); setTimerStarted(false); setTimerStopped(false); setStartTime(null); setEndTime(null) }}
                disabled={timerStarted && !timerStopped}
              >
                Hiragana
              </button>
              <button
                className={`quiz-tab ${mode === 'katakana' ? 'active' : ''}`}
                onClick={() => { setMode('katakana'); setIndex(0); setInput(''); setTimerStarted(false); setTimerStopped(false); setStartTime(null); setEndTime(null) }}
                disabled={timerStarted && !timerStopped}
              >
                Katakana
              </button>
            </div>
            <div className="time-trial-timer">
              {timerStopped && endTime && startTimeRef.current ? (
                <span className="time-trial-timer-done">{formatTime(endTime - startTimeRef.current)}</span>
              ) : timerStarted ? (
                <span className="time-trial-timer-running">{formatTime(elapsedMs)}</span>
              ) : (
                <span className="time-trial-timer-idle">0.0s</span>
              )}
            </div>
          </div>

          {timerStopped && (
            <div className="time-trial-done-card">
              <p>Done! Your time: <strong>{startTimeRef.current && endTime ? formatTime(endTime - startTimeRef.current) : '—'}</strong></p>
              <p className="time-trial-done-sub">Saved to leaderboard.</p>
            </div>
          )}

          {!timerStopped && shuffledList.length > 0 && (
            <div className={`quiz-card ${flashClass}`}>
              <p className="quiz-progress">
                {index + 1} / {total}
              </p>
              <p className="quiz-kana" aria-label={`Romaji: ${current.romaji}`}>
                {current.char}
              </p>
              <div className="quiz-input-row">
                <input
                  type="text"
                  className="quiz-input"
                  placeholder="romaji"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <Leaderboard
        kanaSet={mode}
        collapsed={leaderboardCollapsed}
        onToggle={() => setLeaderboardCollapsed((c) => !c)}
        refreshKey={leaderboardRefreshKey}
      />
    </div>
  )
}
