import { useState } from 'react'
import { supabase, getFlagUrl } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function PredictionForm({ match, existingPrediction, onSaved }) {
  const { user } = useAuth()
  const [homeScore, setHomeScore] = useState(existingPrediction?.home_score ?? '')
  const [awayScore, setAwayScore] = useState(existingPrediction?.away_score ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isLocked = () => {
    const matchTime = new Date(match.match_date)
    const now = new Date()
    const diffMinutes = (matchTime - now) / (1000 * 60)
    return diffMinutes <= 30 || match.status === 'finished'
  }

  const locked = isLocked()
  const finished = match.status === 'finished'

  const getLockMessage = () => {
    if (finished) return null // lo manejamos aparte abajo
    const matchTime = new Date(match.match_date)
    const now = new Date()
    const diffMinutes = Math.round((matchTime - now) / (1000 * 60))
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
      ? await supabase.from('predictions').update(payload).eq('id', existingPrediction.id)
      : await supabase.from('predictions').insert(payload)

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

  const getPointsDisplay = () => {
    if (!finished) return null
    if (!existingPrediction) return null

    const pts = existingPrediction.points

    if (pts === 3) return { label: '⚽ ¡Exacto! +3 pts', className: 'points-exact' }
    if (pts === 1) return { label: '✓ Resultado correcto +1 pt', className: 'points-result' }
    if (pts === 0) return { label: '✗ Sin puntos', className: 'points-none' }

    // puntos null = aún no calculados
    return { label: '⏳ Puntos pendientes', className: 'points-pending' }
  }

  const lockMessage = getLockMessage()
  const pointsDisplay = getPointsDisplay()

  return (
    <div className={`match-card ${locked ? 'match-card-locked' : ''} ${finished ? 'match-card-finished' : ''}`}>

      {/* Header */}
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
          {lockMessage && <span className="badge badge-locked">{lockMessage}</span>}
          {saved && <span className="badge badge-saved">✓ Guardado</span>}
        </div>
      </div>

      {/* Fecha */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
        📅 {formatDate(match.match_date)}
      </div>

      {/* Partido finalizado: mostrar resultado + pronóstico + puntos */}
      {finished ? (
        <div className="finished-result">

          <div className="finished-scores">
            <div className="finished-col">
              <span className="finished-label">Resultado final</span>
              <span className="finished-score">
                {match.home_score ?? '?'} - {match.away_score ?? '?'}
              </span>
            </div>

            <div className="finished-divider" />

            <div className="finished-col">
              <span className="finished-label">Tu pronóstico</span>
              <span className="finished-score" style={{ color: 'var(--gold)' }}>
                {existingPrediction
                  ? `${existingPrediction.home_score} - ${existingPrediction.away_score}`
                  : '—'}
              </span>
            </div>
          </div>

          {pointsDisplay && (
            <div className={`points-badge ${pointsDisplay.className}`}>
              {pointsDisplay.label}
            </div>
          )}

          {!existingPrediction && (
            <div className="points-badge points-none">
              Sin pronóstico cargado
            </div>
          )}

        </div>
      ) : (
        /* Partido no finalizado: inputs normales */
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
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              Tu pronóstico: {existingPrediction.home_score} - {existingPrediction.away_score}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
