import { useState, useEffect } from 'react'
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

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
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
    setLoading(false)

    if (matchesData?.length > 0) {
      const firstGroup = matchesData[0].group_name || 'Sin grupo'
      setActiveGroup(firstGroup)
    }
  }

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
