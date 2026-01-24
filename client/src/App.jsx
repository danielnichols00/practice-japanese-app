import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import Quiz from './Quiz'
import './App.css'

const socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] })

export default function App() {
  const [kana, setKana] = useState({ hiragana: [], katakana: [] })
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  if (loading) return <div className="app-loading">Loading kana…</div>
  if (error) return <div className="app-error">Error: {error}</div>

  return (
    <div className="app">
      <header className="app-header">
        <h1>Practice Japanese – Hiragana & Katakana</h1>
        <p className="socket-status" data-connected={connected}>
          {connected ? 'Connected' : 'Disconnected'}
        </p>
      </header>
      <main className="app-main">
        <Quiz kana={kana} />
      </main>
    </div>
  )
}
