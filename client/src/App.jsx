import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import Menu from './Menu'
import Quiz from './Quiz'
import QuizOptions from './QuizOptions'
import Versus from './Versus'
import TimeTrial from './TimeTrial'
import './App.css'

const socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] })

export default function App() {
  const [kana, setKana] = useState({ hiragana: [], katakana: [] })
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentMode, setCurrentMode] = useState(null)
  const [quizOptions, setQuizOptions] = useState(null)

  useEffect(() => {
    fetch('/api/kana')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load kana')
        return res.json()
      })
      .then(setKana)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    return () => {
      socket.off('connect')
      socket.off('disconnect')
    }
  }, [])

  const handleBackToMenu = () => {
    setCurrentMode(null)
    setQuizOptions(null)
    socket.emit('leave-room')
  }

  if (loading) return <div className="app-loading">Loading kana…</div>
  if (error) return <div className="app-error">Error: {error}</div>

  return (
    <div className="app">
      <header className="app-header">
        <h1>Practice Japanese – Hiragana & Katakana</h1>
        <div className="app-header-right">
          {currentMode && (
            <button className="back-button" onClick={handleBackToMenu}>
              ← Menu
            </button>
          )}
          <p className="socket-status" data-connected={connected}>
            {connected ? 'Connected' : 'Disconnected'}
          </p>
        </div>
      </header>
      <main className="app-main">
        {!currentMode && (
          <Menu
            onSelectMode={(mode) => {
              setCurrentMode(mode)
              if (mode === 'quiz') setQuizOptions(null)
            }}
          />
        )}
        {currentMode === 'quiz' && quizOptions === null && (
          <QuizOptions
            onStart={(dakuten, combination) => {
              const variant = combination ? 'dakuten_combo' : dakuten ? 'dakuten' : 'basic'
              setQuizOptions({
                dakuten: dakuten || combination,
                combination,
                variant,
              })
            }}
          />
        )}
        {currentMode === 'quiz' && quizOptions !== null && (
          <Quiz kana={kana} quizOptions={quizOptions} />
        )}
        {currentMode === 'versus' && <Versus kana={kana} socket={socket} />}
        {currentMode === 'timetrial' && <TimeTrial kana={kana} />}
      </main>
    </div>
  )
}
