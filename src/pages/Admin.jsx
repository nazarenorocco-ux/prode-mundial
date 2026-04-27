import { useState, useEffect } from 'react'
import { supabase, getFlagUrl } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Admin() {
  const { isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab]     = useState('results')
  const [matches, setMatches]         = useState([])
  const [initialLoad, setInitialLoad] = useState(true)
  const [updating, setUpdating]       = useState(null)
  const [scores, setScores]           = useState({})
  const [editing, setEditing]         = useState({})

  // Jugadores
  const [players, setPlayers]                 = useState([])
  const [loadingPlayers, setLoadingPlayers]   = useState(false)
  const [deletingPlayer, setDeletingPlayer]   = useState(null)
  const [confirmingPlayer, setConfirmingPlayer] = useState(null)
  const [togglingAdmin, setTogglingAdmin]     = useState(null)

  useEffect(() => {
    if (loading) return
    if (!isAdmin) {
      navigate('/')
      return
    }
    fetchMatches()
  }, [loading, isAdmin])

  useEffect(() => {
    if (activeTab === 'players') fetchPlayers()
  }, [activeTab])

  // ── Fetch ──────────────────────────────────────────────────────────────

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
      .select('id, username, email, points, status, payment_method, created_at, is_admin')
      .order('created_at', { ascending: false })

    setPlayers(data || [])
    setLoadingPlayers(false)
  }

  // ── Acciones sobre jugadores ───────────────────────────────────────────

  const handleConfirmPayment = async (player) => {
    const ok = window.confirm(
      `¿Confirmar el pago en efectivo de "${player.username}"?`
    )
    if (!ok) return

    setConfirmingPlayer(player.id)

    const { error } = await supabase
      .from('profiles')
      .update({ status: 'activo', payment_method: 'manual' })
      .eq('id', player.id)

    if (error) {
      alert('Error al confirmar pago: ' + error.message)
    } else {
      setPlayers(prev =>
        prev.map(p =>
          p.id === player.id
            ? { ...p, status: 'activo', payment_method: 'manual' }
            : p
        )
      )
    }

    setConfirmingPlayer(null)
  }

  const handleDeletePlayer = async (player) => {
    const ok = window.confirm(
      `¿Seguro que querés eliminar a "${player.username}"?\n` +
      `Esto eliminará su cuenta y todas sus predicciones.`
    )
    if (!ok) return

    setDeletingPlayer(player.id)

    try {
      const { error: predError } = await supabase
        .from('predictions')
        .delete()
        .eq('user_id', player.id)

      if (predError) throw new Error('Error borrando predicciones: ' + predError.message)

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', player.id)

      if (profileError) throw new Error('Error borrando perfil: ' + profileError.message)

      // Borrar de auth.users (requiere RPC con service role en Supabase)
      const { error: authError } = await supabase.rpc('delete_user', {
        user_id: player.id
      })

      if (authError) {
        // No es fatal: el perfil fue borrado, solo notificar en consola
        console.warn('No se pudo borrar el usuario de auth:', authError.message)
      }

      // Actualizar lista local sin refetch
      setPlayers(prev => prev.filter(p => p.id !== player.id))

    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingPlayer(null)
    }
  }

  const handleToggleAdmin = async (player) => {
    const action = player.is_admin ? 'quitarle el rol de admin' : 'hacer admin'
    const ok = window.confirm(
      `¿Seguro que querés ${action} a "${player.username}"?`
    )
    if (!ok) return

    setTogglingAdmin(player.id)

    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !player.is_admin })
      .eq('id', player.id)

    if (error) {
      alert('Error al actualizar: ' + error.message)
    } else {
      setPlayers(prev =>
        prev.map(p =>
          p.id === player.id ? { ...p, is_admin: !p.is_admin } : p
        )
      )
    }

    setTogglingAdmin(null)
  }

  // ── Acciones sobre resultados ──────────────────────────────────────────

  const handleScoreChange = (matchId, field, value) => {
    setScores(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: value }
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
      score.home_score === '' ||
      score.home_score === undefined ||
      score.away_score === '' ||
      score.away_score === undefined
    ) {
      alert('Ingresá ambos scores antes de guardar')
      return
    }

    setUpdating(match.id)

    const homeScore = parseInt(score.home_score)
    const awayScore = parseInt(score.away_score)

    const { error: matchError } = await supabase
      .from('matches')
      .update({ home_score: homeScore, away_score: awayScore, status: 'finished' })
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

  // ── Helpers ────────────────────────────────────────────────────────────

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPaymentMethodBadge = (method) => {
    const styles = {
      mercadopago: {
        background: '#009ee322',
        color: '#009ee3',
        label: '💳 MercadoPago'
      },
      manual: {
        background: '#6c757d22',
        color: '#adb5bd',
        label: '💵 Efectivo'
      },
      default: {
        background: '#ffffff11',
        color: 'var(--text-muted)',
        label: '— Sin registrar'
      }
    }

    const s = styles[method] || styles.default

    return (
      <span className="admin-payment-badge" style={{ background: s.background, color: s.color }}>
        {s.label}
      </span>
    )
  }

  // ── Métricas ───────────────────────────────────────────────────────────

  const activePlayers  = players.filter(p => p.status === 'activo').length
  const pendingPlayers = players.filter(p => p.status === 'pendiente').length
  const mpPlayers      = players.filter(p => p.payment_method === 'mercadopago').length
  const manualPlayers  = players.filter(p => p.payment_method === 'manual').length

  // ── Guards ─────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="main-container">
      <p className="loading-text">Verificando acceso...</p>
    </div>
  )

  if (!isAdmin) return null

  if (initialLoad) return (
    <div className="main-container">
      <p className="loading-text">Cargando...</p>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="main-container">
      <div className="page-header">
        <h1>⚙️ Panel de Administración</h1>
      </div>

      {/* ── Tabs ── */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          ⚽ Resultados
        </button>
        <button
          className={`admin-tab ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          👥 Jugadores ({players.length})
        </button>
      </div>

      {/* ══════════════ TAB: RESULTADOS ══════════════ */}
      {activeTab === 'results' && (
        <>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Cargá los resultados de cada partido
          </p>

          {matches.map(match => (
            <div key={match.id} className="match-card">

              {/* Header del partido */}
              <div className="match-header">
                <div className="match-teams">
                  {match.home_flag && getFlagUrl(match.home_flag) && (
                    <img
                      src={getFlagUrl(match.home_flag)}
                      alt={match.home_team}
                      className="flag-img"
                    />
                  )}
                  <span>{match.home_team}</span>
                  <span className="match-vs">vs</span>
                  {match.away_flag && getFlagUrl(match.away_flag) && (
                    <img
                      src={getFlagUrl(match.away_flag)}
                      alt={match.away_team}
                      className="flag-img"
                    />
                  )}
                  <span>{match.away_team}</span>
                </div>
                {match.status === 'finished' && !editing[match.id] && (
                  <span className="badge badge-saved">✓ Finalizado</span>
                )}
              </div>

              {/* Fecha y resultado actual */}
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.8rem'
                }}
              >
                📅 {formatDate(match.match_date)}
                {match.status === 'finished' && (
                  <span style={{ marginLeft: '1rem', color: 'var(--gold)' }}>
                    Resultado actual: {match.home_score} - {match.away_score}
                  </span>
                )}
              </div>

              {/* Cargar resultado (partido no finalizado) */}
              {match.status !== 'finished' && (
                <div className="prediction-row">
                  <div className="score-input">
                    <input
                      type="number" min="0" max="20" placeholder="0"
                      value={scores[match.id]?.home_score ?? ''}
                      onChange={(e) =>
                        handleScoreChange(match.id, 'home_score', e.target.value)
                      }
                    />
                    <span className="score-separator">-</span>
                    <input
                      type="number" min="0" max="20" placeholder="0"
                      value={scores[match.id]?.away_score ?? ''}
                      onChange={(e) =>
                        handleScoreChange(match.id, 'away_score', e.target.value)
                      }
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

              {/* Botón corregir (partido finalizado, no en edición) */}
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

              {/* Edición de resultado ya cargado */}
              {match.status === 'finished' && editing[match.id] && (
                <div
                  className="prediction-row"
                  style={{ marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}
                >
                  <div className="score-input">
                    <input
                      type="number" min="0" max="20" placeholder="0"
                      value={scores[match.id]?.home_score ?? ''}
                      onChange={(e) =>
                        handleScoreChange(match.id, 'home_score', e.target.value)
                      }
                    />
                    <span className="score-separator">-</span>
                    <input
                      type="number" min="0" max="20" placeholder="0"
                      value={scores[match.id]?.away_score ?? ''}
                      onChange={(e) =>
                        handleScoreChange(match.id, 'away_score', e.target.value)
                      }
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
                  >
                    Cancelar
                  </button>
                </div>
              )}

            </div>
          ))}
        </>
      )}

      {/* ══════════════ TAB: JUGADORES ══════════════ */}
      {activeTab === 'players' && (
        <>
          {/* Resumen */}
          <div className="admin-summary">
            <div className="admin-summary-chip active">
              ✅ Activos: {activePlayers}
            </div>
            <div className="admin-summary-chip pending">
              ⏳ Pendientes: {pendingPlayers}
            </div>
            <div className="admin-summary-chip mp">
              💳 MercadoPago: {mpPlayers}
            </div>
            <div className="admin-summary-chip cash">
              💵 Efectivo: {manualPlayers}
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {players.length} jugadores registrados en total
          </p>

          {loadingPlayers ? (
            <p className="loading-text">Cargando jugadores...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {players.map(player => (
                <div
                  key={player.id}
                  className="match-card player-row"
                  style={{
                    borderLeft: `4px solid ${
                      player.is_admin
                        ? '#7c3aed'
                        : player.status === 'activo'
                          ? '#22c55e'
                          : '#f59e0b'
                    }`
                  }}
                >
                  {/* Info del jugador */}
                  <div className="player-info">
                    <div className="player-name">
                      {player.is_admin ? '👑' : '👤'}{' '}
                      {player.username || 'Sin nombre'}
                    </div>
                    <div className="player-detail">
                      ✉️ {player.email || 'Sin email'}
                    </div>
                    <div className="player-detail">
                      🏆 {player.points ?? 0} pts · Registrado:{' '}
                      {formatDate(player.created_at)}
                    </div>
                    <div className="player-badges">
                      {player.is_admin && (
                        <span className="admin-badge admin-role">
                          👑 Admin
                        </span>
                      )}
                      <span
                        className={`admin-badge ${
                          player.status === 'activo' ? 'status-active' : 'status-pending'
                        }`}
                      >
                        {player.status === 'activo'
                          ? '✅ Pago confirmado'
                          : '⏳ Pago pendiente'}
                      </span>
                      {getPaymentMethodBadge(player.payment_method)}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="player-actions">
                    {player.status === 'pendiente' && (
                      <button
                        className="player-action-btn confirm"
                        onClick={() => handleConfirmPayment(player)}
                        disabled={confirmingPlayer === player.id}
                      >
                        {confirmingPlayer === player.id
                          ? 'Confirmando...'
                          : '💵 Confirmar pago'}
                      </button>
                    )}

                    <button
                      className={`player-action-btn ${
                        player.is_admin ? 'demote' : 'promote'
                      }`}
                      onClick={() => handleToggleAdmin(player)}
                      disabled={togglingAdmin === player.id}
                    >
                      {togglingAdmin === player.id
                        ? 'Actualizando...'
                        : player.is_admin
                          ? '👑 Quitar Admin'
                          : '⭐ Hacer Admin'}
                    </button>

                    <button
                      className="player-action-btn delete"
                      onClick={() => handleDeletePlayer(player)}
                      disabled={deletingPlayer === player.id}
                    >
                      {deletingPlayer === player.id
                        ? 'Eliminando...'
                        : '🗑️ Eliminar'}
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
