import { useState } from 'react'
import { supabase, getFlagUrl } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function PredictionForm({ match, existingPrediction, onSaved }) {
  const { user } = useAuth()
  const [homeScore, setHomeScore] = useState(
    existingPrediction?.home_score ?? ''
  )
  const [awayScore, setAwayScore] = useState(
    existingPrediction?.away_score ?? ''
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [inputError, setInputError] = useState('')

  const finished = match.status === 'finished'

  // Minutos hasta el partido — negativo si ya empezó
  const minutesUntilMatch =
    (new Date(match.match_date) - new Date()) / (1000 * 60)
  const locked = minutesUntilMatch <= 30 || finished

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Fecha por confirmar'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Fecha por confirmar'
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getLockMessage = () => {
    if (finished) return null
    if (minutesUntilMatch <= 0) return '🔒 Partido en curso'
    if (minutesUntilMatch <= 30)
      return `🔒 Cierra en ${Math.round(minutesUntilMatch)} min`
    return null
  }

  const getPointsDisplay = () => {
    if (!finished || !existingPrediction) return null

    const pts = existingPrediction.points

    // pts null/undefined = aún no calculados
    if (pts == null)
      return { label: '⏳ Puntos pendientes', className: 'points-pending' }
    if (pts === 3)
      return { label: '⚽ ¡Exacto! +3 pts', className: 'points-exact' }
    if (pts === 1)
      return { label: '✓ Resultado correcto +1 pt', className: 'points-result' }
    return { label: '✗ Sin puntos', className: 'points-none' }
  }

  const validateScores = (home, away) => {
    if (home === '' || away === '') return 'Ingresá ambos scores'
    const h = parseInt(home)
    const a = parseInt(away)
    if (isNaN(h) || isNaN(a)) return 'Los scores deben ser números'
    if (h < 0 || a < 0) return 'Los scores no pueden ser negativos'
    if (h > 20 || a > 20) return 'Los scores no pueden superar 20'
    return null
  }

  const handleSave = async () => {
    if (locked) return

    setInputError('')
    const validationError = validateScores(homeScore, awayScore)
    if (validationError) {
      setInputError(validationError)
      return
    }

    setSaving(true)

    const payload = {
      user_id:    user.id,
      match_id:   match.id,
      home_score: parseInt(homeScore),
      away_score: parseInt(awayScore)
    }

    const { error } = existingPrediction
      ? await supabase
          .from('predictions')
          .update(payload)
          .eq('id', existingPrediction.id)
      : await supabase.from('predictions').insert(payload)

    setSaving(false)

    if (error) {
      setInputError(error.message)
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onSaved()
  }

  const lockMessage    = getLockMessage()
  const pointsDisplay  = getPointsDisplay()

  return (
    <div
      className={[
        'match-card',
        locked   ? 'match-card-locked'   : '',
        finished ? 'match-card-finished' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* ── Header ── */}
      <div className="match-header">
        <div className="match-teams">
          <span>
            {match.home_flag && (
              <img
                src={getFlagUrl(match.home_flag)}
                alt={match.home_team}
                className="flag-img"
              />
            )}
            {match.home_team}
          </span>
          <span className="match-vs">vs</span>
          <span>
            {match.away_flag && (
              <img
                src={getFlagUrl(match.away_flag)}
                alt={match.away_team}
                className="flag-img"
              />
            )}
            {match.away_team}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {lockMessage && (
            <span className="badge badge-locked">{lockMessage}</span>
          )}
          {saved && (
            <span className="badge badge-saved">✓ Guardado</span>
          )}
        </div>
      </div>

      {/* ── Fecha ── */}
      <div
        style={{
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          marginBottom: '0.8rem'
        }}
      >
        📅 {formatDate(match.match_date)}
      </div>

      {/* ── Error de validación ── */}
      {inputError && (
        <div
          style={{
            fontSize: '0.82rem',
            color: 'var(--error)',
            marginBottom: '0.5rem',
            fontWeight: '600'
          }}
        >
          ⚠️ {inputError}
        </div>
      )}

      {/* ── Partido finalizado: resultado + pronóstico + puntos ── */}
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
              <span
                className="finished-score"
                style={{ color: 'var(--gold)' }}
              >
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
        /* ── Partido no finalizado: inputs de predicción ── */
        <div className="prediction-row">
          <div className="score-input">
            <input
              type="number"
              min="0"
              max="20"
              value={homeScore}
              onChange={(e) => {
                setInputError('')
                setHomeScore(e.target.value)
              }}
              disabled={locked}
              placeholder="0"
            />
            <span className="score-separator">-</span>
            <input
              type="number"
              min="0"
              max="20"
              value={awayScore}
              onChange={(e) => {
                setInputError('')
                setAwayScore(e.target.value)
              }}
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
              {saving
                ? 'Guardando...'
                : existingPrediction
                  ? 'Actualizar'
                  : 'Guardar'}
            </button>
          )}

          {locked && existingPrediction && (
            <div
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
                fontWeight: '600'
              }}
            >
              Tu pronóstico:{' '}
              {existingPrediction.home_score} - {existingPrediction.away_score}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
