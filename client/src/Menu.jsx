import './Menu.css'

export default function Menu({ onSelectMode }) {
  return (
    <div className="menu">
      <h2 className="menu-title">Select Mode</h2>
      <div className="menu-buttons">
        <button className="menu-button" onClick={() => onSelectMode('quiz')}>
          Practice Quiz
        </button>
        <button className="menu-button" onClick={() => onSelectMode('versus')}>
          Versus
        </button>
        <button className="menu-button" onClick={() => onSelectMode('timetrial')}>
          Time Trial
        </button>
      </div>
    </div>
  )
}
