// Dashboard.jsx
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatearFechaLarga } from '../utils/dateUtils'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isPredictionLocked = (matchDate, prodeStatus, matchStatus) => {
  if (prodeStatus === 'closed') return true
  if (matchStatus === 'finished') return true
  const match = new Date(matchDate)
  const now = new Date()
  return (match - now) < 30 * 60 * 1000
}

const getPointsLabel = (points) => {
  if (points === 3) return { label: '⭐ Exacto', bg: '#14532d', color: '#4ade80' }
  if (points === 1) return { label: '✓ Resultado', bg: '#1e3a5f', color: '#60a5fa' }
  if (points === 0) return { label: '✗ Sin puntos', bg: '#3b1414', color: '#f87171' }
  return null
}

// ─── Recuadro de resumen ─────────────────────────────────────────────────────
function StatsCard({ profile, predictions, matches, ranking }) {
  const finishedMatches = matches.filter(m => m.status === 'finished')
  const myPreds = finishedMatches.map(m => predictions[m.id]).filter(Boolean)
  const exactos = myPreds.filter(p => p.points === 3).length
  const resultados = myPreds.filter(p => p.points === 1).length
  const totalPts = profile?.points ?? 0

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      border: '1px solid #0f3460',
      borderRadius: '16px',
      padding: '1.25rem 1.5rem',
      marginBottom: '1.5rem',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
      gap: '1rem',
    }}>
      {/* Puntos */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#facc15', lineHeight: 1 }}>
          {totalPts}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
          Puntos totales
        </div>
      </div>

      {/* Puesto */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#60a5fa', lineHeight: 1 }}>
          {ranking ? `#${ranking}` : '-'}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
          Puesto
        </div>
      </div>

      {/* Exactos */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#4ade80', lineHeight: 1 }}>
          {exactos}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
          Exactos ⭐
        </div>
      </div>

      {/* Resultados */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#a78bfa', lineHeight: 1 }}>
          {resultados}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
          Resultados ✓
        </div>
      </div>

      {/* Predicciones cargadas */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f97316', lineHeight: 1 }}>
          {Object.keys(predictions).length}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
          Pronósticos
        </div>
      </div>
    </div>
  )
}

// ─── Card de partido ──────────────────────────────────────────────────────────
function MatchCard({ match, pred, locked, saving, prodeStatus, onSave, saveCount }) {
  const isFinished = match.status === 'finished'
  const pointsInfo = pred?.points != null ? getPointsLabel(pred.points) : null

  // Borde según estado
  const borderColor = isFinished
  ? (pred?.points === 3 ? '#4ade80' : pred?.points === 1 ? '#60a5fa' : pred?.points === 0 ? '#f87171' : '#475569')
  : locked
    ? '#64748b'
    : '#f59e0b'

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.6rem',
      transition: 'border-left-color 0.2s ease'
    }}>

      {/* ── Header: Grupo + Estado ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {match.group_name && (
          <span style={{
            fontSize: '0.7rem',
            background: 'var(--bg-secondary)',
            color: 'var(--text-muted)',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            fontWeight: '600'
          }}>
            Grupo {match.group_name}
          </span>
        )}
        <span style={{
          fontSize: '0.7rem',
          padding: '0.15rem 0.5rem',
          borderRadius: '4px',
          fontWeight: '600',
          marginLeft: 'auto',
          background: isFinished ? '#14532d' : locked ? '#1e293b' : '#78350f',
          color: isFinished ? '#4ade80' : locked ? '#64748b' : '#fbbf24'
        }}>
          {isFinished ? '✅ Finalizado' : locked ? '🔒 Bloqueado' : '🕐 Abierto'}
        </span>
      </div>

      {/* ── Equipos ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem'
      }}>
        {/* Local */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '0.3rem', flex: 1
        }}>
          {match.home_flag && (
            <img
              src={match.home_flag.trim()}
              alt={match.home_team}
              style={{ width: '40px', height: '28px', objectFit: 'cover', borderRadius: '3px' }}
            />
          )}
          <span style={{ fontSize: '0.82rem', fontWeight: '700', textAlign: 'center' }}>
            {match.home_team}
          </span>
        </div>

        {/* Marcador central */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
          {isFinished ? (
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              padding: '0.3rem 0.75rem',
              fontWeight: '800',
              fontSize: '1.3rem',
              letterSpacing: '0.1em',
              color: 'var(--text-primary)'
            }}>
              {match.home_score} - {match.away_score}
            </div>
          ) : (
            <span style={{ fontWeight: '700', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              VS
            </span>
          )}
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {formatearFechaLarga(match.match_date)}
          </span>
        </div>

        {/* Visitante */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '0.3rem', flex: 1
        }}>
          {match.away_flag && (
            <img
              src={match.away_flag.trim()}
              alt={match.away_team}
              style={{ width: '40px', height: '28px', objectFit: 'cover', borderRadius: '3px' }}
            />
          )}
          <span style={{ fontSize: '0.82rem', fontWeight: '700', textAlign: 'center' }}>
            {match.away_team}
          </span>
        </div>
      </div>

      {/* ── Separador ── */}
      <div style={{ borderTop: '1px solid var(--border)', margin: '0 -0.25rem' }} />

      {/* ── Zona de pronóstico ── */}
      {locked ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          {pred ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tu pronóstico:</span>
                <span style={{
                  background: 'var(--bg-secondary)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '1rem'
                }}>
                  {pred.home_score} - {pred.away_score}
                </span>
              </div>

              {/* Puntos del partido */}
              {isFinished && pointsInfo && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  background: pointsInfo.bg,
                  color: pointsInfo.color
                }}>
                  {pointsInfo.label} · {pred.points} pts
                </span>
              )}

              {/* Si está bloqueado pero no finalizado */}
              {!isFinished && (
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  ⏱ Bloqueado
                </span>
              )}
            </>
          ) : (
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
              ⏱ Sin pronóstico cargado
            </span>
          )}
        </div>
      ) : (
        <PredictionMiniForm
          key={`${match.id}-${pred?.home_score}-${pred?.away_score}-${saveCount}`}
          initialHome={pred?.home_score ?? ''}
          initialAway={pred?.away_score ?? ''}
          hasPrediction={!!pred}
          onSave={(home, away) => onSave(match.id, home, away)}
          disabled={saving}
        />
      )}
    </div>
  )
}

// ─── Mini Form ────────────────────────────────────────────────────────────────
function PredictionMiniForm({ initialHome, initialAway, onSave, disabled, hasPrediction }) {
  const [home, setHome] = useState(initialHome)
  const [away, setAway] = useState(initialAway)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      flexWrap: 'wrap'
    }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
        {hasPrediction ? '✏️ Tu pronóstico:' : '📝 Cargar pronóstico:'}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <input
          type="number" min="0" max="20"
          value={home}
          onChange={e => setHome(e.target.value)}
          style={{
            width: '52px', padding: '0.35rem',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            textAlign: 'center',
            fontSize: '1rem',
            fontWeight: '700'
          }}
        />
        <span style={{ fontWeight: '700', color: 'var(--text-muted)' }}>-</span>
        <input
          type="number" min="0" max="20"
          value={away}
          onChange={e => setAway(e.target.value)}
          style={{
            width: '52px', padding: '0.35rem',
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
      <button
        className="btn btn-primary"
        onClick={() => onSave(home, away)}
        disabled={disabled}
        style={{ fontSize: '0.85rem', padding: '0.35rem 0.9rem' }}
      >
        {hasPrediction ? '✓ Actualizar' : '💾 Guardar'}
      </button>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, profile } = useAuth()
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState({})
  const [prodeStatus, setProdeStatus] = useState('open')
  const [ranking, setRanking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saveCount, setSaveCount] = useState(0)
  const [matchFilter, setMatchFilter] = useState('all')
  const hasFetched = useRef(false)
  const currentUserId = useRef(null)

  // ── Fetch principal ──────────────────────────────────────────────────────────
  const fetchData = async (userId) => {
    try {
      setLoading(true)
      setError('')

      const [
        { data: matchesData },
        { data: settingsData },
        { data: predsData },
        { data: rankingData }
      ] = await Promise.all([
        supabase.from('matches').select('*').order('match_date', { ascending: true }),
        supabase.from('settings').select('*').eq('key', 'prode_status').maybeSingle(),
        supabase.from('predictions').select('*').eq('user_id', userId),
        supabase.from('profiles').select('id, points').order('points', { ascending: false })
      ])

      setMatches(matchesData || [])
      setProdeStatus(settingsData?.value || 'open')

      const predMap = {}
      ;(predsData || []).forEach(p => { predMap[p.match_id] = p })
      setPredictions(predMap)

      // Calcular puesto
      if (rankingData) {
        const idx = rankingData.findIndex(p => p.id === userId)
        setRanking(idx >= 0 ? idx + 1 : null)
      }
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los partidos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    if (hasFetched.current && currentUserId.current === user.id) return
    hasFetched.current = true
    currentUserId.current = user.id
    fetchData(user.id)
  }, [user])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && hasFetched.current) {
        refreshPredictions(user.id)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user])

  const refreshPredictions = async (userId) => {
    try {
      const { data: predsData } = await supabase
        .from('predictions').select('*').eq('user_id', userId)
      const predMap = {}
      ;(predsData || []).forEach(p => { predMap[p.match_id] = p })
      setPredictions(predMap)
    } catch (err) {
      console.error('Error en refresh silencioso:', err)
    }
  }

  // ── Guardar pronóstico ───────────────────────────────────────────────────────
  const handleSavePrediction = async (matchId, homeScore, awayScore) => {
    try {
      setSaving(true)
      setError('')
      setMessage('')

      const match = matches.find(m => m.id === matchId)
      if (!match) throw new Error('Partido no encontrado')
      if (isPredictionLocked(match.match_date, prodeStatus))
        throw new Error('Este partido ya está bloqueado')

      const { error } = await supabase.from('predictions').upsert({
        user_id: user.id,
        match_id: matchId,
        home_score: Number(homeScore),
        away_score: Number(awayScore)
      }, { onConflict: 'user_id,match_id' })

      if (error) throw error

      setMessage('Pronóstico guardado ✅')
      setTimeout(() => setMessage(''), 3000)
      await refreshPredictions(user.id)
      setSaveCount(prev => prev + 1)
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo guardar la predicción')
    } finally {
      setSaving(false)
    }
  }

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const groups = [...new Set(matches.map(m => m.group_name).filter(Boolean))].sort()

  const filteredMatches = matches.filter(m => {
    if (matchFilter === 'all')      return true
    if (matchFilter === 'finished') return m.status === 'finished'
    if (matchFilter === 'upcoming') return m.status !== 'finished'
    return m.group_name === matchFilter
  })

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      Cargando partidos...
    </div>
  )

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.25rem' }}>
          ⚽ Mi Prode
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Hola, <strong>{profile?.full_name || profile?.username || user?.email}</strong>
        </p>
      </div>

      {/* Banner prode cerrado */}
      {prodeStatus === 'closed' && (
        <div style={{
          background: '#3b1414',
          border: '1px solid #f87171',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          color: '#f87171',
          fontWeight: '600',
          fontSize: '0.9rem'
        }}>
          🔴 El prode está cerrado temporalmente.
        </div>
      )}

      {/* Mensajes */}
      {error && (
        <div style={{
          background: '#3b1414', border: '1px solid #f87171',
          borderRadius: '8px', padding: '0.75rem 1rem',
          marginBottom: '1rem', color: '#f87171', fontSize: '0.9rem'
        }}>
          ❌ {error}
        </div>
      )}
      {message && (
        <div style={{
          background: '#14532d', border: '1px solid #4ade80',
          borderRadius: '8px', padding: '0.75rem 1rem',
          marginBottom: '1rem', color: '#4ade80', fontSize: '0.9rem'
        }}>
          {message}
        </div>
      )}

      {/* Stats Card */}
      <StatsCard
        profile={profile}
        predictions={predictions}
        matches={matches}
        ranking={ranking}
      />

      {/* Sistema de puntos */}
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '0.6rem 1rem',
        marginBottom: '1.25rem',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        fontSize: '0.78rem',
        color: 'var(--text-muted)'
      }}>
        <span>📋 Sistema de puntos:</span>
        <span style={{ color: '#4ade80' }}>⭐ Resultado exacto = <strong>3 pts</strong></span>
        <span style={{ color: '#60a5fa' }}>✓ Ganador correcto = <strong>1 pt</strong></span>
        <span style={{ color: '#f87171' }}>✗ Incorrecto = <strong>0 pts</strong></span>
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
              fontWeight: matchFilter === f.value ? '700' : '400'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Contador */}
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        Mostrando {filteredMatches.length} de {matches.length} partidos
        {' · '}
        <span style={{ color: '#4ade80' }}>
          {matches.filter(m => m.status === 'finished').length} finalizados
        </span>
        {' · '}
        <span style={{ color: '#facc15' }}>
          {matches.filter(m => m.status !== 'finished').length} pendientes
        </span>
      </div>

      {/* Grid de partidos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))',
        gap: '0.75rem'
      }}>
        {filteredMatches.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-muted)'
          }}>
            No hay partidos con ese filtro
          </div>
        )}

        {filteredMatches.map(match => (
          <MatchCard
            key={match.id}
            match={match}
            pred={predictions[match.id]}
            locked={isPredictionLocked(match.match_date, prodeStatus, match.status)}
            saving={saving}
            prodeStatus={prodeStatus}
            onSave={handleSavePrediction}
            saveCount={saveCount}
          />
        ))}
      </div>
    </div>
  )
}
