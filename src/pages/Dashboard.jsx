import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PredictionForm from '../components/PredictionForm'

export default function Dashboard() {
  const { user } = useAuth()
  const [matches, setMatches]       = useState([])
  const [predictions, setPredictions] = useState({})
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [activeGroup, setActiveGroup] = useState(null)
  const [userStatus, setUserStatus] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      setUserStatus(profile?.status || 'pendiente')

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true })

      if (matchesError) throw matchesError

      const { data: predictionsData, error: predsError } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)

      if (predsError) throw predsError

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
  }, [user.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Cálculo de puntos acumulados ──────────────────────────────────────
  const finishedMatches = matches.filter(m => m.status === 'finished')

  const totalPoints = finishedMatches.reduce(
    (sum, m) => sum + (predictions[m.id]?.points ?? 0),
    0
  )
  const exactCount  = finishedMatches.filter(
    m => predictions[m.id]?.points === 3
  ).length
  const resultCount = finishedMatches.filter(
    m => predictions[m.id]?.points === 1
  ).length
  // Solo cuentan como "fallados" los partidos donde el usuario
  // cargó predicción y salió 0 puntos (no los que no predijo)
  const missCount   = finishedMatches.filter(
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

  // ── Estados de carga y error ──────────────────────────────────────────
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

      {/* ── Banner de puntos (solo si hay partidos jugados) ── */}
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
          />
        ))}
      </div>

      {/* ── Empty state si no hay partidos ── */}
      {matches.length === 0 && (
        <div className="empty-state">
          <p>⚽ Aún no hay partidos cargados</p>
        </div>
      )}
    </div>
  )
}
