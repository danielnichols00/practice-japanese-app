import { useState, useCallback, useEffect, useMemo } from 'react'
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

export default function Quiz({ kana }) {
  const [mode, setMode] = useState('hiragana')
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [flashClass, setFlashClass] = useState('')

  const shuffledList = useMemo(() => {
    const list = mode === 'hiragana' ? kana.hiragana : kana.katakana
    return shuffleArray(list)
  }, [mode, kana])

  const current = shuffledList[index]
  const total = shuffledList.length

  const check = useCallback(() => {
    if (!current) return
    const ok = romajiEqual(input, current.romaji)
    
    if (ok) {
      setFlashClass('flash-correct')
      setTimeout(() => {
        setInput('')
        setFlashClass('')
        setIndex((i) => (i + 1) % total)
      }, 400)
    } else {
      setFlashClass('flash-incorrect')
      setTimeout(() => {
        setFlashClass('')
      }, 400)
    }
  }, [current, input, total])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') check()
  }

  const reset = () => {
    setIndex(0)
    setInput('')
    setFlashClass('')
  }

  if (!shuffledList.length) return null

  return (
    <div className="quiz">
      <div className="quiz-tabs">
        <button
          className={`quiz-tab ${mode === 'hiragana' ? 'active' : ''}`}
          onClick={() => { setMode('hiragana'); reset() }}
        >
          Hiragana
        </button>
        <button
          className={`quiz-tab ${mode === 'katakana' ? 'active' : ''}`}
          onClick={() => { setMode('katakana'); reset() }}
        >
          Katakana
        </button>
      </div>

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
    </div>
  )
}
