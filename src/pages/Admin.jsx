import { useState, useEffect } from 'react'
import { supabase, getFlagUrl } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Admin() {
  const { isAdmin, isSuperAdmin, loading } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab]     = useState('results')
  const [matches, setMatches]         = useState([])
  const [initialLoad, setInitialLoad] = useState(true)
  const [updating, setUpdating]       = useState(null)
  const [scores, setScores]           = useState({})
  const [editing, setEditing]         = useState({})

  // Jugadores
  const [players, setPlayers]                   = useState([])
  const [loadingPlayers, setLoadingPlayers]     = useState(false)
  const [deletingPlayer, setDeletingPlayer]     = useState(null)
  const [confirmingPlayer, setConfirmingPlayer] = useState(null)
  const [togglingAdmin, setTogglingAdmin]       = useState(null)

  // Superadmin - cerrar prode
  const [closingProde, setClosingProde] = useState(false)
  const [prodeStatus, setProdeStatus]   = useState('open') // 'open' | 'closed'

  useEffect(() => {
    if (loading) return
    if (!isAdmin) {
      navigate('/')
      return
    }
    fetchMatches()
    if (isSuperAdmin) fetchProdeStatus()
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
      .select('id, username, email, points, status, payment_method, created_at, is_admin, is_superadmin')
      .order('created_at', { ascending: false })

    setPlayers(data || [])
    setLoadingPlayers(false)
  }

  const fetchProdeStatus = async () => {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'prode_status')
      .single()

    if (data) setProdeStatus(data.value)
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

      const { error: authError } = await supabase.rpc('delete_user', {
        user_id: player.id
      })

      if (authError) {
        console.warn('No se pudo borrar el usuario de auth:', authError.message)
      }

      setPlayers(prev => prev.filter(p => p.id !== player.id))

    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingPlayer(null)
    }
  }

  // ── Solo SuperAdmin ────────────────────────────────────────────────────

  const handleToggleAdmin = async (player) => {
    // Protección: no se puede tocar al superadmin
    if (player.is_superadmin) {
      alert('No podés modificar los permisos del superadministrador.')
      return
    }

    // Solo el superadmin puede promover/degradar admins
    if (!isSuperAdmin) {
      alert('Solo el superadministrador puede cambiar roles.')
      return
    }

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

  const handleToggleProde = async () => {
    const newStatus = prodeStatus === 'open' ? 'closed' : 'open'
    const action    = newStatus === 'closed' ? 'CERRAR' : 'ABRIR'
    const msg       = newStatus === 'closed'
      ? '⚠️ ¿Cerrás el prode? Los jugadores NO podrán hacer nuevas predicciones.'
      : '¿Abrís el prode nuevamente?'

    const ok = window.confirm(msg)
    if (!ok) return

    setClosingProde(true)

    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'prode_status', value: newStatus })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      setProdeStatus(newStatus)
      alert(`Prode ${action === 'CERRAR' ? 'cerrado' : 'abierto'} correctamente.`)
    }

    setClosingProde(false)
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
  const date = new Date(dateStr);
  return date.toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};


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
        <h1>
          {isSuperAdmin ? '👑 Panel Superadmin' : '⚙️ Panel de Administración'}
        </h1>
        {isSuperAdmin && (
          <span style={{
            fontSize: '0.75rem',
            background: '#7c3aed22',
            color: '#a78bfa',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            border: '1px solid #7c3aed44'
          }}>
            Acceso total
          </span>
        )}
      </div>

      {/* ── Banner SuperAdmin ── */}
      {isSuperAdmin && (
        <div style={{
          background: '#7c3aed15',
          border: '1px solid #7c3aed44',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <div style={{ color: '#a78bfa', fontWeight: 600, marginBottom: '0.25rem' }}>
              🔐 Control del Prode
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Estado actual:{' '}
              <span style={{
                color: prodeStatus === 'open' ? '#22c55e' : '#ef4444',
                fontWeight: 600
              }}>
                {prodeStatus === 'open' ? '🟢 Abierto' : '🔴 Cerrado'}
              </span>
            </div>
          </div>
          <button
            onClick={handleToggleProde}
            disabled={closingProde}
            style={{
              background: prodeStatus === 'open' ? '#ef444422' : '#22c55e22',
              color: prodeStatus === 'open' ? '#ef4444' : '#22c55e',
              border: `1px solid ${prodeStatus === 'open' ? '#ef444444' : '#22c55e44'}`,
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            {closingProde
              ? 'Procesando...'
              : prodeStatus === 'open'
                ? '🔒 Cerrar Prode'
                : '🔓 Abrir Prode'}
          </button>
        </div>
      )}

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

              <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '0.8rem'
              }}>
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

              {match.status === 'finished' && editing[match.id] && (
                <div className="prediction-row" style={{
                  marginTop: '0.5rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
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
                      player.is_superadmin
                        ? '#f59e0b'           // dorado para superadmin
                        : player.is_admin
                          ? '#7c3aed'         // violeta para admin
                          : player.status === 'activo'
                            ? '#22c55e'       // verde para activo
                            : '#6b7280'       // gris para pendiente
                    }`
                  }}
                >
                  {/* Info del jugador */}
                  <div className="player-info">
                    <div className="player-name">
                      {player.is_superadmin ? '👑' : player.is_admin ? '⭐' : '👤'}{' '}
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
                      {player.is_superadmin && (
                        <span className="admin-badge" style={{
                          background: '#f59e0b22',
                          color: '#f59e0b',
                          border: '1px solid #f59e0b44'
                        }}>
                          👑 Superadmin
                        </span>
                      )}
                      {player.is_admin && !player.is_superadmin && (
                        <span className="admin-badge admin-role">
                          ⭐ Admin
                        </span>
                      )}
                      <span className={`admin-badge ${
                        player.status === 'activo' ? 'status-active' : 'status-pending'
                      }`}>
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

                    {/* Promover/degradar: SOLO superadmin, y no sobre sí mismo */}
                    {isSuperAdmin && !player.is_superadmin && (
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
                            ? '⭐ Quitar Admin'
                            : '⭐ Hacer Admin'}
                      </button>
                    )}

                    {/* Eliminar: no se puede eliminar al superadmin */}
                    {!player.is_superadmin && (
                      <button
                        className="player-action-btn delete"
                        onClick={() => handleDeletePlayer(player)}
                        disabled={deletingPlayer === player.id}
                      >
                        {deletingPlayer === player.id
                          ? 'Eliminando...'
                          : '🗑️ Eliminar'}
                      </button>
                    )}
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
