import { useState } from 'react'
import './QuizOptions.css'

export default function QuizOptions({ onStart }) {
  const [dakuten, setDakuten] = useState(false)
  const [combination, setCombination] = useState(false)

  return (
    <div className="quiz-options">
      <div className="quiz-options-card">
        <h2 className="quiz-options-title">Practice Quiz</h2>
        <p className="quiz-options-subtitle">Choose which kana to include</p>
        <div className="quiz-options-checkboxes">
          <label className="quiz-options-label">
            <input
              type="checkbox"
              checked={dakuten}
              onChange={(e) => setDakuten(e.target.checked)}
            />
            <span>Include dakuten (e.g. が, ざ, だ, ば, ぱ)</span>
          </label>
          <label className="quiz-options-label">
            <input
              type="checkbox"
              checked={combination}
              onChange={(e) => setCombination(e.target.checked)}
            />
            <span>Include combination kana (e.g. きゃ, しゅ, ちゃ)</span>
          </label>
        </div>
        <button
          type="button"
          className="quiz-options-start"
          onClick={() => onStart(dakuten, combination)}
        >
          Start quiz
        </button>
      </div>
    </div>
  )
}
