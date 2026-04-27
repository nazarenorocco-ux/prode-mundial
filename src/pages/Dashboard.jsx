// src/pages/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import PredictionForm from '../components/PredictionForm'

export default function Dashboard() {
  const { user } = useAuth()
  const [matches, setMatches]         = useState([])
  const [predictions, setPredictions] = useState({})
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [activeGroup, setActiveGroup] = useState(null)
  const [userStatus, setUserStatus]   = useState(null)
  const [prodeStatus, setProdeStatus] = useState('open') // ✅ nuevo estado

  const fetchData = useCallback(async () => {
    if (!user?.id) return

    try {
      // ✅ Traemos perfil + prode_status en paralelo
      const [
        { data: profile,      error: profileError },
        { data: settingsData, error: settingsError },
        { data: matchesData,  error: matchesError },
        { data: predictionsData, error: predsError }
      ] = await Promise.all([
        supabase.from('profiles').select('status').eq('id', user.id).single(),
        supabase.from('settings').select('value').eq('key', 'prode_status').single(),
        supabase.from('matches').select('*').order('match_date', { ascending: true }),
        supabase.from('predictions').select('*').eq('user_id', user.id)
      ])

      if (profileError) throw profileError
      if (matchesError) throw matchesError
      if (predsError)   throw predsError
      // settingsError no es fatal — si falla, usamos 'open' por defecto

      setUserStatus(profile?.status || 'pendiente')
      setProdeStatus(settingsData?.value || 'open') // ✅ guardamos el estado global

      const predsMap = {}
      predictionsData?.forEach(p => {
        predsMap[p.match_id] = p
      })

      setMatches(matchesData || [])
      setPredictions(predsMap)

      if (matchesData?.length > 0) {
        setActiveGroup(prev => prev ?? (matchesData[0].group_name || 'Sin grupo'))
      }
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError('No se pudieron cargar los partidos.')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [fetchData, user?.id])

  // ── Cálculo de puntos ─────────────────────────────────────────────────
  const finishedMatches = matches.filter(m => m.status === 'finished')

  const totalPoints = finishedMatches.reduce(
    (sum, m) => sum + (predictions[m.id]?.points ?? 0),
    0
  )
  const exactCount = finishedMatches.filter(
    m => predictions[m.id]?.points === 3
  ).length
  const resultCount = finishedMatches.filter(
    m => predictions[m.id]?.points === 1
  ).length
  const missCount = finishedMatches.filter(
    m => predictions[m.id] != null && predictions[m.id].points === 0
  ).length
  const playedCount = finishedMatches.length
  // ─────────────────────────────────────────────────────────────────────

  const groupedMatches = matches.reduce((acc, match) => {
    const group = match.group_name || 'Sin grupo'
    if (!acc[group]) acc[group] = []
    acc[group].push(match)
    return acc
  }, {})

  const groups = Object.keys(groupedMatches).sort()

  // ── Loading / Error ───────────────────────────────────────────────────
  if (loading) return (
    <div className="main-container">
      <p className="loading-text">Cargando partidos...</p>
    </div>
  )

  if (error) return (
    <div className="main-container">
      <p className="error-text">{error}</p>
    </div>
  )
  // ─────────────────────────────────────────────────────────────────────

  if (userStatus === 'pendiente') {
    return (
      <div className="main-container">
        <div className="page-header">
          <h1>🏆 Mis Predicciones</h1>
        </div>
        <div className="match-card pending-card">
          <div className="pending-icon">🔒</div>
          <h2 className="pending-title">Pago pendiente de confirmación</h2>
          <p className="pending-desc">
            Tu pago está siendo verificado. Una vez confirmado vas a poder
            cargar tus predicciones.
          </p>
          <p className="pending-note">
            Si pagaste por transferencia, enviá el comprobante por WhatsApp
            y un administrador confirmará tu pago a la brevedad.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="main-container">
      <div className="page-header">
        <h1>🏆 Mis Predicciones</h1>
        <p>Ingresá el resultado que creés que va a salir en cada partido</p>
      </div>

      {/* ✅ Banner prode cerrado */}
      {prodeStatus === 'closed' && (
        <div className="match-card" style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid var(--error)',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          <p style={{ color: 'var(--error)', fontWeight: '700', fontSize: '1rem', margin: 0 }}>
            🔒 El prode está cerrado temporalmente. No se pueden cargar predicciones.
          </p>
        </div>
      )}

      {/* ── Banner de puntos ── */}
      {finishedMatches.length > 0 && (
        <div className="points-summary-banner">
          <div className="points-summary-main">
            <span className="points-summary-label">Mis puntos</span>
            <span className="points-summary-total">{totalPoints} pts</span>
          </div>
          <div className="points-summary-stats">
            <span className="stat-chip stat-exact">⚽ {exactCount} exactos</span>
            <span className="stat-chip stat-result">✓ {resultCount} correctos</span>
            <span className="stat-chip stat-miss">✗ {missCount} fallados</span>
            <span className="stat-chip stat-played">📋 {playedCount} jugados</span>
          </div>
        </div>
      )}

      {/* ── Tabs de grupos ── */}
      {groups.length > 0 && (
        <div className="group-tabs">
          {groups.map(group => (
            <button
              key={group}
              className={`group-tab ${activeGroup === group ? 'active' : ''}`}
              onClick={() => setActiveGroup(group)}
            >
              Grupo {group}
            </button>
          ))}
        </div>
      )}

      {/* ── Partidos del grupo activo ── */}
      <div className="group-matches">
        {activeGroup && groupedMatches[activeGroup]?.map(match => (
          <PredictionForm
            key={match.id}
            match={match}
            existingPrediction={predictions[match.id]}
            onSaved={fetchData}
            // ✅ si el prode está cerrado, forzamos lock en todos los partidos
            forceDisabled={prodeStatus === 'closed'}
          />
        ))}
      </div>

      {/* ── Empty state ── */}
      {matches.length === 0 && (
        <div className="empty-state">
          <p>⚽ Aún no hay partidos cargados</p>
        </div>
      )}
    </div>
  )
}
