// src/pages/Admin.jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase, getFlagUrl } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatearFecha, formatearFechaLarga, estaLocked } from '../utils/dateUtils'

const KNOCKOUT_ID = '01030879-760e-4fe3-b329-7c09c623cc58'
const GROUPS_ID   = 'c4e57607-7fe8-4a0a-b8a1-b0afedb9620b'

// ─── Custom Hook: Jugadores ───────────────────────────────────────────────────
function useAdminPlayers() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

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
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

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

// ─── Custom Hook: Knockout Entries ───────────────────────────────────────────
function useAdminKnockoutEntries() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Traemos competition_entries del knockout con el perfil del usuario
    const { data, error } = await supabase
      .from('competition_entries')
      .select(`
        id,
        user_id,
        status,
        payment_method,
        competition_id,
        profiles (
          id,
          username,
          email,
          full_name,
          status,
          is_admin,
          is_superadmin,
          payment_method,
          points
        )
      `)
      .eq('competition_id', KNOCKOUT_ID)
      .order('id', { ascending: false })

    if (error) setError(error.message)
    else setEntries(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])
  return { entries, loading, error, refetch: fetchEntries }
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

// ─── Sub-componente: Card de partido ─────────────────────────────────────────
function MatchRow({ match, editingMatch, homeScore, awayScore, savingResult,
                    savedMatchId, resultError, onEdit, onSave, onCancel,
                    onHomeScoreChange, onAwayScoreChange }) {

  const isEditing  = editingMatch?.id === match.id
  const isFinished = match.status === 'finished'
  const borderColor = isFinished ? '#4ade80' : isEditing ? 'var(--accent)' : 'var(--border)'

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: '10px',
      padding: '1rem 1.25rem',
      transition: 'border-left-color 0.2s ease'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.5rem',
        marginBottom: isFinished || isEditing ? '0.75rem' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {match.home_flag && (
              <img src={getFlagUrl(match.home_flag)} alt={match.home_team}
                style={{ width: '52px', height: '36px', objectFit: 'cover', borderRadius: '2px' }} />
            )}
            <span style={{ fontWeight: '700', fontSize: '1.2rem' }}>{match.home_team}</span>
          </div>
          <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '1rem' }}>vs</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {match.away_flag && (
              <img src={getFlagUrl(match.away_flag)} alt={match.away_team}
                style={{ width: '52px', height: '36px', objectFit: 'cover', borderRadius: '2px' }} />
            )}
            <span style={{ fontWeight: '700', fontSize: '1.2rem' }}>{match.away_team}</span>
          </div>
          {match.group_name && (
            <span style={{
              fontSize: '1rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)',
              padding: '0.1rem 0.4rem', borderRadius: '4px', marginLeft: '0.25rem'
            }}>
              Grupo {match.group_name}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ fontSize: '1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            📅 {formatearFechaLarga(match.match_date)}
          </div>
          {!isEditing && (
            <button className="btn" onClick={() => onEdit(match)} style={{
              fontSize: '0.50rem', padding: '0.25rem 0.6rem',
              background: 'var(--bg-secondary)', color: 'var(--text-secondary)', whiteSpace: 'nowrap'
            }}>
              {isFinished ? '✏️ Editar' : '➕ Cargar'}
            </button>
          )}
        </div>
      </div>

      {isFinished && !isEditing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'var(--bg-secondary)', padding: '0.3rem 0.75rem', borderRadius: '8px',
          }}>
            {match.home_flag && (
              <img src={getFlagUrl(match.home_flag)} alt={match.home_team}
                style={{ width: '18px', height: '13px', objectFit: 'cover', borderRadius: '2px' }} />
            )}
            <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem', letterSpacing: '0.05em' }}>
              {match.home_score} - {match.away_score}
            </strong>
            {match.away_flag && (
              <img src={getFlagUrl(match.away_flag)} alt={match.away_team}
                style={{ width: '18px', height: '13px', objectFit: 'cover', borderRadius: '2px' }} />
            )}
          </div>
          <span style={{
            fontSize: '0.72rem', background: '#166534', color: '#4ade80',
            padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600'
          }}>✅ Finalizado</span>
          {savedMatchId === match.id && (
            <span style={{
              fontSize: '0.72rem', background: 'var(--accent)', color: '#fff',
              padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600'
            }}>✓ Guardado y puntos calculados</span>
          )}
        </div>
      )}

      {isEditing && (
        <div>
          <div style={{
            display: 'flex', gap: '0.5rem', alignItems: 'center',
            flexWrap: 'wrap', marginBottom: resultError ? '0.5rem' : '0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              {match.home_flag && (
                <img src={getFlagUrl(match.home_flag)} alt={match.home_team}
                  style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px' }} />
              )}
              <input type="number" min="0" max="20" value={homeScore}
                onChange={e => onHomeScoreChange(e.target.value)} placeholder="0"
                style={{
                  width: '60px', padding: '0.4rem', borderRadius: '6px',
                  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', textAlign: 'center', fontSize: '1rem', fontWeight: '700'
                }} />
            </div>
            <span style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '1.1rem' }}>-</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <input type="number" min="0" max="20" value={awayScore}
                onChange={e => onAwayScoreChange(e.target.value)} placeholder="0"
                style={{
                  width: '60px', padding: '0.4rem', borderRadius: '6px',
                  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', textAlign: 'center', fontSize: '1rem', fontWeight: '700'
                }} />
              {match.away_flag && (
                <img src={getFlagUrl(match.away_flag)} alt={match.away_team}
                  style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px' }} />
              )}
            </div>
            <button className="btn btn-primary" onClick={() => onSave(match)} disabled={savingResult}
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
              {savingResult ? '⏳ Guardando...' : '✓ Guardar'}
            </button>
            <button className="btn" onClick={onCancel}
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem', background: 'var(--bg-secondary)' }}>
              Cancelar
            </button>
          </div>
          {resultError && (
            <span style={{ fontSize: '0.82rem', color: 'var(--error)', fontWeight: '600' }}>
              ⚠️ {resultError}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sub-componente: Card de Knockout Entry ───────────────────────────────────
function KnockoutEntryCard({ entry, confirmingId, onConfirm, onRevoke, onDelete, isSuperAdmin }) {
  const profile     = entry.profiles
  const isPending   = entry.status === 'pending'
  const isActive    = entry.status === 'active'
  const borderColor = isActive ? '#4ade80' : isPending ? '#facc15' : 'var(--border)'

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: '10px',
      padding: '0.85rem 1.1rem',
      transition: 'border-left-color 0.2s ease'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.5rem'
      }}>

        {/* Info del usuario */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontWeight: '600', marginBottom: '0.2rem'
          }}>
            {profile?.username || '(sin username)'}
            {profile?.is_superadmin && (
              <span style={{
                fontSize: '0.7rem', background: '#4c1d95',
                color: '#e9d5ff', padding: '0.1rem 0.4rem', borderRadius: '4px'
              }}>👑 SuperAdmin</span>
            )}
            {profile?.is_admin && !profile?.is_superadmin && (
              <span style={{
                fontSize: '0.7rem', background: '#1e3a5f',
                color: '#60a5fa', padding: '0.1rem 0.4rem', borderRadius: '4px'
              }}>🔧 Admin</span>
            )}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {profile?.email}
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>

            {/* Estado entry knockout */}
            <span style={{
              fontSize: '0.72rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
              background: isActive ? '#166534' : '#78350f',
              color: isActive ? '#4ade80' : '#fbbf24'
            }}>
              {isActive ? '✅ Activo' : '⏳ Pendiente'}
            </span>

            {/* Estado perfil (si es solo-knockout y está pending) */}
            {profile?.status === 'pending' && (
              <span style={{
                fontSize: '0.72rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
                background: '#1e3a5f', color: '#93c5fd'
              }}>
                👤 Perfil pendiente
              </span>
            )}

            {/* Método de pago de la entry */}
            {entry.payment_method && (
              <span style={{
                fontSize: '0.72rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
                background: 'var(--bg-secondary)', color: 'var(--text-muted)'
              }}>
                {entry.payment_method === 'mp'       ? '💳 MercadoPago'   :
                 entry.payment_method === 'transfer' ? '🏦 Transferencia' :
                 entry.payment_method === 'efectivo' ? '💵 Efectivo'      :
                 entry.payment_method}
              </span>
            )}

            <span style={{
              fontSize: '0.72rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
              background: 'var(--bg-secondary)', color: 'var(--gold)'
            }}>
              ⭐ {profile?.points ?? 0} pts
            </span>
          </div>
        </div>

        {/* Acciones */}
        {!profile?.is_superadmin && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>

            {/* Aprobar pago (solo si está pendiente) */}
            {isPending && (
              <>
                <button
                  className="btn"
                  onClick={() => onConfirm(entry, 'transfer')}
                  disabled={confirmingId === entry.id}
                  style={{
                    fontSize: '0.78rem', padding: '0.3rem 0.6rem',
                    background: '#1e3a5f', color: '#60a5fa', border: '1px solid #60a5fa'
                  }}
                >
                  {confirmingId === entry.id ? '...' : '🏦 Transferencia'}
                </button>
                <button
                  className="btn"
                  onClick={() => onConfirm(entry, 'efectivo')}
                  disabled={confirmingId === entry.id}
                  style={{
                    fontSize: '0.78rem', padding: '0.3rem 0.6rem',
                    background: '#166534', color: '#4ade80', border: '1px solid #4ade80'
                  }}
                >
                  {confirmingId === entry.id ? '...' : '💵 Efectivo'}
                </button>
              </>
            )}

            {/* Revocar (superadmin, solo si está activo) */}
            {isSuperAdmin && isActive && (
              <button
                className="btn"
                onClick={() => onRevoke(entry)}
                disabled={confirmingId === entry.id}
                style={{
                  fontSize: '0.78rem', padding: '0.3rem 0.6rem',
                  background: '#450a0a', color: '#f87171', border: '1px solid #f87171'
                }}
              >
                ↩️ Revocar
              </button>
            )}

            {isSuperAdmin && (
              <button
                className="btn btn-danger"
                onClick={() => onDelete(entry)}
                disabled={confirmingId === entry.id}
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
              >
                🗑️ Eliminar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function Admin() {
  const { user, isSuperAdmin } = useAuth()

  // Tabs
  const [activeTab, setActiveTab] = useState('results')

  // Hooks
  const { players, loading: loadingPlayers, error: errorPlayers, refetch: refetchPlayers } = useAdminPlayers()
  const { matches, loading: loadingMatches, error: errorMatches, refetch: refetchMatches } = useAdminMatches()
  const { entries: knockoutEntries, loading: loadingKnockout, error: errorKnockout, refetch: refetchKnockout } = useAdminKnockoutEntries()

  // Resultados
  const [editingMatch, setEditingMatch] = useState(null)
  const [homeScore, setHomeScore]       = useState('')
  const [awayScore, setAwayScore]       = useState('')
  const [savingResult, setSavingResult] = useState(false)
  const [savedMatchId, setSavedMatchId] = useState(null)
  const [resultError, setResultError]   = useState('')
  const [calcMessage, setCalcMessage]   = useState('')
  const [matchFilter, setMatchFilter]   = useState('all')

  // Jugadores (Groups)
  const [playerSearch, setPlayerSearch] = useState('')
  const [playerFilter, setPlayerFilter] = useState('all')
  const [confirmingId, setConfirmingId] = useState(null)

  // Knockout entries
  const [knockoutSearch, setKnockoutSearch]   = useState('')
  const [knockoutFilter, setKnockoutFilter]   = useState('all')
  const [confirmingEntryId, setConfirmingEntryId] = useState(null)

  // Superadmin toggles
  const [prodeStatus, setProdeStatus]               = useState(null)
  const [togglingStatus, setTogglingStatus]         = useState(false)
  const [knockoutStatus, setKnockoutStatus]         = useState(null)
  const [togglingKnockout, setTogglingKnockout]     = useState(false)
  const [groupsRegistration, setGroupsRegistration] = useState(null)
  const [togglingGroupsReg, setTogglingGroupsReg]   = useState(false)
  const [knockoutRegistration, setKnockoutRegistration] = useState(null)
  const [togglingKnockoutReg, setTogglingKnockoutReg]   = useState(false)

  // Modal
  const [modal, setModal] = useState(null)

  // ── Cargar settings superadmin ───────────────────────────────────────────────
  useEffect(() => {
    if (!isSuperAdmin) return
    const fetch = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'prode_status').single()
      if (data) setProdeStatus(data.value)
    }
    fetch()
  }, [isSuperAdmin])

  useEffect(() => {
    if (!isSuperAdmin) return
    const fetch = async () => {
      const { data } = await supabase.from('competitions').select('status').eq('id', KNOCKOUT_ID).single()
      if (data) setKnockoutStatus(data.status)
    }
    fetch()
  }, [isSuperAdmin])

  useEffect(() => {
    if (!isSuperAdmin) return
    const fetch = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'groups_registration_open').single()
      if (data) setGroupsRegistration(data.value)
    }
    fetch()
  }, [isSuperAdmin])

  useEffect(() => {
    if (!isSuperAdmin) return
    const fetch = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'knockout_registration_open').single()
      if (data) setKnockoutRegistration(data.value)
    }
    fetch()
  }, [isSuperAdmin])


  // ── Toggles superadmin ───────────────────────────────────────────────────────
  const handleToggleProdeStatus = async () => {
    setTogglingStatus(true)
    const newStatus = prodeStatus === 'open' ? 'closed' : 'open'
    const { error } = await supabase.from('settings').update({ value: newStatus }).eq('key', 'prode_status')
    if (!error) setProdeStatus(newStatus)
    setTogglingStatus(false)
  }

  const handleToggleKnockout = async () => {
    setTogglingKnockout(true)
    const newStatus = knockoutStatus === 'active' ? 'inactive' : 'active'
    const { error } = await supabase.from('competitions').update({ status: newStatus }).eq('id', KNOCKOUT_ID)
    if (!error) setKnockoutStatus(newStatus)
    setTogglingKnockout(false)
  }

  const handleToggleGroupsReg = async () => {
    setTogglingGroupsReg(true)
    const newValue = groupsRegistration === 'true' ? 'false' : 'true'
    const { error } = await supabase.from('settings').update({ value: newValue }).eq('key', 'groups_registration_open')
    if (!error) setGroupsRegistration(newValue)
    setTogglingGroupsReg(false)
  }

  const handleToggleKnockoutReg = async () => {
  setTogglingKnockoutReg(true)
  const newValue = knockoutRegistration === 'true' ? 'false' : 'true'
  const { error } = await supabase.from('settings').update({ value: newValue }).eq('key', 'knockout_registration_open')
  if (!error) setKnockoutRegistration(newValue)
  setTogglingKnockoutReg(false)
  }

  // ── Guardar resultado ────────────────────────────────────────────────────────
  const handleSaveResult = async (match) => {
    setResultError('')
    setCalcMessage('')
    const h = parseInt(homeScore)
    const a = parseInt(awayScore)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0 || h > 20 || a > 20) {
      setResultError('Scores inválidos (0–20)')
      return
    }
    setSavingResult(true)
    const { error: saveError } = await supabase
      .from('matches')
      .update({ home_score: h, away_score: a, status: 'finished' })
      .eq('id', match.id)
    if (saveError) { setSavingResult(false); setResultError(saveError.message); return }
    const { error: calcError } = await supabase.rpc('calculate_points')
    setSavingResult(false)
    if (calcError) {
      setCalcMessage(`⚠️ Resultado guardado, pero error al calcular puntos: ${calcError.message}`)
      setTimeout(() => setCalcMessage(''), 5000)
    }
    setSavedMatchId(match.id)
    setTimeout(() => setSavedMatchId(null), 3000)
    setEditingMatch(null)
    setHomeScore('')
    setAwayScore('')
    refetchMatches()
  }

  // ── Confirmar pago Groups ────────────────────────────────────────────────────
  const handleConfirmPayment = async (playerId, method) => {
    setConfirmingId(playerId)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ status: 'active', payment_method: method })
      .eq('id', playerId)
    if (profileError) { console.error(profileError); setConfirmingId(null); return }
    await supabase
      .from('competition_entries')
      .update({ status: 'active', payment_method: method })
      .eq('user_id', playerId)
      .eq('competition_id', GROUPS_ID)
    setConfirmingId(null)
    refetchPlayers()
  }

  // ── Confirmar pago Knockout ──────────────────────────────────────────────────
  const handleConfirmKnockoutEntry = async (entry, method) => {
    setConfirmingEntryId(entry.id)

    // 1. Activar la entry de knockout
    const { error: entryError } = await supabase
      .from('competition_entries')
      .update({ status: 'active', payment_method: method })
      .eq('id', entry.id)

    if (entryError) {
      console.error('Error activando entry knockout:', entryError)
      setConfirmingEntryId(null)
      return
    }

    // 2. Si el perfil del usuario está pending, activarlo también
    //    (caso usuario solo-knockout que nunca estuvo en groups)
    if (entry.profiles?.status === 'pending') {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: 'active', payment_method: method })
        .eq('id', entry.user_id)

      if (profileError) {
        console.error('Error activando perfil:', profileError)
      }
    }
    // Si ya era active (venía de groups), solo actualizamos payment_method de knockout
    // sin tocar profiles.status

    setConfirmingEntryId(null)
    refetchKnockout()
  }

  // ── Revocar entry Knockout ───────────────────────────────────────────────────
  const handleRevokeKnockoutEntry = (entry) => {
    setModal({
      message: `¿Revocar la entrada de Knockout de "${entry.profiles?.username}"? Volverá a estado pendiente.`,
      onConfirm: async () => {
        setModal(null)
        await supabase
          .from('competition_entries')
          .update({ status: 'pending' })
          .eq('id', entry.id)
        refetchKnockout()
      }
    })
  }

  // ── Eliminar entry Knockout ──────────────────────────────────────────────────
  const handleDeleteKnockoutEntry = (entry) => {
    setModal({
      message: `¿Eliminar la entrada de Knockout de "${entry.profiles?.username}"? Se eliminará la entry y sus predicciones.`,
      onConfirm: async () => {
        setModal(null)
        // 1. Eliminar knockout_predictions del usuario para esta competencia
        await supabase
          .from('knockout_predictions')
          .delete()
          .eq('user_id', entry.user_id)
          .eq('competition_id', KNOCKOUT_ID)

        // 2. Eliminar champion_predictions
        await supabase
          .from('champion_predictions')
          .delete()
          .eq('user_id', entry.user_id)
          .eq('competition_id', KNOCKOUT_ID)

        // 3. Eliminar la competition_entry
        await supabase
          .from('competition_entries')
          .delete()
          .eq('id', entry.id)

        refetchKnockout()
      }
    })
  }

  // ── Promover/Demote admin ────────────────────────────────────────────────────
  const handleToggleAdmin = async (player) => {
    const action = player.is_admin ? 'quitar admin a' : 'hacer admin a'
    setModal({
      message: `¿Querés ${action} ${player.username}?`,
      onConfirm: async () => {
        setModal(null)
        await supabase.from('profiles').update({ is_admin: !player.is_admin }).eq('id', player.id)
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

  // ── Filtros jugadores (Groups) ───────────────────────────────────────────────
  const filteredPlayers = players.filter(p => {
    const matchesSearch =
      p.username?.toLowerCase().includes(playerSearch.toLowerCase()) ||
      p.email?.toLowerCase().includes(playerSearch.toLowerCase())
    const matchesFilter =
      playerFilter === 'all'                                              ||
      (playerFilter === 'active'    && p.status === 'active')            ||
      (playerFilter === 'pending'   && p.status === 'pending')           ||
      (playerFilter === 'mp'        && p.payment_method === 'mp')        ||
      (playerFilter === 'transfer'  && p.payment_method === 'transfer')  ||
      (playerFilter === 'efectivo'  && p.payment_method === 'efectivo')
    return matchesSearch && matchesFilter
  })

  // ── Filtros Knockout entries ─────────────────────────────────────────────────
  const filteredKnockoutEntries = knockoutEntries.filter(e => {
    const profile = e.profiles
    const matchesSearch =
      profile?.username?.toLowerCase().includes(knockoutSearch.toLowerCase()) ||
      profile?.email?.toLowerCase().includes(knockoutSearch.toLowerCase())
    const matchesFilter =
      knockoutFilter === 'all'                                              ||
      (knockoutFilter === 'active'   && e.status === 'active')             ||
      (knockoutFilter === 'pending'  && e.status === 'pending')            ||
      (knockoutFilter === 'transfer' && e.payment_method === 'transfer')   ||
      (knockoutFilter === 'efectivo' && e.payment_method === 'efectivo')   ||
      (knockoutFilter === 'mp'       && e.payment_method === 'mp')
    return matchesSearch && matchesFilter
  })

  // ── Métricas jugadores (Groups) ──────────────────────────────────────────────
  const metrics = {
    total:         players.length,
    activos:       players.filter(p => p.status === 'active').length,
    pending:       players.filter(p => p.status === 'pending').length,
    mp:            players.filter(p => p.payment_method === 'mp').length,
    transferencia: players.filter(p => p.payment_method === 'transfer').length,
    efectivo:      players.filter(p => p.payment_method === 'efectivo').length,
  }

  // ── Métricas Knockout ────────────────────────────────────────────────────────
  const knockoutMetrics = {
    total:    knockoutEntries.length,
    activos:  knockoutEntries.filter(e => e.status === 'active').length,
    pending:  knockoutEntries.filter(e => e.status === 'pending').length,
    mp:       knockoutEntries.filter(e => e.payment_method === 'mp').length,
    transfer: knockoutEntries.filter(e => e.payment_method === 'transfer').length,
    efectivo: knockoutEntries.filter(e => e.payment_method === 'efectivo').length,
  }

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>

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
          border: '1px solid #7c3aed', borderRadius: '10px',
          padding: '1rem 1.5rem', marginBottom: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '0.75rem'
        }}>
          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#e9d5ff' }}>
            👑 Control Superadmin
          </div>

          {/* Fila 1: Prode status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', color: '#c4b5fd' }}>
              Estado del prode:{' '}
              <strong style={{ color: prodeStatus === 'open' ? '#4ade80' : '#f87171' }}>
                {prodeStatus === 'open' ? '🟢 Abierto' : '🔴 Cerrado'}
              </strong>
            </div>
            <button className="btn" onClick={handleToggleProdeStatus}
              disabled={togglingStatus || prodeStatus === null}
              style={{ background: prodeStatus === 'open' ? '#dc2626' : '#16a34a', color: '#fff', border: 'none', fontWeight: '600', fontSize: '0.85rem' }}>
              {togglingStatus ? 'Cambiando...' : prodeStatus === 'open' ? '🔒 Cerrar Prode' : '🔓 Abrir Prode'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }} />

          {/* Fila 2: Knockout inscripción */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', color: '#c4b5fd' }}>
              Inscripción Eliminatorias:{' '}
              <strong style={{ color: knockoutStatus === 'active' ? '#4ade80' : '#f87171' }}>
                {knockoutStatus === 'active' ? '🟢 Habilitada' : '🔴 Deshabilitada'}
              </strong>
            </div>
            <button className="btn" onClick={handleToggleKnockout}
              disabled={togglingKnockout || knockoutStatus === null}
              style={{ background: knockoutStatus === 'active' ? '#dc2626' : '#16a34a', color: '#fff', border: 'none', fontWeight: '600', fontSize: '0.85rem' }}>
              {togglingKnockout ? 'Cambiando...' : knockoutStatus === 'active' ? '🔒 Deshabilitar inscripción' : '🔓 Habilitar inscripción'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }} />

          {/* Fila 3: Registro Groups */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', color: '#c4b5fd' }}>
              Registro Fase de Grupos:{' '}
              <strong style={{ color: groupsRegistration === 'true' ? '#4ade80' : '#f87171' }}>
                {groupsRegistration === 'true' ? '🟢 Abierto' : '🔴 Cerrado'}
              </strong>
            </div>
            <button className="btn" onClick={handleToggleGroupsReg}
              disabled={togglingGroupsReg || groupsRegistration === null}
              style={{ background: groupsRegistration === 'true' ? '#dc2626' : '#16a34a', color: '#fff', border: 'none', fontWeight: '600', fontSize: '0.85rem' }}>
              {togglingGroupsReg ? 'Cambiando...' : groupsRegistration === 'true' ? '🔒 Cerrar registro' : '🔓 Abrir registro'}
            </button>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }} />

          {/* Fila 4: Registro Knockout */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', color: '#c4b5fd' }}>
              Registro Fase Knockout:{' '}
              <strong style={{ color: knockoutRegistration === 'true' ? '#4ade80' : '#f87171' }}>
                {knockoutRegistration === 'true' ? '🟢 Abierto' : '🔴 Cerrado'}
              </strong>
            </div>
            <button className="btn" onClick={handleToggleKnockoutReg}
              disabled={togglingKnockoutReg || knockoutRegistration === null}
              style={{ background: knockoutRegistration === 'true' ? '#dc2626' : '#16a34a', color: '#fff', border: 'none', fontWeight: '600', fontSize: '0.85rem' }}>
              {togglingKnockoutReg ? 'Cambiando...' : knockoutRegistration === 'true' ? '🔒 Cerrar registro' : '🔓 Abrir registro'}
            </button>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'results',  label: '⚽ Resultados' },
          { id: 'players',  label: '👥 Jugadores' },
          { id: 'knockout', label: `⚡ Knockout${knockoutMetrics.pending > 0 ? ` (${knockoutMetrics.pending})` : ''}` },
        ].map(tab => (
          <button
            key={tab.id}
            className="btn"
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? 'var(--accent)' : 'var(--bg-secondary)',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? '700' : '400',
              // Badge visual si hay pendientes en knockout
              outline: tab.id === 'knockout' && knockoutMetrics.pending > 0 && activeTab !== 'knockout'
                ? '2px solid #facc15'
                : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: RESULTADOS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'results' && (
        <div>
          {calcMessage && (
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--error)', borderRadius: '8px',
              padding: '0.75rem 1rem', marginBottom: '1rem',
              fontSize: '0.85rem', color: 'var(--error)', fontWeight: '600'
            }}>
              {calcMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {[
              { value: 'all',      label: 'Todos' },
              { value: 'upcoming', label: '🕐 Pendientes' },
              { value: 'finished', label: '✅ Finalizados' },
              ...groups.map(g => ({ value: g, label: `Grupo ${g}` }))
            ].map(f => (
              <button key={f.value} className="btn" onClick={() => setMatchFilter(f.value)}
                style={{
                  fontSize: '0.8rem', padding: '0.3rem 0.75rem',
                  background: matchFilter === f.value ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: matchFilter === f.value ? '#f4e7e7' : 'var(--text-secondary)',
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {!loadingMatches && !errorMatches && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Mostrando {filteredMatches.length} de {matches.length} partidos
              {' · '}<span style={{ color: '#4ade80' }}>{matches.filter(m => m.status === 'finished').length} finalizados</span>
              {' · '}<span style={{ color: '#facc15' }}>{matches.filter(m => m.status !== 'finished').length} pendientes</span>
            </div>
          )}

          {errorMatches && (
            <div className="card" style={{ color: 'var(--error)', textAlign: 'center', padding: '2rem' }}>
              ❌ Error al cargar partidos: {errorMatches}
              <br />
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={refetchMatches}>Reintentar</button>
            </div>
          )}
          {loadingMatches && !errorMatches && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando partidos...</div>
          )}

          {!loadingMatches && !errorMatches && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
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
                  onEdit={(m) => { setEditingMatch(m); setHomeScore(m.home_score ?? ''); setAwayScore(m.away_score ?? ''); setResultError('') }}
                  onSave={handleSaveResult}
                  onCancel={() => { setEditingMatch(null); setHomeScore(''); setAwayScore(''); setResultError('') }}
                  onHomeScoreChange={(v) => { setResultError(''); setHomeScore(v) }}
                  onAwayScoreChange={(v) => { setResultError(''); setAwayScore(v) }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: JUGADORES (Groups)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'players' && (
        <div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.75rem', marginBottom: '1.25rem'
          }}>
            {[
              { label: 'Total',           value: metrics.total,         color: 'var(--text-primary)' },
              { label: '✅ Activos',       value: metrics.activos,       color: '#4ade80' },
              { label: '⏳ Pendientes',    value: metrics.pending,       color: '#facc15' },
              { label: '💳 MP',            value: metrics.mp,            color: '#60a5fa' },
              { label: '🏦 Transferencia', value: metrics.transferencia, color: '#c084fc' },
              { label: '💵 Efectivo',      value: metrics.efectivo,      color: '#34d399' },
            ].map(m => (
              <div key={m.label} className="card" style={{ textAlign: 'center', padding: '0.75rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: m.color }}>{m.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <input type="text" placeholder="🔍 Buscar por nombre o email..."
              value={playerSearch} onChange={e => setPlayerSearch(e.target.value)}
              style={{
                flex: '1', minWidth: '200px', padding: '0.5rem 0.75rem',
                borderRadius: '8px', border: '1px solid var(--border)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem'
              }} />
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { value: 'all',      label: 'Todos' },
                { value: 'active',   label: '✅ Activos' },
                { value: 'pending',  label: '⏳ Pendientes' },
                { value: 'mp',       label: '💳 MP' },
                { value: 'transfer', label: '🏦 Transferencia' },
                { value: 'efectivo', label: '💵 Efectivo' },
              ].map(f => (
                <button key={f.value} className="btn" onClick={() => setPlayerFilter(f.value)}
                  style={{
                    fontSize: '0.78rem', padding: '0.3rem 0.65rem',
                    background: playerFilter === f.value ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: playerFilter === f.value ? '#fff' : 'var(--text-secondary)',
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {errorPlayers && (
            <div className="card" style={{ color: 'var(--error)', textAlign: 'center', padding: '2rem' }}>
              ❌ Error al cargar jugadores: {errorPlayers}
              <br />
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={refetchPlayers}>Reintentar</button>
            </div>
          )}
          {loadingPlayers && !errorPlayers && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando jugadores...</div>
          )}
          {!loadingPlayers && !errorPlayers && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Mostrando {filteredPlayers.length} de {players.length} jugadores
            </div>
          )}

          {!loadingPlayers && !errorPlayers && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {filteredPlayers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No hay jugadores con ese filtro
                </div>
              )}
              {filteredPlayers.map(player => (
                <div key={player.id} className="card" style={{ padding: '0.85rem 1.1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', marginBottom: '0.2rem' }}>
                        {player.username || '(sin username)'}
                        {player.is_superadmin && (
                          <span style={{ fontSize: '0.7rem', background: '#4c1d95', color: '#e9d5ff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>👑 SuperAdmin</span>
                        )}
                        {player.is_admin && !player.is_superadmin && (
                          <span style={{ fontSize: '0.7rem', background: '#1e3a5f', color: '#60a5fa', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>🔧 Admin</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{player.email}</div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.72rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
                          background: player.status === 'active' ? '#166534' : '#78350f',
                          color: player.status === 'active' ? '#4ade80' : '#fbbf24'
                        }}>
                          {player.status === 'active' ? '✅ Activo' : '⏳ Pendiente'}
                        </span>
                        {player.payment_method && (
                          <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                            {player.payment_method === 'mp'       ? '💳 MercadoPago'   :
                             player.payment_method === 'transfer' ? '🏦 Transferencia' :
                             player.payment_method === 'efectivo' ? '💵 Efectivo'      :
                             player.payment_method}
                          </span>
                        )}
                        <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--gold)' }}>
                          ⭐ {player.points ?? 0} pts
                        </span>
                      </div>
                    </div>

                    {!player.is_superadmin && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {player.status !== 'active' && (
                          <>
                            <button className="btn"
                              onClick={() => handleConfirmPayment(player.id, 'transfer')}
                              disabled={confirmingId === player.id}
                              style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem', background: '#1e3a5f', color: '#60a5fa', border: '1px solid #60a5fa' }}>
                              {confirmingId === player.id ? '...' : '🏦 Transferencia'}
                            </button>
                            <button className="btn"
                              onClick={() => handleConfirmPayment(player.id, 'efectivo')}
                              disabled={confirmingId === player.id}
                              style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem', background: '#166534', color: '#4ade80', border: '1px solid #4ade80' }}>
                              {confirmingId === player.id ? '...' : '💵 Efectivo'}
                            </button>
                          </>
                        )}
                        {isSuperAdmin && (
                          <button className="btn" onClick={() => handleToggleAdmin(player)}
                            style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem', background: player.is_admin ? '#78350f' : '#1e3a5f', color: player.is_admin ? '#fbbf24' : '#60a5fa', border: `1px solid ${player.is_admin ? '#fbbf24' : '#60a5fa'}` }}>
                            {player.is_admin ? '⬇️ Quitar admin' : '⬆️ Hacer admin'}
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button className="btn btn-danger" onClick={() => handleDeleteUser(player)}
                            style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}>
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

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: KNOCKOUT
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'knockout' && (
        <div>
          {/* Métricas */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '0.75rem', marginBottom: '1.25rem'
          }}>
            {[
              { label: 'Total',           value: knockoutMetrics.total,    color: 'var(--text-primary)' },
              { label: '✅ Activos',       value: knockoutMetrics.activos,  color: '#4ade80' },
              { label: '⏳ Pendientes',    value: knockoutMetrics.pending,  color: '#facc15' },
              { label: '💳 MP',            value: knockoutMetrics.mp,       color: '#60a5fa' },
              { label: '🏦 Transferencia', value: knockoutMetrics.transfer, color: '#c084fc' },
              { label: '💵 Efectivo',      value: knockoutMetrics.efectivo, color: '#34d399' },
            ].map(m => (
              <div key={m.label} className="card" style={{ textAlign: 'center', padding: '0.75rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: m.color }}>{m.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Búsqueda + Filtros */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <input type="text" placeholder="🔍 Buscar por nombre o email..."
              value={knockoutSearch} onChange={e => setKnockoutSearch(e.target.value)}
              style={{
                flex: '1', minWidth: '200px', padding: '0.5rem 0.75rem',
                borderRadius: '8px', border: '1px solid var(--border)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem'
              }} />
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { value: 'all',      label: 'Todos' },
                { value: 'pending',  label: '⏳ Pendientes' },
                { value: 'active',   label: '✅ Activos' },
                { value: 'mp',       label: '💳 MP' },
                { value: 'transfer', label: '🏦 Transferencia' },
                { value: 'efectivo', label: '💵 Efectivo' },
              ].map(f => (
                <button key={f.value} className="btn" onClick={() => setKnockoutFilter(f.value)}
                  style={{
                    fontSize: '0.78rem', padding: '0.3rem 0.65rem',
                    background: knockoutFilter === f.value ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: knockoutFilter === f.value ? '#fff' : 'var(--text-secondary)',
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contador */}
          {!loadingKnockout && !errorKnockout && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Mostrando {filteredKnockoutEntries.length} de {knockoutEntries.length} entradas
              {knockoutMetrics.pending > 0 && (
                <span style={{ color: '#facc15', marginLeft: '0.5rem' }}>
                  · ⚠️ {knockoutMetrics.pending} pendiente{knockoutMetrics.pending !== 1 ? 's' : ''} de aprobación
                </span>
              )}
            </div>
          )}

          {/* Error / Loading */}
          {errorKnockout && (
            <div className="card" style={{ color: 'var(--error)', textAlign: 'center', padding: '2rem' }}>
              ❌ Error al cargar entries: {errorKnockout}
              <br />
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={refetchKnockout}>Reintentar</button>
            </div>
          )}
          {loadingKnockout && !errorKnockout && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Cargando entradas knockout...
            </div>
          )}

          {/* Lista */}
          {!loadingKnockout && !errorKnockout && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {filteredKnockoutEntries.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  {knockoutEntries.length === 0
                    ? 'Todavía no hay inscriptos en Knockout'
                    : 'No hay entradas con ese filtro'}
                </div>
              )}
              {filteredKnockoutEntries.map(entry => (
                <KnockoutEntryCard
                  key={entry.id}
                  entry={entry}
                  confirmingId={confirmingEntryId}
                  onConfirm={handleConfirmKnockoutEntry}
                  onRevoke={handleRevokeKnockoutEntry}
                  onDelete={handleDeleteKnockoutEntry} 
                  isSuperAdmin={isSuperAdmin}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
