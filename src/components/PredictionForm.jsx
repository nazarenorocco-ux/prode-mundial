import { useState } from 'react'
import { supabase, getFlagUrl } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function PredictionForm({ match, existingPrediction, locked, onSaved }) {
  const { user } = useAuth()
  const [homeScore, setHomeScore] = useState(existingPrediction?.home_score ?? '')
  const [awayScore, setAwayScore] = useState(existingPrediction?.away_score ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSave = async () => {
    if (homeScore === '' || awayScore === '') return
    setSaving(true)

    const payload = {
      user_id: user.id,
      match_id: match.id,
      home_score: parseInt(homeScore),
      away_score: parseInt(awayScore)
    }

    if (existingPrediction) {
      await supabase
        .from('predictions')
        .update(payload)
        .eq('id', existingPrediction.id)
    } else {
      await supabase
        .from('predictions')
        .insert(payload)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onSaved()
  }

  return (
    <div className="match-card">
      <div className="match-header">
        <div className="match-teams">
          <span>
            <img
              src={getFlagUrl(match.home_flag)}
              alt={match.home_team}
              style={{ width: '24px', marginRight: '6px', verticalAlign: 'middle' }}
            />
            {match.home_team}
          </span>
          <span className="match-vs">vs</span>
          <span>
            <img
              src={getFlagUrl(match.away_flag)}
              alt={match.away_team}
              style={{ width: '24px', marginRight: '6px', verticalAlign: 'middle' }}
            />
            {match.away_team}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {locked && <span className="badge badge-locked">🔒 Cerrado</span>}
          {saved && <span className="badge badge-saved">✓ Guardado</span>}
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
        📅 {formatDate(match.match_date)}
      </div>

      <div className="prediction-row">
        <div className="score-input">
          <input
            type="number"
            min="0"
            max="20"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            disabled={locked}
            placeholder="0"
          />
          <span className="score-separator">-</span>
          <input
            type="number"
            min="0"
            max="20"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            disabled={locked}
            placeholder="0"
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={locked || saving || homeScore === '' || awayScore === ''}
        >
          {saving ? 'Guardando...' : existingPrediction ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
