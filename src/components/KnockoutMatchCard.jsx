// KnockoutMatchCard.jsx
import { useState, useEffect, useMemo } from 'react';
import { formatMatchDate } from '../utils/dateUtils';


function PointsBadge({ isFinished, prediction }) {
  if (!isFinished || !prediction) return null;
  const pts = prediction.points ?? 0;
  if (pts >= 3) return <span className="points-badge points-exact">⭐ {pts} pts</span>;
  if (pts >= 1) return <span className="points-badge points-result">✓ {pts} pts</span>;
  return <span className="points-badge points-none">✗ {pts} pts</span>;
}


export default function KnockoutMatchCard({ match, prediction, locked, onSave }) {
  const {
    id,
    home_team, away_team,
    home_flag, away_flag,
    home_slot, away_slot,
    home_score_90, away_score_90,
    home_score_120, away_score_120,
    home_penalties, away_penalties,
    went_to_extra_time, went_to_penalties,
    status,
    match_date,
    stadium,
  } = match;

  const teamsAssigned = home_team && away_team;
  const isFinished    = status === 'finished';

  // ─── Estado local de inputs ───────────────────────────────────────────────
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [homePen,   setHomePen]   = useState('');
  const [awayPen,   setAwayPen]   = useState('');
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  // Inicializar con predicción existente
  useEffect(() => {
    if (prediction) {
      setHomeScore(prediction.home_score ?? '');
      setAwayScore(prediction.away_score ?? '');
      setHomePen(prediction.home_penalties ?? '');
      setAwayPen(prediction.away_penalties ?? '');
    }
  }, [prediction]);

  // ─── ¿Es empate en la predicción? (mostrar penales) ──────────────────────
  const isDraw = homeScore !== '' && awayScore !== '' &&
                 Number(homeScore) === Number(awayScore);

  // ─── Guardar ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (locked || !teamsAssigned || saving) return;
    if (homeScore === '' || awayScore === '') return;

    setSaving(true);
    try {
      await onSave(
        id,
        Number(homeScore),
        Number(awayScore),
        isDraw ? (homePen !== '' ? Number(homePen) : null) : null,
        isDraw ? (awayPen !== '' ? Number(awayPen) : null) : null,
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  // ─── Resultado final a mostrar ────────────────────────────────────────────
  const finalHome = home_score_120 ?? home_score_90;
  const finalAway = away_score_120 ?? away_score_90;

 // ─── Color de borde lateral izquierdo según estado ───────────────────────
  const cardStyle = useMemo( () => {
    if (isFinished) {
      const pts = prediction?.points ?? null;
      if (pts === null) return {};
      if (pts >= 3) return { borderLeftColor: '#4ade80', borderLeftWidth: '3px', borderLeftStyle: 'solid' };
      if (pts >= 1) return { borderLeftColor: '#60a5fa', borderLeftWidth: '3px', borderLeftStyle: 'solid' };
      return { borderLeftColor: '#ef4444', borderLeftWidth: '3px', borderLeftStyle: 'solid' };
    }
    if (locked)         return { borderLeftColor: '#f97316', borderLeftWidth: '3px', borderLeftStyle: 'solid' };
    if (!teamsAssigned) return {};
    if (prediction)     return { borderLeftColor: '#facc15', borderLeftWidth: '3px', borderLeftStyle: 'solid' };
    return {};
  }, [isFinished, locked, teamsAssigned, prediction]);


 // ─── Badge de puntos ──────────────────────────────────────────────────────
  const pointsBadge = <PointsBadge isFinished={isFinished} prediction={prediction} />;


  return (
    <div className="match-card" style={cardStyle}>

      {/* ── Cabecera: equipos + marcador central ── */}
      <div className="match-header">

        {/* Local */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: 0 }}>
          {teamsAssigned ? (
            <>
              {home_flag
                ? <img src={home_flag} alt={home_team} className="flag-img" style={{ width: 32, height: 'auto' }} />
                : <span style={{ fontSize: '1.5rem' }}>🏳️</span>
              }
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', textAlign: 'center', lineHeight: 1.3 }}>
                {home_team}
              </span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '1.5rem' }}>🏳️</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic', lineHeight: 1.3 }}>
                {home_slot || '???'}
              </span>
            </>
          )}
        </div>

        {/* Centro */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', flexShrink: 0, minWidth: 80 }}>

          {/* Resultado oficial (partido terminado) */}
          {isFinished && finalHome !== null && finalAway !== null && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-h)', lineHeight: 1 }}>
                {finalHome} – {finalAway}
              </div>
              {went_to_extra_time && !went_to_penalties && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Prórroga</div>
              )}
              {went_to_penalties && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Pen. {home_penalties}–{away_penalties}
                </div>
              )}
            </div>
          )}

          {/* Inputs / estado bloqueado */}
          {!teamsAssigned ? (
            <span style={{ fontSize: '1.3rem' }} title="Equipos aún no definidos">🔒</span>
          ) : locked ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🔒</span>
              {prediction ? (
                <>
                  <div className="score-separator" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                    {prediction.home_score} – {prediction.away_score}
                  </div>
                  {prediction.home_penalties != null && prediction.away_penalties != null && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Pen. {prediction.home_penalties}–{prediction.away_penalties}
                    </div>
                  )}
                </>
              ) : (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sin pronóstico</span>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              {/* Score inputs */}
              <div className="score-input">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={homeScore}
                  onChange={e => setHomeScore(e.target.value)}
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                />
                <span className="score-separator">–</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={awayScore}
                  onChange={e => setAwayScore(e.target.value)}
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                />
              </div>

              {/* Penales (solo si empate) */}
              {isDraw && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Penales
                  </span>
                  <div className="score-input">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={homePen}
                      onChange={e => setHomePen(e.target.value)}
                      placeholder="0"
                      style={{
                        WebkitAppearance: 'none', MozAppearance: 'textfield',
                        borderColor: 'rgba(234,179,8,0.5)',
                        color: '#fde047',
                        width: 44,
                      }}
                    />
                    <span className="score-separator">–</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={awayPen}
                      onChange={e => setAwayPen(e.target.value)}
                      placeholder="0"
                      style={{
                        WebkitAppearance: 'none', MozAppearance: 'textfield',
                        borderColor: 'rgba(234,179,8,0.5)',
                        color: '#fde047',
                        width: 44,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Visitante */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: 0 }}>
          {teamsAssigned ? (
            <>
              {away_flag
                ? <img src={away_flag} alt={away_team} className="flag-img" style={{ width: 32, height: 'auto' }} />
                : <span style={{ fontSize: '1.5rem' }}>🏳️</span>
              }
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', textAlign: 'center', lineHeight: 1.3 }}>
                {away_team}
              </span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '1.5rem' }}>🏳️</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic', lineHeight: 1.3 }}>
                {away_slot || '???'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Footer: fecha / estadio / puntos / botón ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        paddingTop: '0.6rem',
        borderTop: '1px solid var(--border)',
        marginTop: '0.2rem',
      }}>

        {/* Fecha + estadio */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {match_date
              ? <><span>📅</span>{formatMatchDate(match_date)}</>
              : <span style={{ fontStyle: 'italic' }}>Fecha a confirmar</span>
            }
          </span>
          {stadium && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', maxWidth: '50%' }}>
              <span>🏟️</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stadium}</span>
            </span>
          )}
        </div>

        {/* Acción / puntos */}
        {isFinished && prediction ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            {pointsBadge}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Pronóstico: {prediction.home_score}–{prediction.away_score}
              {prediction.home_penalties != null && prediction.away_penalties != null &&
                ` (pen. ${prediction.home_penalties}–${prediction.away_penalties})`
              }
            </span>
          </div>
        ) : isFinished && !prediction ? (
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Sin pronóstico
          </div>
        ) : locked ? (
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#f97316' }}>
            ⏳ Partido próximo a comenzar
          </div>
        ) : !teamsAssigned ? (
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Equipos pendientes de definición
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving || homeScore === '' || awayScore === ''}
            className="btn btn-primary btn-full"
            style={
              saved    ? { background: 'var(--success)', color: '#0f172a' } :
              saving   ? { opacity: 0.6, cursor: 'wait' } :
              (homeScore === '' || awayScore === '') ? { opacity: 0.45, cursor: 'not-allowed' } :
              {}
            }
          >
            {saved ? '✓ Guardado' : saving ? 'Guardando...' : prediction ? 'Actualizar' : 'Guardar'}
          </button>
        )}
      </div>

    </div>
  );
}
