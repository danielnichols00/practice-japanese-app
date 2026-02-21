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

const getHintRevealOrder = (word) => {
  const indices = [...Array(word.length)].map((_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices
}

function buildKanaList(kana, mode, options) {
  const base = mode === 'hiragana' ? (kana.hiragana || []) : (kana.katakana || [])
  if (!options) return base
  let list = [...base]
  if (options.dakuten) {
    const extra = mode === 'hiragana' ? (kana.hiragana_dakuten || []) : (kana.katakana_dakuten || [])
    list = list.concat(extra)
  }
  if (options.combination) {
    const extra = mode === 'hiragana' ? (kana.hiragana_combination || []) : (kana.katakana_combination || [])
    list = list.concat(extra)
  }
  return list
}

export default function Quiz({ kana, quizOptions }) {
  const [mode, setMode] = useState('hiragana')
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [flashClass, setFlashClass] = useState('')
  const [hintLevel, setHintLevel] = useState(0)

  const shuffledList = useMemo(() => {
    const list = buildKanaList(kana, mode, quizOptions)
    return shuffleArray(list)
  }, [mode, kana, quizOptions])

  const current = shuffledList[index]
  const total = shuffledList.length

  const hintOrder = useMemo(
    () => (current ? getHintRevealOrder(current.romaji) : []),
    [current?.char]
  )

  useEffect(() => {
    setHintLevel(0)
  }, [current?.char])

  const hintDisplay = useMemo(() => {
    if (!current || hintLevel === 0) return null
    const word = current.romaji
    const revealed = new Set(hintOrder.slice(0, hintLevel))
    return word.split('').map((c, i) => (revealed.has(i) ? c : '_')).join('')
  }, [current, hintLevel, hintOrder])

  const check = useCallback(() => {
    if (!current) return
    const ok = romajiEqual(input, current.romaji)
    
    if (ok) {
      setFlashClass('flash-correct')
      setTimeout(() => {
        setInput('')
        setFlashClass('')
        setHintLevel(0)
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
    setHintLevel(0)
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
        <div className="quiz-hint-row">
          <button
            type="button"
            className="quiz-hint-button"
            onClick={() => setHintLevel((l) => Math.min(l + 1, current.romaji.length))}
          >
            Hint
          </button>
          {hintDisplay != null && (
            <span className="quiz-hint-display">{hintDisplay}</span>
          )}
        </div>
      </div>
    </div>
  )
}
