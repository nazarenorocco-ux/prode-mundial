// src/components/KnockoutMatchCard.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatMatchDate } from '../utils/dateUtils';

function PointsBadge({ isFinished, prediction }) {
  if (!isFinished || !prediction) return null;
  const pts = prediction.points ?? 0;
  if (pts >= 3) return <span className="points-badge points-exact">⭐ {pts} pts</span>;
  if (pts >= 1) return <span className="points-badge points-result">✓ {pts} pts</span>;
  return <span className="points-badge points-none">✗ {pts} pts</span>;
}

// ─── Sub-componente: lista de pronósticos públicos ────────────────────────────
function PublicPredictions({ matchId, currentUserId }) {
  const [preds, setPreds]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    if (!matchId) return;
    supabase
      .rpc('get_public_knockout_predictions', { p_match_id: matchId })
      .then(({ data }) => {
        setPreds(data || []);
        setLoading(false);
      });
  }, [matchId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '0.5rem 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Cargando pronósticos…
      </div>
    );
  }

  if (preds.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '0.5rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        Nadie pronosticó este partido aún
      </div>
    );
  }

  // Siempre mostrar el pronóstico del usuario actual primero
  const sorted = [...preds].sort((a, b) => {
    if (a.user_id === currentUserId) return -1;
    if (b.user_id === currentUserId) return 1;
    return (a.full_name || a.username || '').localeCompare(b.full_name || b.username || '');
  });

  // Mostrar solo 3 primeros si está colapsado
  const PREVIEW_COUNT = 3;
  const visible = open ? sorted : sorted.slice(0, PREVIEW_COUNT);
  const hasMore  = sorted.length > PREVIEW_COUNT;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {visible.map((p) => {
        const isMe  = p.user_id === currentUserId;
        const name  = p.full_name || p.username || 'Anónimo';
        const pts   = p.points ?? 0;
        const hasPen = p.home_penalties != null && p.away_penalties != null;

        return (
          <div
            key={p.user_id}
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              padding:        '0.35rem 0.6rem',
              borderRadius:   6,
              background:     isMe
                ? 'rgba(56,189,248,0.12)'
                : 'rgba(255,255,255,0.04)',
              border: isMe
                ? '1px solid rgba(56,189,248,0.3)'
                : '1px solid transparent',
              fontSize: '0.78rem',
              gap: '0.5rem',
            }}
          >
            {/* Nombre */}
            <span style={{
              color:     isMe ? '#38bdf8' : 'var(--text)',
              fontWeight: isMe ? 700 : 400,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {isMe ? '👤 Vos' : name}
            </span>

            {/* Score */}
            <span style={{
              fontWeight: 700,
              color: 'var(--text-h)',
              flexShrink: 0,
              minWidth: 44,
              textAlign: 'center',
            }}>
              {p.home_score} – {p.away_score}
              {hasPen && (
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', lineHeight: 1 }}>
                  pen. {p.home_penalties}–{p.away_penalties}
                </span>
              )}
            </span>

            {/* Puntos (solo si hay) */}
            {pts > 0 && (
              <span style={{
                flexShrink: 0,
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.1rem 0.4rem',
                borderRadius: 4,
                background: pts >= 3 ? 'rgba(74,222,128,0.15)' : 'rgba(96,165,250,0.15)',
                color:      pts >= 3 ? '#4ade80' : '#60a5fa',
              }}>
                {pts >= 3 ? '⭐' : '✓'} {pts}
              </span>
            )}
          </div>
        );
      })}

      {/* Botón ver más / menos */}
      {hasMore && (
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            background: 'none',
            border:     'none',
            color:      'var(--text-muted)',
            fontSize:   '0.75rem',
            cursor:     'pointer',
            padding:    '0.25rem 0',
            textAlign:  'center',
          }}
        >
          {open
            ? '▲ Ver menos'
            : `▼ Ver ${sorted.length - PREVIEW_COUNT} más`
          }
        </button>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function KnockoutMatchCard({ match, prediction, locked, onSave, currentUserId }) {
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

  // ─── Sección pronósticos públicos: toggle ────────────────────────────────
  const [showPublic, setShowPublic] = useState(false);

  useEffect(() => {
    if (prediction) {
      setHomeScore(prediction.home_score ?? '');
      setAwayScore(prediction.away_score ?? '');
      setHomePen(prediction.home_penalties ?? '');
      setAwayPen(prediction.away_penalties ?? '');
    }
  }, [prediction]);

  const isDraw = homeScore !== '' && awayScore !== '' &&
                 Number(homeScore) === Number(awayScore);

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

  const finalHome = home_score_120 ?? home_score_90;
  const finalAway = away_score_120 ?? away_score_90;

  const cardStyle = useMemo(() => {
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

  const pointsBadge = <PointsBadge isFinished={isFinished} prediction={prediction} />;

  // ─── La sección pública se muestra si locked O finished ──────────────────
  const showPublicSection = (locked || isFinished) && teamsAssigned;

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
              <div className="score-input">
                <input
                  type="number" min="0" max="20" value={homeScore}
                  onChange={e => setHomeScore(e.target.value)}
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                />
                <span className="score-separator">–</span>
                <input
                  type="number" min="0" max="20" value={awayScore}
                  onChange={e => setAwayScore(e.target.value)}
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                />
              </div>
              {isDraw && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Penales
                  </span>
                  <div className="score-input">
                    <input
                      type="number" min="0" max="20" value={homePen}
                      onChange={e => setHomePen(e.target.value)} placeholder="0"
                      style={{ WebkitAppearance: 'none', MozAppearance: 'textfield', borderColor: 'rgba(234,179,8,0.5)', color: '#fde047', width: 44 }}
                    />
                    <span className="score-separator">–</span>
                    <input
                      type="number" min="0" max="20" value={awayPen}
                      onChange={e => setAwayPen(e.target.value)} placeholder="0"
                      style={{ WebkitAppearance: 'none', MozAppearance: 'textfield', borderColor: 'rgba(234,179,8,0.5)', color: '#fde047', width: 44 }}
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
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
        paddingTop: '0.6rem', borderTop: '1px solid var(--border)', marginTop: '0.2rem',
      }}>
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
              saved  ? { background: 'var(--success)', color: '#0f172a' } :
              saving ? { opacity: 0.6, cursor: 'wait' } :
              (homeScore === '' || awayScore === '') ? { opacity: 0.45, cursor: 'not-allowed' } :
              {}
            }
          >
            {saved ? '✓ Guardado' : saving ? 'Guardando...' : prediction ? 'Actualizar' : 'Guardar'}
          </button>
        )}
      </div>

      {/* ══ SECCIÓN PRONÓSTICOS PÚBLICOS ══════════════════════════════════════ */}
      {showPublicSection && (
        <div style={{
          marginTop:    '0.75rem',
          paddingTop:   '0.75rem',
          borderTop:    '1px solid var(--border)',
        }}>
          {/* Toggle header */}
          <button
            onClick={() => setShowPublic(o => !o)}
            style={{
              width:          '100%',
              background:     'none',
              border:         'none',
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              padding:        '0',
              marginBottom:   showPublic ? '0.6rem' : '0',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
              👥 Pronósticos de todos
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {showPublic ? '▲' : '▼'}
            </span>
          </button>

          {/* Lista */}
          {showPublic && (
            <PublicPredictions
              matchId={id}
              currentUserId={currentUserId}
            />
          )}
        </div>
      )}

    </div>
  );
}
