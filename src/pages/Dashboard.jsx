import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatearFechaLarga, isPredictionLocked } from '../utils/dateUtils'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState({})
  const [prodeStatus, setProdeStatus] = useState('open')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)

      const [{ data: matchesData }, { data: settingsData }, { data: predsData }] = await Promise.all([
        supabase.from('matches').select('*').order('match_date', { ascending: true }),
        supabase.from('settings').select('*').eq('key', 'prode_status').maybeSingle(),
        supabase.from('predictions').select('*').eq('user_id', user.id)
      ])

      setMatches(matchesData || [])
      setProdeStatus(settingsData?.value || 'open')

      const predMap = {}
      ;(predsData || []).forEach((p) => {
        predMap[p.match_id] = p
      })
      setPredictions(predMap)
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los partidos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [user])

  const handleSavePrediction = async (matchId, homeScore, awayScore) => {
    try {
      setSaving(true)
      setError('')
      setMessage('')

      const match = matches.find(m => m.id === matchId)
      if (!match) throw new Error('Partido no encontrado')
      if (isPredictionLocked(match.match_date)) throw new Error('Este partido ya está bloqueado')

      const { error } = await supabase.from('predictions').upsert({
        user_id: user.id,
        match_id: matchId,
        home_score: Number(homeScore),
        away_score: Number(awayScore)
      }, { onConflict: 'user_id,match_id' })

      if (error) throw error

      setMessage('Pronóstico guardado')
      await fetchData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo guardar la predicción')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="main-container">Cargando...</div>

  return (
    <div className="main-container">
      <div className="page-header">
        <h1>Mi Prode</h1>
        <p>Hola {profile?.username || user.email}</p>
      </div>

      {prodeStatus === 'closed' && (
        <div className="auth-error">
          El prode está cerrado temporalmente.
        </div>
      )}

      {error && <div className="auth-error">{error}</div>}
      {message && <div className="auth-success">{message}</div>}

      <div className="points-banner">
        <strong>Puntaje:</strong> 3 puntos por exacto, 1 por resultado correcto.
      </div>

      <div className="matches-grid">
        {matches.map((match) => {
          const pred = predictions[match.id]
          const locked = isPredictionLocked(match.match_date) || prodeStatus === 'closed'

          return (
            <div key={match.id} className="match-card">
              <h3>{match.home_team} vs {match.away_team}</h3>
              <p>{formatearFechaLarga(match.match_date)}</p>
              <p>Grupo {match.group_name}</p>

              {match.status === 'finished' && (
                <p>Resultado: {match.home_score} - {match.away_score}</p>
              )}

              {locked ? (
                <p className="locked-text">Predicción bloqueada</p>
              ) : (
                <PredictionMiniForm
                  initialHome={pred?.home_score ?? ''}
                  initialAway={pred?.away_score ?? ''}
                  onSave={(home, away) => handleSavePrediction(match.id, home, away)}
                  disabled={saving}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PredictionMiniForm({ initialHome, initialAway, onSave, disabled }) {
  const [home, setHome] = useState(initialHome)
  const [away, setAway] = useState(initialAway)

  return (
    <div className="prediction-mini">
      <input type="number" min="0" max="20" value={home} onChange={(e) => setHome(e.target.value)} />
      <span>-</span>
      <input type="number" min="0" max="20" value={away} onChange={(e) => setAway(e.target.value)} />
      <button
        className="btn btn-primary"
        onClick={() => onSave(home, away)}
        disabled={disabled}
      >
        Guardar
      </button>
    </div>
  )
}


