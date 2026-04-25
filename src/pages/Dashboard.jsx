import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PredictionForm from '../components/PredictionForm'

export default function Dashboard() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
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
  }

  const isLocked = (matchDate) => {
    const kickoff = new Date(matchDate)
    const now = new Date()
    const diff = kickoff - now
    return diff < 60 * 60 * 1000
  }

  // Agrupar partidos por grupo
  const groupedMatches = matches.reduce((acc, match) => {
    const group = match.group_name || 'Sin grupo'
    if (!acc[group]) acc[group] = []
    acc[group].push(match)
    return acc
  }, {})

  if (loading) return (
    <div className="main-container">
      <p style={{ color: 'var(--text-muted)' }}>Cargando partidos...</p>
    </div>
  )

  return (
    <div className="main-container">
      <div className="page-header">
        <h1>🏆 Mis Predicciones</h1>
        <p>Ingresá el resultado que creés que va a salir en cada partido</p>
      </div>

      {Object.keys(groupedMatches).sort().map(group => (
        <div key={group}>
          <div className="group-title">Grupo {group}</div>
          {groupedMatches[group].map(match => (
            <PredictionForm
              key={match.id}
              match={match}
              existingPrediction={predictions[match.id]}
              locked={isLocked(match.match_date)}
              onSaved={fetchData}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
