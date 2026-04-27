// src/pages/Admin.jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase, getFlagUrl } from '../lib/supabaseClient'  // ✅ importar getFlagUrl
import { useAuth } from '../context/AuthContext'
import { formatearFecha } from '../utils/dateUtils'

// ─── Custom Hook: Jugadores ───────────────────────────────────────────────────
function useAdminPlayers() {
  const [players, setPlayers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setPlayers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchPlayers() }, [fetchPlayers])

  return { players, loading, error, refetch: fetchPlayers }
}

// ─── Custom Hook: Partidos ────────────────────────────────────────────────────
function useAdminMatches() {
  const [matches, setMatches]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const fetchMatches = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true })

    if (error) setError(error.message)
    else setMatches(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchMatches() }, [fetchMatches])

  return { matches, loading, error, refetch: fetchMatches }
}

// ─── Modal de Confirmación ────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn" onClick={onCancel}
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-componente: Fila de partido con banderas ─────────────────────────────
function MatchRow({ match, editingMatch, homeScore, awayScore, savingResult,
                    savedMatchId, resultError, onEdit, onSave, onCancel,
                    onHomeScoreChange, onAwayScoreChange }) {

  const isEditing = editingMatch?.id === match.id

  return (
    <div className="card" style={{ padding: '1rem 1.25rem' }}>

      {/* ── Cabecera: equipos + fecha ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '0.6rem'
      }}>

        {/* Equipos con banderas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>

          {/* Local */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {match.home_flag && (
              <img
                src={getFlagUrl(match.home_flag)}
                alt={match.home_team}
                style={{ width: '22px', height: '16px', objectFit: 'cover', borderRadius: '2px' }}
              />
            )}
            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>
              {match.home_team}
            </span>
          </div>

          <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>
            vs
          </span>

          {/* Visitante */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {match.away_flag && (
              <img
                src={getFlagUrl(match.away_flag)}
                alt={match.away_team}
                style={{ width: '22px', height: '16px', objectFit: 'cover', borderRadius: '2px' }}
              />
            )}
            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>
              {match.away_team}
            </span>
          </div>

          {/* Badge grupo */}
          {match.group_name && (
            <span style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-secondary)',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              marginLeft: '0.25rem'
            }}>
              Grupo {match.group_name}
            </span>
          )}
        </div>

        {/* Fecha */}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          📅 {formatearFecha(match.match_date)}
        </div>
      </div>

      {/* ── Resultado actual (si está finalizado) ── */}
      {match.status === 'finished' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          color: 'var(--text-muted)',
          marginBottom: '0.6rem',
          flexWrap: 'wrap'
        }}>
          <span>Resultado:</span>

          {/* Bandera local mini */}
          {match.home_flag && (
            <img
              src={getFlagUrl(match.home_flag)}
              alt={match.home_team}
              style={{ width: '18px', height: '13px', objectFit: 'cover', borderRadius: '2px' }}
            />
          )}

          <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
            {match.home_score} - {match.away_score}
          </strong>

          {/* Bandera visitante mini */}
          {match.away_flag && (
            <img
              src={getFlagUrl(match.away_flag)}
              alt={match.away_team}
              style={{ width: '18px', height: '13px', objectFit: 'cover', borderRadius: '2px' }}
            />
          )}

          <span style={{
            fontSize: '0.72rem',
            background: '#166534',
            color: '#4ade80',
            padding: '0.1rem 0.4rem',
            borderRadius: '4px',
            fontWeight: '600'
          }}>
            ✅ Finalizado
          </span>

          {savedMatchId === match.id && (
            <span style={{
              fontSize: '0.72rem',
              background: 'var(--accent)',
              color: '#fff',
              padding: '0.1rem 0.5rem',
              borderRadius: '4px',
              fontWeight: '600'
            }}>
              ✓ Guardado
            </span>
          )}
        </div>
      )}

      {/* ── Editor de resultado / Botón cargar ── */}
      {isEditing ? (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Input local con bandera */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {match.home_flag && (
              <img
                src={getFlagUrl(match.home_flag)}
                alt={match.home_team}
                style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px' }}
              />
            )}
            <input
              type="number" min="0" max="20"
              value={homeScore}
              onChange={e => onHomeScoreChange(e.target.value)}
              placeholder="0"
              style={{
                width: '60px', padding: '0.4rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                textAlign: 'center',
                fontSize: '1rem',
                fontWeight: '700'
              }}
            />
          </div>

          <span style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '1.1rem' }}>
            -
          </span>

          {/* Input visitante con bandera */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <input
              type="number" min="0" max="20"
              value={awayScore}
              onChange={e => onAwayScoreChange(e.target.value)}
              placeholder="0"
              style={{
                width: '60px', padding: '0.4rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                textAlign: 'center',
                fontSize: '1rem',
                fontWeight: '700'
              }}
            />
            {match.away_flag && (
              <img
                src={getFlagUrl(match.away_flag)}
                alt={match.away_team}
                style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px' }}
              />
            )}
          </div>

          {/* Botones */}
          <button
            className="btn btn-primary"
            onClick={() => onSave(match)}
            disabled={savingResult}
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}
          >
            {savingResult ? '⏳ Guardando...' : '✓ Guardar'}
          </button>
          <button
            className="btn"
            onClick={onCancel}
            style={{
              fontSize: '0.85rem', padding: '0.4rem 0.9rem',
              background: 'var(--bg-secondary)'
            }}
          >
            Cancelar
          </button>

          {resultError && (
            <span style={{ fontSize: '0.82rem', color: 'var(--error)', fontWeight: '600' }}>
              ⚠️ {resultError}
            </span>
          )}
        </div>
      ) : (
        <button
          className="btn"
          onClick={() => onEdit(match)}
          style={{
            fontSize: '0.82rem',
            padding: '0.3rem 0.75rem',
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)'
          }}
        >
          {match.status === 'finished' ? '✏️ Editar resultado' : '➕ Cargar resultado'}
        </button>
      )}
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function Admin() {
  const { user, isSuperAdmin } = useAuth()

  // Tabs
  const [activeTab, setActiveTab] = useState('results')

  // Hooks
  const {
    players, loading: loadingPlayers, error: errorPlayers, refetch: refetchPlayers
  } = useAdminPlayers()

  const {
    matches, loading: loadingMatches, error: errorMatches, refetch: refetchMatches
  } = useAdminMatches()

  // Resultados
  const [editingMatch, setEditingMatch]     = useState(null)
  const [homeScore, setHomeScore]           = useState('')
  const [awayScore, setAwayScore]           = useState('')
  const [savingResult, setSavingResult]     = useState(false)
  const [savedMatchId, setSavedMatchId]     = useState(null)
  const [resultError, setResultError]       = useState('')
  const [calculatingPts, setCalculatingPts] = useState(false)
  const [calcMessage, setCalcMessage]       = useState('')
  const [matchFilter, setMatchFilter]       = useState('all')

  // Jugadores
  const [playerSearch, setPlayerSearch]     = useState('')
  const [playerFilter, setPlayerFilter]     = useState('all')
  const [confirmingId, setConfirmingId]     = useState(null)

  // Superadmin
  const [prodeStatus, setProdeStatus]       = useState(null)
  const [togglingStatus, setTogglingStatus] = useState(false)

  // Modal
  const [modal, setModal] = useState(null)

  // ── Cargar prode_status ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'prode_status')
        .single()
      if (data) setProdeStatus(data.value)
    }
    if (isSuperAdmin) fetchStatus()
  }, [isSuperAdmin])

  // ── Toggle prode_status ──────────────────────────────────────────────────────
  const handleToggleProdeStatus = async () => {
    setTogglingStatus(true)
    const newStatus = prodeStatus === 'open' ? 'closed' : 'open'
    const { error } = await supabase
      .from('settings')
      .update({ value: newStatus })
      .eq('key', 'prode_status')
    if (!error) setProdeStatus(newStatus)
    setTogglingStatus(false)
  }

  // ── Guardar resultado ────────────────────────────────────────────────────────
  const handleSaveResult = async (match) => {
    setResultError('')
    const h = parseInt(homeScore)
    const a = parseInt(awayScore)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0 || h > 20 || a > 20) {
      setResultError('Scores inválidos (0–20)')
      return
    }
    setSavingResult(true)
    const { error } = await supabase
      .from('matches')
      .update({ home_score: h, away_score: a, status: 'finished' })
      .eq('id', match.id)

    setSavingResult(false)
    if (error) { setResultError(error.message); return }

    setSavedMatchId(match.id)
    setTimeout(() => setSavedMatchId(null), 2500)
    setEditingMatch(null)
    setHomeScore('')
    setAwayScore('')
    refetchMatches()
  }

  // ── Calcular puntos ──────────────────────────────────────────────────────────
  const handleCalculatePoints = async () => {
    if (calculatingPts) return
    setCalculatingPts(true)
    setCalcMessage('')
    const { error } = await supabase.rpc('calculate_points')
    setCalculatingPts(false)
    setCalcMessage(
      error
        ? `❌ Error: ${error.message}`
        : '✅ Puntos calculados correctamente'
    )
    setTimeout(() => setCalcMessage(''), 4000)
  }

  // ── Confirmar pago manual ────────────────────────────────────────────────────
  const handleConfirmPayment = async (playerId) => {
    setConfirmingId(playerId)
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'activo', payment_method: 'manual' })
      .eq('id', playerId)
    setConfirmingId(null)
    if (!error) refetchPlayers()
  }

  // ── Promover/Demote admin ────────────────────────────────────────────────────
  const handleToggleAdmin = async (player) => {
    const action = player.is_admin ? 'quitar admin a' : 'hacer admin a'
    setModal({
      message: `¿Querés ${action} ${player.username}?`,
      onConfirm: async () => {
        setModal(null)
        await supabase
          .from('profiles')
          .update({ is_admin: !player.is_admin })
          .eq('id', player.id)
        refetchPlayers()
      }
    })
  }

  // ── Eliminar usuario ─────────────────────────────────────────────────────────
  const handleDeleteUser = (player) => {
    setModal({
      message: `¿Estás seguro que querés eliminar a "${player.username}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setModal(null)
        await supabase.from('predictions').delete().eq('user_id', player.id)
        await supabase.from('profiles').delete().eq('id', player.id)
        await supabase.rpc('delete_user', { user_id: player.id })
        refetchPlayers()
      }
    })
  }

  // ── Filtros de partidos ──────────────────────────────────────────────────────
  const groups = [...new Set(matches.map(m => m.group_name).filter(Boolean))].sort()

  const filteredMatches = matches.filter(m => {
    if (matchFilter === 'all')      return true
    if (matchFilter === 'finished') return m.status === 'finished'
    if (matchFilter === 'upcoming') return m.status !== 'finished'
    return m.group_name === matchFilter
  })

  // ── Filtros de jugadores ─────────────────────────────────────────────────────
  const filteredPlayers = players.filter(p => {
    const matchesSearch =
      p.username?.toLowerCase().includes(playerSearch.toLowerCase()) ||
      p.email?.toLowerCase().includes(playerSearch.toLowerCase())
    const matchesFilter =
      playerFilter === 'all' ||
      (playerFilter === 'activo'    && p.status === 'activo')    ||
      (playerFilter === 'pendiente' && p.status === 'pendiente') ||
      (playerFilter === 'mp'        && p.payment_method === 'mp') ||
      (playerFilter === 'manual'    && p.payment_method === 'manual')
    return matchesSearch && matchesFilter
  })

  // ── Métricas jugadores ───────────────────────────────────────────────────────
  const metrics = {
    total:   players.length,
    activos: players.filter(p => p.status === 'activo').length,
    pending: players.filter(p => p.status === 'pendiente').length,
    mp:      players.filter(p => p.payment_method === 'mp').length,
    manual:  players.filter(p => p.payment_method === 'manual').length,
  }

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>

      {/* Modal */}
      {modal && (
        <ConfirmModal
          message={modal.message}
          onConfirm={modal.onConfirm}
          onCancel={() => setModal(null)}
        />
      )}

      <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
        ⚙️ Panel de Administración
      </h1>

      {/* ── Banner Superadmin ── */}
      {isSuperAdmin && (
        <div style={{
          background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
          border: '1px solid #7c3aed',
          borderRadius: '10px',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#e9d5ff' }}>
              👑 Control Superadmin
            </div>
            <div style={{ fontSize: '0.82rem', color: '#c4b5fd', marginTop: '0.2rem' }}>
              Estado del prode:{' '}
              <strong style={{ color: prodeStatus === 'open' ? '#4ade80' : '#f87171' }}>
                {prodeStatus === 'open' ? '🟢 Abierto' : '🔴 Cerrado'}
              </strong>
            </div>
          </div>
          <button
            className="btn"
            onClick={handleToggleProdeStatus}
            disabled={togglingStatus || prodeStatus === null}
            style={{
              background: prodeStatus === 'open' ? '#dc2626' : '#16a34a',
              color: '#fff',
              border: 'none',
              fontWeight: '600'
            }}
          >
            {togglingStatus
              ? 'Cambiando...'
              : prodeStatus === 'open'
                ? '🔒 Cerrar Prode'
                : '🔓 Abrir Prode'}
          </button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['results', 'players'].map(tab => (
          <button
            key={tab}
            className="btn"
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? 'var(--accent)' : 'var(--bg-secondary)',
              color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
              fontWeight: activeTab === tab ? '700' : '400'
            }}
          >
            {tab === 'results' ? '⚽ Resultados' : '👥 Jugadores'}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: RESULTADOS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'results' && (
        <div>

          {/* Calcular Puntos */}
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '0.2rem' }}>
                🧮 Calcular Puntos
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Ejecuta el cálculo de puntos para todos los partidos finalizados
              </div>
              {calcMessage && (
                <div style={{
                  marginTop: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: calcMessage.startsWith('✅') ? 'var(--success)' : 'var(--error)'
                }}>
                  {calcMessage}
                </div>
              )}
            </div>
            <button
              className="btn btn-primary"
              onClick={handleCalculatePoints}
              disabled={calculatingPts}
            >
              {calculatingPts ? '⏳ Calculando...' : '🚀 Calcular Puntos'}
            </button>
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {[
              { value: 'all',      label: 'Todos' },
              { value: 'upcoming', label: '🕐 Pendientes' },
              { value: 'finished', label: '✅ Finalizados' },
              ...groups.map(g => ({ value: g, label: `Grupo ${g}` }))
            ].map(f => (
              <button
                key={f.value}
                className="btn"
                onClick={() => setMatchFilter(f.value)}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.3rem 0.75rem',
                  background: matchFilter === f.value ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: matchFilter === f.value ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Error / Loading */}
          {errorMatches && (
            <div className="card" style={{ color: 'var(--error)', textAlign: 'center', padding: '2rem' }}>
              ❌ Error al cargar partidos: {errorMatches}
              <br />
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={refetchMatches}>
                Reintentar
              </button>
            </div>
          )}

          {loadingMatches && !errorMatches && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Cargando partidos...
            </div>
          )}

          {/* ✅ Lista de partidos con MatchRow */}
          {!loadingMatches && !errorMatches && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredMatches.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No hay partidos con ese filtro
                </div>
              )}

              {filteredMatches.map(match => (
                <MatchRow
                  key={match.id}
                  match={match}
                  editingMatch={editingMatch}
                  homeScore={homeScore}
                  awayScore={awayScore}
                  savingResult={savingResult}
                  savedMatchId={savedMatchId}
                  resultError={resultError}
                  onEdit={(m) => {
                    setEditingMatch(m)
                    setHomeScore(m.home_score ?? '')
                    setAwayScore(m.away_score ?? '')
                    setResultError('')
                  }}
                  onSave={handleSaveResult}
                  onCancel={() => {
                    setEditingMatch(null)
                    setHomeScore('')
                    setAwayScore('')
                    setResultError('')
                  }}
                  onHomeScoreChange={(v) => { setResultError(''); setHomeScore(v) }}
                  onAwayScoreChange={(v) => { setResultError(''); setAwayScore(v) }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: JUGADORES
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'players' && (
        <div>

          {/* Métricas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.25rem'
          }}>
            {[
              { label: 'Total',        value: metrics.total,   color: 'var(--text-primary)' },
              { label: '✅ Activos',    value: metrics.activos, color: '#4ade80' },
              { label: '⏳ Pendientes', value: metrics.pending, color: '#facc15' },
              { label: '💳 MP',         value: metrics.mp,      color: '#60a5fa' },
              { label: '🖐 Manual',     value: metrics.manual,  color: '#c084fc' },
            ].map(m => (
              <div key={m.label} className="card" style={{ textAlign: 'center', padding: '0.75rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: m.color }}>
                  {m.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          {/* Búsqueda + Filtros */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por nombre o email..."
              value={playerSearch}
              onChange={e => setPlayerSearch(e.target.value)}
              style={{
                flex: '1', minWidth: '200px',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { value: 'all',       label: 'Todos' },
                { value: 'activo',    label: '✅ Activos' },
                { value: 'pendiente', label: '⏳ Pendientes' },
                { value: 'mp',        label: '💳 MP' },
                { value: 'manual',    label: '🖐 Manual' },
              ].map(f => (
                <button
                  key={f.value}
                  className="btn"
                  onClick={() => setPlayerFilter(f.value)}
                  style={{
                    fontSize: '0.78rem',
                    padding: '0.3rem 0.65rem',
                    background: playerFilter === f.value ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: playerFilter === f.value ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error / Loading */}
          {errorPlayers && (
            <div className="card" style={{ color: 'var(--error)', textAlign: 'center', padding: '2rem' }}>
              ❌ Error al cargar jugadores: {errorPlayers}
              <br />
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={refetchPlayers}>
                Reintentar
              </button>
            </div>
          )}

          {loadingPlayers && !errorPlayers && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Cargando jugadores...
            </div>
          )}

          {/* Contador */}
          {!loadingPlayers && !errorPlayers && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Mostrando {filteredPlayers.length} de {players.length} jugadores
            </div>
          )}

          {/* Lista de jugadores */}
          {!loadingPlayers && !errorPlayers && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {filteredPlayers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No hay jugadores con ese filtro
                </div>
              )}

              {filteredPlayers.map(player => (
                <div key={player.id} className="card" style={{ padding: '0.85rem 1.1rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontWeight: '600', marginBottom: '0.2rem'
                      }}>
                        {player.username || '(sin username)'}
                        {player.is_superadmin && (
                          <span style={{
                            fontSize: '0.7rem', background: '#4c1d95',
                            color: '#e9d5ff', padding: '0.1rem 0.4rem', borderRadius: '4px'
                          }}>👑 SuperAdmin</span>
                        )}
                        {player.is_admin && !player.is_superadmin && (
                          <span style={{
                            fontSize: '0.7rem', background: '#1e3a5f',
                            color: '#60a5fa', padding: '0.1rem 0.4rem', borderRadius: '4px'
                          }}>🔧 Admin</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {player.email}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          background: player.status === 'activo' ? '#166534' : '#78350f',
                          color: player.status === 'activo' ? '#4ade80' : '#fbbf24'
                        }}>
                          {player.status === 'activo' ? '✅ Activo' : '⏳ Pendiente'}
                        </span>
                        {player.payment_method && (
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-muted)'
                          }}>
                            {player.payment_method === 'mp'       ? '💳 MercadoPago'  :
                             player.payment_method === 'manual'   ? '🖐 Manual'       :
                             player.payment_method === 'transfer' ? '🏦 Transferencia':
                             player.payment_method}
                          </span>
                        )}
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          background: 'var(--bg-secondary)',
                          color: 'var(--gold)'
                        }}>
                          ⭐ {player.points ?? 0} pts
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    {!player.is_superadmin && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>

                        {player.status !== 'activo' && (
                          <button
                            className="btn"
                            onClick={() => handleConfirmPayment(player.id)}
                            disabled={confirmingId === player.id}
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.3rem 0.6rem',
                              background: '#166534',
                              color: '#4ade80',
                              border: '1px solid #4ade80'
                            }}
                          >
                            {confirmingId === player.id ? '...' : '✓ Confirmar pago'}
                          </button>
                        )}

                        {isSuperAdmin && (
                          <button
                            className="btn"
                            onClick={() => handleToggleAdmin(player)}
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.3rem 0.6rem',
                              background: player.is_admin ? '#78350f' : '#1e3a5f',
                              color: player.is_admin ? '#fbbf24' : '#60a5fa',
                              border: `1px solid ${player.is_admin ? '#fbbf24' : '#60a5fa'}`
                            }}
                          >
                            {player.is_admin ? '⬇️ Quitar admin' : '⬆️ Hacer admin'}
                          </button>
                        )}

                        {isSuperAdmin && (
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteUser(player)}
                            style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
                          >
                            🗑️ Eliminar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
