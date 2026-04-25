import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Leaderboard() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()

    // Suscripción en tiempo real
    const channel = supabase
      .channel('leaderboard')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        () => fetchLeaderboard()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('username, points')
      .order('points', { ascending: false })

    setPlayers(data || [])
    setLoading(false)
  }

  const getMedal = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `#${index + 1}`
  }

  if (loading) return (
    <div className="main-container">
      <p style={{ color: 'var(--text-muted)' }}>Cargando tabla...</p>
    </div>
  )

  return (
    <div className="main-container">
      <div className="page-header">
        <h1>🏆 Tabla de Posiciones</h1>
        <p>{players.length} jugadores participando</p>
      </div>

      <div className="leaderboard-card">
        {players.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            Aún no hay puntos cargados
          </p>
        ) : (
          players.map((player, index) => (
            <div
              key={player.username}
              className={`leaderboard-row ${index < 3 ? 'top-three' : ''}`}
            >
              <div className="leaderboard-rank">
                {getMedal(index)}
              </div>
              <div className="leaderboard-name">
                {player.username}
              </div>
              <div className="leaderboard-points">
                {player.points} pts
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
