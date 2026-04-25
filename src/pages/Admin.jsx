import { useState, useEffect } from 'react'
import { supabase, getFlagUrl } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Admin() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [matches, setMatches] = useState([])
  const [initialLoad, setInitialLoad] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [scores, setScores] = useState({})
  const [editing, setEditing] = useState({})

  useEffect(() => {
    if (!isAdmin) navigate('/')
    fetchMatches()
  }, [location])

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true })

    setMatches(data || [])
    setInitialLoad(false)
  }

  const handleScoreChange = (matchId, field, value) => {
    setScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value
      }
    }))
  }

  const handleStartEdit = (match) => {
    setEditing(prev => ({ ...prev, [match.id]: true }))
    setScores(prev => ({
      ...prev,
      [match.id]: {
        home_score: match.home_score ?? '',
        away_score: match.away_score ?? ''
      }
    }))
  }

  const handleCancelEdit = (matchId) => {
    setEditing(prev => ({ ...prev, [matchId]: false }))
    setScores(prev => {
      const next = { ...prev }
      delete next[matchId]
      return next
    })
  }

  const handleUpdateResult = async (match) => {
    const score = scores[match.id]

    console.log('=== DEBUG ===')
    console.log('match.id:', match.id)
    console.log('scores completo:', scores)
    console.log('score para este partido:', score)
    console.log('home_score:', score?.home_score, '| tipo:', typeof score?.home_score)
    console.log('away_score:', score?.away_score, '| tipo:', typeof score?.away_score)
    console.log('=============')

    if (
      !score ||
      score.home_score === undefined ||
      score.home_score === '' ||
      score.away_score === undefined ||
      score.away_score === ''
    ) {
      alert('Ingresá ambos scores antes de guardar')
      return
    }

    setUpdating(match.id)

    const homeScore = parseInt(score.home_score)
    const awayScore = parseInt(score.away_score)

    console.log('homeScore parseado:', homeScore)
    console.log('awayScore parseado:', awayScore)
    console.log('Intentando actualizar match id:', match.id)

    // 1. Si el partido ya estaba finished, resetear puntos primero
    if (match.status === 'finished') {
      console.log('Partido ya finalizado — reseteando puntos...')
      const { error: resetError } = await supabase.rpc('reset_match_points', {
        match_id_input: match.id
      })
      if (resetError) {
        console.error('Error reseteando puntos:', resetError)
        alert('Error al resetear puntos: ' + resetError.message)
        setUpdating(null)
        return
      }
      console.log('✅ Puntos reseteados correctamente')
    }

    // 2. Actualizar resultado en matches
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: 'finished'
      })
      .eq('id', match.id)
      .select()

    console.log('Respuesta update matches:', matchData, matchError)

    if (matchError) {
      console.error('Error actualizando partido:', matchError)
      alert('Error al guardar: ' + matchError.message)
      setUpdating(null)
      return
    }

    // 3. Obtener predicciones del partido
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', match.id)

    console.log('Predicciones encontradas:', predictions, predError)

    if (predError) {
      console.error('Error obteniendo predicciones:', predError)
      setUpdating(null)
      return
    }

    // 4. Calcular y asignar puntos
    for (const pred of predictions || []) {
      let points = 0

      const realOutcome =
        homeScore > awayScore ? 'home' :
        awayScore > homeScore ? 'away' : 'draw'

      const predOutcome =
        pred.home_score > pred.away_score ? 'home' :
        pred.away_score > pred.home_score ? 'away' : 'draw'

      console.log(`Predicción de ${pred.user_id}: ${pred.home_score}-${pred.away_score} | Real: ${homeScore}-${awayScore}`)
      console.log(`Outcome real: ${realOutcome} | Outcome pred: ${predOutcome}`)

      if (realOutcome === predOutcome) {
        points += 1
        if (pred.home_score === homeScore && pred.away_score === awayScore) {
          points += 2
        }
      }

      console.log(`Puntos a asignar: ${points}`)

      if (points > 0) {
        const { error: rpcError } = await supabase.rpc('increment_points', {
          user_id_input: pred.user_id,
          points_input: points
        })
        if (rpcError) {
          console.error('Error RPC increment_points:', rpcError)
        } else {
          console.log(`✅ Puntos incrementados para ${pred.user_id}: +${points}`)
        }
      }
    }

    console.log('✅ Resultado guardado correctamente')
    setEditing(prev => ({ ...prev, [match.id]: false }))
    setUpdating(null)
    fetchMatches()
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

  if (initialLoad) return (
    <div className="main-container">
      <p style={{ color: 'var(--text-muted)' }}>Cargando partidos...</p>
    </div>
  )

  return (
    <div className="main-container">
      <div className="page-header">
        <h1>⚙️ Panel de Administración</h1>
        <p>Cargá los resultados de cada partido</p>
      </div>

      {matches.map(match => (
        <div key={match.id} className="match-card">

          {/* Header con equipos */}
          <div className="match-header">
            <div className="match-teams">
              {getFlagUrl(match.home_flag) && (
                <img
                  src={getFlagUrl(match.home_flag)}
                  alt={match.home_team}
                  style={{ width: '24px', height: 'auto', marginRight: '6px' }}
                />
              )}
              <span>{match.home_team}</span>
              <span className="match-vs">vs</span>
              {getFlagUrl(match.away_flag) && (
                <img
                  src={getFlagUrl(match.away_flag)}
                  alt={match.away_team}
                  style={{ width: '24px', height: 'auto', marginRight: '6px' }}
                />
              )}
              <span>{match.away_team}</span>
            </div>
            {match.status === 'finished' && !editing[match.id] && (
              <span className="badge badge-saved">✓ Finalizado</span>
            )}
          </div>

          {/* Fecha y resultado actual */}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
            📅 {formatDate(match.match_date)}
            {match.status === 'finished' && (
              <span style={{ marginLeft: '1rem', color: 'var(--gold)' }}>
                Resultado actual: {match.home_score} - {match.away_score}
              </span>
            )}
          </div>

          {/* Partido no finalizado — formulario normal */}
          {match.status !== 'finished' && (
            <div className="prediction-row">
              <div className="score-input">
                <input
                  type="number"
                  min="0"
                  max="20"
                  placeholder="0"
                  value={scores[match.id]?.home_score ?? ''}
                  onChange={(e) => handleScoreChange(match.id, 'home_score', e.target.value)}
                />
                <span className="score-separator">-</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  placeholder="0"
                  value={scores[match.id]?.away_score ?? ''}
                  onChange={(e) => handleScoreChange(match.id, 'away_score', e.target.value)}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={() => handleUpdateResult(match)}
                disabled={updating === match.id}
              >
                {updating === match.id ? 'Guardando...' : 'Cargar Resultado'}
              </button>
            </div>
          )}

          {/* Partido finalizado — botón para editar */}
          {match.status === 'finished' && !editing[match.id] && (
            <div style={{ marginTop: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => handleStartEdit(match)}
              >
                ✏️ Corregir Resultado
              </button>
            </div>
          )}

          {/* Modo edición — partido ya finalizado */}
          {match.status === 'finished' && editing[match.id] && (
            <div className="prediction-row" style={{ marginTop: '0.5rem' }}>
              <div className="score-input">
                <input
                  type="number"
                  min="0"
                  max="20"
                  placeholder="0"
                  value={scores[match.id]?.home_score ?? ''}
                  onChange={(e) => handleScoreChange(match.id, 'home_score', e.target.value)}
                />
                <span className="score-separator">-</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  placeholder="0"
                  value={scores[match.id]?.away_score ?? ''}
                  onChange={(e) => handleScoreChange(match.id, 'away_score', e.target.value)}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={() => handleUpdateResult(match)}
                disabled={updating === match.id}
              >
                {updating === match.id ? 'Guardando...' : '💾 Guardar Corrección'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleCancelEdit(match.id)}
                disabled={updating === match.id}
                style={{ marginLeft: '0.5rem' }}
              >
                Cancelar
              </button>
            </div>
          )}

        </div>
      ))}
    </div>
  )
}

