import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Leaderboard() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, points')
        .eq('status', 'activo')
        .order('points', { ascending: false })

      if (error) throw error
      setPlayers(data || [])
    } catch {
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

  const getRankDisplay = (index) => {
    const medals = ['🥇', '🥈', '🥉']
    return medals[index] ?? null
  }

  const getRankClass = (index) => {
    if (index === 0) return 'top-1'
    if (index === 1) return 'top-2'
    if (index === 2) return 'top-3'
    return ''
  }

  if (loading) return (
    <div className="main-container">
      <p className="loading-text">Cargando tabla...</p>
    </div>
  )

  if (error) return (
    <div className="main-container">
      <p className="error-text">{error}</p>
    </div>
  )

  return (
    <div className="main-container">
      <div className="page-header">
        <h1>🏆 Tabla de Posiciones</h1>
        <p>{players.length} jugadores participando</p>
      </div>

      {/* "leaderboard" es la clase definida en App.css */}
      <div className="leaderboard">
        {players.length === 0 ? (
          <p
            style={{
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '2rem'
            }}
          >
            Aún no hay puntos cargados
          </p>
        ) : (
          players.map((player, index) => (
            <div key={player.id} className="leaderboard-row">
              <div className={`leaderboard-rank ${getRankClass(index)}`}>
                {getRankDisplay(index) ?? `#${index + 1}`}
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
