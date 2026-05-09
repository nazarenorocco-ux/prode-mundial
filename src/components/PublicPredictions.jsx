import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function PublicPredictions({ matchId }) {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchPredictions = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_public_predictions', {
        p_match_id: matchId,
      });

      if (error) {
        console.error('Error fetching public predictions:', error);
      } else {
        setPredictions(data || []);
      }
      setLoading(false);
    };

    fetchPredictions();
  }, [open, matchId]);

  return (
    <div className="public-predictions">
      <button
        className="public-predictions-toggle"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? '▲ Ocultar pronósticos' : '▼ Ver pronósticos de todos'}
      </button>

      {open && (
        <div className="public-predictions-table-wrapper">
          {loading ? (
            <p className="public-predictions-loading">Cargando...</p>
          ) : (
            <table className="public-predictions-table">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Pronóstico</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((pred) => {
                  const isMe = pred.user_id === user?.id;
                  const displayName = pred.username || pred.full_name || 'Anónimo';
                  const score =
                    pred.home_score !== null && pred.away_score !== null
                      ? `${pred.home_score} - ${pred.away_score}`
                      : '—';
                  const pts =
                    pred.points !== null ? pred.points : '—';

                  return (
                    <tr key={pred.user_id} className={isMe ? 'is-me' : ''}>
                      <td>
                        {displayName}
                        {isMe && <span className="me-badge"> vos</span>}
                      </td>
                      <td>{score}</td>
                      <td>{pts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
