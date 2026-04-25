import { useState } from 'react'
import { supabase, getFlagUrl } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function PredictionForm({ match, existingPrediction, onSaved }) {
  const { user } = useAuth()
  const [homeScore, setHomeScore] = useState(existingPrediction?.home_score ?? '')
  const [awayScore, setAwayScore] = useState(existingPrediction?.away_score ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Calcular si está bloqueado directamente acá
  const isLocked = () => {
    const matchTime = new Date(match.match_date)
    const now = new Date()
    const diffMs = matchTime - now
    const diffMinutes = diffMs / (1000 * 60)
    return diffMinutes <= 30 || match.status === 'finished'
  }

  const locked = isLocked()

  const getLockMessage = () => {
    if (match.status === 'finished') return '🔒 Partido finalizado'
    const matchTime = new Date(match.match_date)
    const now = new Date()
    const diffMs = matchTime - now
    const diffMinutes = Math.round(diffMs / (1000 * 60))
    if (diffMinutes <= 0) return '🔒 Partido en curso'
    if (diffMinutes <= 30) return `🔒 Cierra en ${diffMinutes} min`
    return null
  }

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
    if (locked) return
    if (homeScore === '' || awayScore === '') return
    setSaving(true)

    const payload = {
      user_id: user.id,
      match_id: match.id,
      home_score: parseInt(homeScore),
      away_score: parseInt(awayScore)
    }

    const { error } = existingPrediction
      ? await supabase
          .from('predictions')
          .update(payload)
          .eq('id', existingPrediction.id)
      : await supabase
          .from('predictions')
          .insert(payload)

    if (error) {
      alert(error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onSaved()
  }

  const lockMessage = getLockMessage()

  return (
    <div className={`match-card ${locked ? 'match-card-locked' : ''}`}>
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
          {lockMessage && (
            <span className="badge badge-locked">{lockMessage}</span>
          )}
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

        {!locked && (
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || homeScore === '' || awayScore === ''}
          >
            {saving ? 'Guardando...' : existingPrediction ? 'Actualizar' : 'Guardar'}
          </button>
        )}

        {locked && existingPrediction && (
          <div style={{
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
            fontWeight: '600'
          }}>
            Tu pronóstico: {existingPrediction.home_score} - {existingPrediction.away_score}
          </div>
        )}
      </div>
    </div>
  )
}
