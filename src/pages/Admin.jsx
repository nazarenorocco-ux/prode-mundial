import { useState, useEffect } from 'react'
import { supabase, getFlagUrl } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Admin() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('results')
  const [matches, setMatches] = useState([])
  const [initialLoad, setInitialLoad] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [scores, setScores] = useState({})
  const [editing, setEditing] = useState({})

  // --- Jugadores ---
  const [players, setPlayers] = useState([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [deletingPlayer, setDeletingPlayer] = useState(null)
  const [confirmingPlayer, setConfirmingPlayer] = useState(null)

  useEffect(() => {
    if (!isAdmin) navigate('/')
    fetchMatches()
  }, [location])

  useEffect(() => {
    if (activeTab === 'players') fetchPlayers()
  }, [activeTab])

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true })

    setMatches(data || [])
    setInitialLoad(false)
  }

  const fetchPlayers = async () => {
    setLoadingPlayers(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, points, status, created_at')
      .order('created_at', { ascending: false })

    setPlayers(data || [])
    setLoadingPlayers(false)
  }

  const handleConfirmPayment = async (player) => {
    const ok = window.confirm(
      `¿Confirmar el pago en efectivo de "${player.username}"?`
    )
    if (!ok) return

    setConfirmingPlayer(player.id)

    const { error } = await supabase
      .from('profiles')
      .update({ status: 'activo' })
      .eq('id', player.id)

    if (error) {
      alert('Error al confirmar pago: ' + error.message)
    }

    setConfirmingPlayer(null)
    fetchPlayers()
  }

  const handleDeletePlayer = async (player) => {
    const ok = window.confirm(
      `¿Seguro que querés eliminar a "${player.username}"?\nEsto eliminará su cuenta y todas sus predicciones.`
    )
    if (!ok) return

    setDeletingPlayer(player.id)

    await supabase
      .from('predictions')
      .delete()
      .eq('user_id', player.id)

    await supabase
      .from('profiles')
      .delete()
      .eq('id', player.id)

    const { error } = await supabase.rpc('delete_user', {
      user_id: player.id
    })

    if (error) {
      console.error('Error eliminando usuario de auth:', error)
    }

    setDeletingPlayer(null)
    fetchPlayers()
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

    const { error: matchError } = await supabase
      .from('matches')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: 'finished'
      })
      .eq('id', match.id)

    if (matchError) {
      alert('Error al guardar: ' + matchError.message)
      setUpdating(null)
      return
    }

    const { error: pointsError } = await supabase.rpc('calculate_points')

    if (pointsError) {
      alert('Error al calcular puntos: ' + pointsError.message)
    }

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

  // Contadores para el tab
  const activePlayers = players.filter(p => p.status === 'activo').length
  const pendingPlayers = players.filter(p => p.status === 'pendiente').length

  if (initialLoad) return (
    <div className="main-container">
      <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
    </div>
  )

  return (
    <div className="main-container">
      <div className="page-header">
        <h1>⚙️ Panel de Administración</h1>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '2px solid var(--border)',
        paddingBottom: '0'
      }}>
        <button
          onClick={() => setActiveTab('results')}
          style={{
            padding: '0.6rem 1.2rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'results' ? '700' : '400',
            color: activeTab === 'results' ? 'var(--gold)' : 'var(--text-muted)',
            borderBottom: activeTab === 'results' ? '2px solid var(--gold)' : '2px solid transparent',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          ⚽ Resultados
        </button>
        <button
          onClick={() => setActiveTab('players')}
          style={{
            padding: '0.6rem 1.2rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'players' ? '700' : '400',
            color: activeTab === 'players' ? 'var(--gold)' : 'var(--text-muted)',
            borderBottom: activeTab === 'players' ? '2px solid var(--gold)' : '2px solid transparent',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          👥 Jugadores ({players.length})
        </button>
      </div>

      {/* Tab: Resultados */}
      {activeTab === 'results' && (
        <>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Cargá los resultados de cada partido
          </p>
          {matches.map(match => (
            <div key={match.id} className="match-card">

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

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                📅 {formatDate(match.match_date)}
                {match.status === 'finished' && (
                  <span style={{ marginLeft: '1rem', color: 'var(--gold)' }}>
                    Resultado actual: {match.home_score} - {match.away_score}
                  </span>
                )}
              </div>

              {match.status !== 'finished' && (
                <div className="prediction-row">
                  <div className="score-input">
                    <input
                      type="number" min="0" max="20" placeholder="0"
                      value={scores[match.id]?.home_score ?? ''}
                      onChange={(e) => handleScoreChange(match.id, 'home_score', e.target.value)}
                    />
                    <span className="score-separator">-</span>
                    <input
                      type="number" min="0" max="20" placeholder="0"
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

              {match.status === 'finished' && !editing[match.id] && (
                <div style={{ marginTop: '0.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => handleStartEdit(match)}>
                    ✏️ Corregir Resultado
                  </button>
                </div>
              )}

              {match.status === 'finished' && editing[match.id] && (
                <div className="prediction-row" style={{ marginTop: '0.5rem' }}>
                  <div className="score-input">
                    <input
                      type="number" min="0" max="20" placeholder="0"
                      value={scores[match.id]?.home_score ?? ''}
                      onChange={(e) => handleScoreChange(match.id, 'home_score', e.target.value)}
                    />
                    <span className="score-separator">-</span>
                    <input
                      type="number" min="0" max="20" placeholder="0"
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
        </>
      )}

      {/* Tab: Jugadores */}
      {activeTab === 'players' && (
        <>
          {/* Resumen de estados */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{
              background: '#22c55e22',
              border: '1px solid #22c55e44',
              borderRadius: '10px',
              padding: '0.6rem 1rem',
              fontSize: '0.9rem',
              color: '#22c55e',
              fontWeight: '600'
            }}>
              ✅ Activos: {activePlayers}
            </div>
            <div style={{
              background: '#f59e0b22',
              border: '1px solid #f59e0b44',
              borderRadius: '10px',
              padding: '0.6rem 1rem',
              fontSize: '0.9rem',
              color: '#f59e0b',
              fontWeight: '600'
            }}>
              ⏳ Pendientes: {pendingPlayers}
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {players.length} jugadores registrados en total
          </p>

          {loadingPlayers ? (
            <p style={{ color: 'var(--text-muted)' }}>Cargando jugadores...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {players.map(player => (
                <div
                  key={player.id}
                  className="match-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.8rem 1rem',
                    borderLeft: `4px solid ${player.status === 'activo' ? '#22c55e' : '#f59e0b'}`
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      👤 {player.username || 'Sin nombre'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      🏆 {player.points} pts · Registrado: {formatDate(player.created_at)}
                    </div>
                    <div style={{ marginTop: '0.4rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        background: player.status === 'activo' ? '#22c55e22' : '#f59e0b22',
                        color: player.status === 'activo' ? '#22c55e' : '#f59e0b',
                        fontWeight: '600'
                      }}>
                        {player.status === 'activo' ? '✅ Pago confirmado' : '⏳ Pago pendiente'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {player.status === 'pendiente' && (
                      <button
                        onClick={() => handleConfirmPayment(player)}
                        disabled={confirmingPlayer === player.id}
                        style={{
                          background: '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.4rem 0.8rem',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          opacity: confirmingPlayer === player.id ? 0.6 : 1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {confirmingPlayer === player.id ? 'Confirmando...' : '💵 Confirmar pago'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePlayer(player)}
                      disabled={deletingPlayer === player.id}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.4rem 0.8rem',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        opacity: deletingPlayer === player.id ? 0.6 : 1,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {deletingPlayer === player.id ? 'Eliminando...' : '🗑️ Eliminar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  )
}
