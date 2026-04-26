import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PredictionForm from '../components/PredictionForm'

export default function Dashboard() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeGroup, setActiveGroup] = useState(null)
  const [userStatus, setUserStatus] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single()

      setUserStatus(profile?.status || 'pendiente')

      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true })

      const { data: predictionsData } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)

      const predsMap = {}
      predictionsData?.forEach(p => {
        predsMap[p.match_id] = p
      })

      setMatches(matchesData || [])
      setPredictions(predsMap)

      if (matchesData?.length > 0) {
        setActiveGroup(prev => prev ?? (matchesData[0].group_name || 'Sin grupo'))
      }
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Cálculo de puntos acumulados ──────────────────────────────────────
  const finishedMatches = matches.filter(m => m.status === 'finished')
  const totalPoints = finishedMatches.reduce((sum, match) => {
    const pred = predictions[match.id]
    return sum + (pred?.points ?? 0)
  }, 0)

  const exactCount  = finishedMatches.filter(m => predictions[m.id]?.points === 3).length
  const resultCount = finishedMatches.filter(m => predictions[m.id]?.points === 1).length
  const missCount   = finishedMatches.filter(m => predictions[m.id]?.points === 0 && predictions[m.id] != null).length
  const playedCount = finishedMatches.length
  // ─────────────────────────────────────────────────────────────────────

  const groupedMatches = matches.reduce((acc, match) => {
    const group = match.group_name || 'Sin grupo'
    if (!acc[group]) acc[group] = []
    acc[group].push(match)
    return acc
  }, {})

  const groups = Object.keys(groupedMatches).sort()

  if (loading) return (
    <div className="main-container">
      <p style={{ color: 'var(--text-muted)' }}>Cargando partidos...</p>
    </div>
  )

  if (userStatus === 'pendiente') {
    return (
      <div className="main-container">
        <div className="page-header">
          <h1>🏆 Mis Predicciones</h1>
        </div>
        <div className="match-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ color: 'var(--gold)', marginBottom: '0.75rem' }}>
            Pago pendiente de confirmación
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1rem' }}>
            Tu pago está siendo verificado. Una vez confirmado vas a poder cargar tus predicciones.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Si pagaste en efectivo, un administrador confirmará tu pago a la brevedad.
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
    </div>
  )
}
