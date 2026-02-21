import { useState, useEffect, useCallback, useMemo } from 'react'
import './Versus.css'

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

export default function Versus({ kana, socket }) {
  const [mode, setMode] = useState('hiragana')
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [ready, setReady] = useState(false)
  const [opponentReady, setOpponentReady] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [roomId, setRoomId] = useState(null)

  const shuffledList = useMemo(() => {
    const list = mode === 'hiragana' ? kana.hiragana : kana.katakana
    return shuffleArray(list)
  }, [mode, kana])

  const current = shuffledList[index]
  const total = shuffledList.length

  useEffect(() => {
    socket.emit('join-versus')
    socket.on('room-joined', (room) => {
      setRoomId(room)
      console.log('Joined room:', room)
    })

    socket.on('player-ready', (data) => {
      if (data.socketId !== socket.id) {
        setOpponentReady(data.ready)
      }
    })

    socket.on('countdown-start', () => {
      setCountdown(3)
    })

    socket.on('countdown-tick', (num) => {
      setCountdown(num)
    })

    socket.on('game-start', () => {
      setGameStarted(true)
      setCountdown(null)
    })

    return () => {
      socket.off('room-joined')
      socket.off('player-ready')
      socket.off('countdown-start')
      socket.off('countdown-tick')
      socket.off('game-start')
    }
  }, [socket])

  const handleReady = () => {
    const newReady = !ready
    setReady(newReady)
    socket.emit('ready-up', { ready: newReady })
  }

  const check = useCallback(() => {
    if (!current || !gameStarted) return
    const ok = romajiEqual(input, current.romaji)
    
    if (ok) {
      setInput('')
      setIndex((i) => (i + 1) % total)
      socket.emit('progress-update', { index: (index + 1) % total, total })
    } else {
      setInput('')
      setIndex((i) => (i + 1) % total)
      socket.emit('progress-update', { index: (index + 1) % total, total })
    }
  }, [current, input, total, gameStarted, index, socket])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && gameStarted) check()
  }

  if (!shuffledList.length) return null

  if (!gameStarted) {
    return (
      <div className="versus">
        <div className="versus-lobby">
          <h2 className="versus-title">Versus Mode</h2>
          {roomId && <p className="versus-room">Room: {roomId}</p>}
          
          <div className="versus-ready-section">
            <button
              className={`versus-ready-button ${ready ? 'ready' : ''}`}
              onClick={handleReady}
              disabled={countdown !== null}
            >
              {ready ? 'Ready ✓' : 'Ready Up'}
            </button>
            
            <div className="versus-status">
              {!ready && !opponentReady && (
                <p>Click "Ready Up" when you're ready to start</p>
              )}
              {ready && !opponentReady && (
                <p className="waiting">Waiting for opponent...</p>
              )}
              {!ready && opponentReady && (
                <p className="waiting">Other user isn't ready</p>
              )}
              {ready && opponentReady && countdown === null && (
                <p className="both-ready">Both players ready! Starting soon...</p>
              )}
            </div>

            {countdown !== null && (
              <div className="versus-countdown">
                <div className="countdown-number">{countdown}</div>
                {countdown === 0 && <p className="countdown-go">GO!</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="versus">
      <div className="versus-tabs">
        <button
          className={`versus-tab ${mode === 'hiragana' ? 'active' : ''}`}
          onClick={() => { setMode('hiragana'); setIndex(0); setInput('') }}
          disabled={!gameStarted}
        >
          Hiragana
        </button>
        <button
          className={`versus-tab ${mode === 'katakana' ? 'active' : ''}`}
          onClick={() => { setMode('katakana'); setIndex(0); setInput('') }}
          disabled={!gameStarted}
        >
          Katakana
        </button>
      </div>

      <div className="versus-card">
        <p className="versus-progress">
          {index + 1} / {total}
        </p>
        <p className="versus-kana" aria-label={`Romaji: ${current.romaji}`}>
          {current.char}
        </p>
        <div className="versus-input-row">
          <input
            type="text"
            className="versus-input"
            placeholder="romaji"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoFocus
            disabled={!gameStarted}
          />
        </div>
      </div>
    </div>
  )
}
