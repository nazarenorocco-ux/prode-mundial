import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Leaderboard() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, points')
        .eq('status', 'activo')
        .order('points', { ascending: false })

      if (error) throw error
      setPlayers(data || [])
    } catch (err) {
      setError('No se pudo cargar la tabla.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()

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

  const getMedal = (index) => {
    const medals = ['🥇', '🥈', '🥉']
    return medals[index] ?? `#${index + 1}`
  }

  if (loading) return (
    <div className="main-container">
      <p style={{ color: 'var(--text-muted)' }}>Cargando tabla...</p>
    </div>
  )

  if (error) return (
    <div className="main-container">
      <p style={{ color: 'var(--error)' }}>{error}</p>
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
              key={player.id}
              className={`leaderboard-row ${index < 3 ? 'top-three' : ''}`}
            >
              <div className="leaderboard-rank">
                {getMedal(index)}
              </div>
              <div className="leaderboard-name">
                {player.username}
              </div>
              <div className="leaderboard-points">
                {player.points ?? 0} pts
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
