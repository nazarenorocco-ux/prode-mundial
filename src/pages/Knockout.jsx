import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import KnockoutMatchCard from '../components/KnockoutMatchCard';

const KNOCKOUT_COMPETITION_ID = '01030879-760e-4fe3-b329-7c09c623cc58';

const ROUNDS = [
  { code: 'R32', label: '16avos' },
  { code: 'R16', label: '8avos' },
  { code: 'QF',  label: 'Cuartos' },
  { code: 'SF',  label: 'Semis' },
  { code: '3P',  label: '3er Puesto' },
  { code: 'F',   label: 'Final' },
];

const FILTERS = [
  { code: 'todos',       label: 'Todos' },
  { code: 'pendientes',  label: 'Pendientes' },
  { code: 'finalizados', label: 'Finalizados' },
];

export default function Knockout() {
  const { user } = useAuth();

  const [mainTab, setMainTab]           = useState('predicciones');
  const [activeRound, setActiveRound]   = useState('R32');
  const [activeFilter, setActiveFilter] = useState('todos');

  const [matches, setMatches]           = useState([]);
  const [predictions, setPredictions]   = useState({});
  const [entry, setEntry]               = useState(null);
  const [stats, setStats]               = useState({
    points: 0, exact: 0, correct: 0, wrong: 0, total: 0, rank: '-',
  });
  const [ranking, setRanking]           = useState([]);

  const [r32Teams, setR32Teams]               = useState([]);
  const [championPred, setChampionPred]       = useState(null);
  const [championLocked, setChampionLocked]   = useState(false);
  const [savingChampion, setSavingChampion]   = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const isMatchLocked = (matchDate) => {
    if (!matchDate) return false;
    const kickoff = new Date(matchDate);
    const now     = new Date();
    return now >= new Date(kickoff.getTime() - 30 * 60 * 1000);
  };

  // ─── Fetchers ────────────────────────────────────────────────────────────────

  const fetchEntry = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('competition_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('competition_id', KNOCKOUT_COMPETITION_ID)
      .maybeSingle();
    setEntry(data);
  }, [user]);

  const fetchMatches = useCallback(async () => {
    const { data, error } = await supabase
      .from('knockout_matches')
      .select('*')
      .eq('competition_id', KNOCKOUT_COMPETITION_ID)
      .order('match_number', { ascending: true });
    if (error) { setError(error.message); return; }
    setMatches(data || []);
  }, []);

  const fetchPredictions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('knockout_predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('competition_id', KNOCKOUT_COMPETITION_ID);
    const map = {};
    (data || []).forEach(p => { map[p.match_id] = p; });
    setPredictions(map);
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    if (!matches || matches.length === 0) return;
    const { data: preds } = await supabase
      .from('knockout_predictions')
      .select('points, match_id')
      .eq('user_id', user.id)
      .eq('competition_id', KNOCKOUT_COMPETITION_ID);

    const { data: champ } = await supabase
      .from('champion_predictions')
      .select('points')
      .eq('user_id', user.id)
      .eq('competition_id', KNOCKOUT_COMPETITION_ID)
      .maybeSingle();

    const finishedIds = matches
      .filter(m => m.status === 'finished')
      .map(m => m.id);

    let exact = 0, correct = 0, wrong = 0, total = 0, points = 0;
    (preds || []).forEach(p => {
      total++;
      const pts = p.points ?? 0;
      points += pts;
      if (pts >= 3) exact++;
      else if (pts >= 1) correct++;
      else if (finishedIds.includes(p.match_id)) wrong++;
    });
    points += champ?.points ?? 0;
    setStats({ points, exact, correct, wrong, total, rank: '-' });
  }, [user, matches]);

  const fetchRanking = useCallback(async () => {
    const { data: predData } = await supabase
      .from('knockout_predictions')
      .select('user_id, points')
      .eq('competition_id', KNOCKOUT_COMPETITION_ID);

    const { data: champData } = await supabase
      .from('champion_predictions')
      .select('user_id, points')
      .eq('competition_id', KNOCKOUT_COMPETITION_ID);

    const { data: entries } = await supabase
      .from('competition_entries')
      .select('user_id, profiles(full_name, username)')
      .eq('competition_id', KNOCKOUT_COMPETITION_ID)
      .eq('status', 'active');

    if (!entries) return;

    const userMap = {};
    entries.forEach(e => {
      userMap[e.user_id] = {
        name:       e.profiles?.full_name || e.profiles?.username || 'Sin nombre',
        points:     0,
        exact:      0,
        correct:    0,
        hasChampion: false,
      };
    });

    (predData || []).forEach(p => {
      if (!userMap[p.user_id]) return;
      const pts = p.points ?? 0;
      userMap[p.user_id].points += pts;
      if (pts >= 3) userMap[p.user_id].exact++;
      else if (pts >= 1) userMap[p.user_id].correct++;
    });

    (champData || []).forEach(c => {
      if (!userMap[c.user_id]) return;
      const pts = c.points ?? 0;
      userMap[c.user_id].points += pts;
      if (pts > 0) userMap[c.user_id].hasChampion = true;
    });

    const sorted = Object.entries(userMap)
      .map(([uid, d]) => ({ uid, ...d }))
      .sort((a, b) => b.points - a.points || b.exact - a.exact);

    let pos = 1;
    sorted.forEach((row, i) => {
      if (i > 0 &&
          row.points === sorted[i - 1].points &&
          row.exact  === sorted[i - 1].exact) {
        row.pos = sorted[i - 1].pos;
      } else {
        row.pos = pos;
      }
      pos++;
    });

    setRanking(sorted);
    const myRow = sorted.find(r => r.uid === user?.id);
    if (myRow) setStats(prev => ({ ...prev, rank: myRow.pos }));
  }, [user]);

  const fetchR32Teams = useCallback(async () => {
    const { data } = await supabase
      .from('knockout_matches')
      .select('home_team, away_team, home_flag, away_flag')
      .eq('competition_id', KNOCKOUT_COMPETITION_ID)
      .eq('round', 'R32');

    const teams = [];
    const seen  = new Set();
    (data || []).forEach(m => {
      if (m.home_team && !seen.has(m.home_team)) {
        seen.add(m.home_team);
        teams.push({ name: m.home_team, flag: m.home_flag });
      }
      if (m.away_team && !seen.has(m.away_team)) {
        seen.add(m.away_team);
        teams.push({ name: m.away_team, flag: m.away_flag });
      }
    });
    teams.sort((a, b) => a.name.localeCompare(b.name));
    setR32Teams(teams);
  }, []);

  const fetchChampionPred = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('champion_predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('competition_id', KNOCKOUT_COMPETITION_ID)
      .maybeSingle();
    setChampionPred(data);
  }, [user]);

  const checkChampionLock = useCallback(() => {
    const firstR32 = matches
      .filter(m => m.round === 'R32' && m.match_date)
      .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))[0];
    if (!firstR32) { setChampionLocked(false); return; }
    setChampionLocked(isMatchLocked(firstR32.match_date));
  }, [matches]);

  // ─── Guardar campeón ─────────────────────────────────────────────────────────

  const saveChampion = async (team, flag) => {
    if (!user || championLocked) return;
    setSavingChampion(true);
    try {
      const payload = {
        user_id:        user.id,
        competition_id: KNOCKOUT_COMPETITION_ID,
        team,
        points:         championPred?.points ?? 0,
      };
      if (championPred?.id) {
        await supabase.from('champion_predictions').update(payload).eq('id', championPred.id);
      } else {
        await supabase.from('champion_predictions').insert(payload);
      }
      setChampionPred(prev => ({ ...prev, team, flag }));
    } finally {
      setSavingChampion(false);
    }
  };

  // ─── Guardar predicción de partido ──────────────────────────────────────────

  const savePrediction = async (matchId, homeScore, awayScore, homePen, awayPen) => {
    if (!user) return;
    const existing = predictions[matchId];
    const payload  = {
      user_id:        user.id,
      match_id:       matchId,
      competition_id: KNOCKOUT_COMPETITION_ID,
      home_score:     homeScore,
      away_score:     awayScore,
      home_penalties: homePen ?? null,
      away_penalties: awayPen ?? null,
      points:         existing?.points ?? 0,
    };
    if (existing?.id) {
      await supabase.from('knockout_predictions').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('knockout_predictions').insert(payload);
    }
    setPredictions(prev => ({ ...prev, [matchId]: { ...existing, ...payload } }));
  };

  // ─── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchEntry(), fetchMatches(), fetchPredictions(),
        fetchR32Teams(), fetchChampionPred(),
      ]);
      setLoading(false);
    };
    init();
  }, [fetchEntry, fetchMatches, fetchPredictions, fetchR32Teams, fetchChampionPred]);

  useEffect(() => {
    if (matches.length > 0 && predictions) {
      fetchStats();
      fetchRanking();
      checkChampionLock();
    }
  }, [matches, predictions, fetchStats, fetchRanking, checkChampionLock]);


  // ─── Filtrado ────────────────────────────────────────────────────────────────

  const filteredMatches = matches
    .filter(m => m.round === activeRound)
    .filter(m => {
      if (activeFilter === 'finalizados') return m.status === 'finished';
      if (activeFilter === 'pendientes')  return m.status !== 'finished';
      return true;
    });

  // ─── Estados de carga / no inscripto ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="loading-text" style={{ paddingTop: '4rem' }}>
        Cargando fase eliminatoria…
      </div>
    );
  }

  if (!entry || entry.status !== 'active') {
    return (
      <div className="main-container">
        <div className="match-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
          <h2 style={{ color: 'var(--text-h)', marginBottom: '0.75rem' }}>
            Fase Eliminatoria
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {entry?.status === 'pending'
              ? 'Tu inscripción está pendiente de confirmación.'
              : 'No estás inscripto en la fase eliminatoria.'}
          </p>
        </div>
      </div>
    );
  }

  // ─── Render principal ────────────────────────────────────────────────────────

  return (
    <div className="main-container">

      {/* ── Page header ── */}
      <div className="page-header">
        <h1>🏆 Fase Eliminatoria</h1>
        <p>Mundial 2026</p>
      </div>

      {/* ── Stats ── */}
      <div className="ko-stats-grid">
        {[
          { label: 'Puntos',      value: stats.points,  cls: 'ko-stat-gold'   },
          { label: '⭐ Exactos',   value: stats.exact,   cls: 'ko-stat-green'  },
          { label: '✓ Correctos', value: stats.correct, cls: 'ko-stat-blue'   },
          { label: '✗ Sin pts',   value: stats.wrong,   cls: 'ko-stat-red'    },
          { label: 'Pronóst.',    value: stats.total,   cls: 'ko-stat-muted'  },
          { label: '# Puesto',    value: stats.rank,    cls: 'ko-stat-purple' },
        ].map(s => (
          <div key={s.label} className="ko-stat-card">
            <span className={`ko-stat-value ${s.cls}`}>{s.value}</span>
            <span className="ko-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Banner de puntos ── */}
      <div className="ko-points-banner">
        <p className="ko-points-banner-title">Sistema de puntos</p>
        <div className="ko-points-banner-items">
          <span>⭐ Exacto = <strong>3pts</strong></span>
          <span>✓ Ganador = <strong>1pt</strong></span>
          <span>🏆 Penales exactos = <strong>3pts</strong></span>
          <span>✓ Penales ganador = <strong>1pt</strong></span>
          <span>🥇 Campeón = <strong>10pts</strong></span>
        </div>
      </div>

      {/* ── Selector de campeón ── */}
      <div className="ko-champion-box">
        <div className="ko-champion-header">
          <div>
            <p className="ko-champion-title">🥇 Campeón del Mundial</p>
            <p className="ko-champion-sub">
              Vale 10 puntos · Se bloquea 30 min antes del primer partido
            </p>
          </div>
          {championLocked && (
            <span className="badge badge-locked">🔒 Bloqueado</span>
          )}
        </div>

        {championLocked ? (
          /* Modo lectura */
          <div className="ko-champion-locked-view">
            {championPred?.team ? (
              <>
                {(() => {
                  const t = r32Teams.find(t => t.name === championPred.team);
                  return t?.flag
                    ? <img src={t.flag} className="flag-img" style={{ width: 32, height: 'auto' }} alt="" />
                    : <span>🏳️</span>;
                })()}
                <span style={{ color: 'var(--text-h)', fontWeight: 600 }}>
                  {championPred.team}
                </span>
                {championPred.points > 0 && (
                  <span className="ko-champion-pts">+{championPred.points} pts</span>
                )}
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No seleccionaste campeón
              </span>
            )}
          </div>
        ) : (
          /* Grid de selección */
          <div className="ko-champion-grid">
            {r32Teams.length === 0 && (
              <p className="ko-champion-empty">
                Los equipos clasificados aún no están definidos
              </p>
            )}
            {r32Teams.map(team => {
              const selected = championPred?.team === team.name;
              return (
                <button
                  key={team.name}
                  onClick={() => saveChampion(team.name, team.flag)}
                  disabled={savingChampion}
                  className={`ko-team-btn${selected ? ' ko-team-btn--selected' : ''}`}
                >
                  {team.flag
                    ? <img src={team.flag} className="flag-img" alt="" />
                    : <span>🏳️</span>
                  }
                  <span className="ko-team-name">{team.name}</span>
                  {selected && <span className="ko-team-check">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Tabs principales ── */}
      <div className="ko-main-tabs">
        {[
          { code: 'predicciones', label: '📋 Predicciones' },
          { code: 'ranking',      label: '🏅 Ranking' },
        ].map(tab => (
          <button
            key={tab.code}
            onClick={() => setMainTab(tab.code)}
            className={`ko-main-tab${mainTab === tab.code ? ' ko-main-tab--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: PREDICCIONES ══ */}
      {mainTab === 'predicciones' && (
        <div>
          {/* Pills de ronda */}
          <div className="ko-round-pills">
            {ROUNDS.map(r => (
              <button
                key={r.code}
                onClick={() => setActiveRound(r.code)}
                className={`ko-round-pill${activeRound === r.code ? ' ko-round-pill--active' : ''}`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Pills de filtro */}
          <div className="ko-filter-pills">
            {FILTERS.map(f => (
              <button
                key={f.code}
                onClick={() => setActiveFilter(f.code)}
                className={`ko-filter-pill${activeFilter === f.code ? ' ko-filter-pill--active' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Partidos */}
          {filteredMatches.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2.5rem' }}>📭</div>
              <p>No hay partidos en esta categoría</p>
            </div>
          ) : (
            <div className="ko-matches-grid">
              {filteredMatches.map(match => (
                <KnockoutMatchCard
                  key={match.id}
                  match={match}
                  prediction={predictions[match.id] || null}
                  locked={isMatchLocked(match.match_date)}
                  onSave={savePrediction}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: RANKING ══ */}
      {mainTab === 'ranking' && (
        <div className="leaderboard">
          <div className="ko-ranking-header">
            <h2 style={{ color: 'var(--text-h)', fontWeight: 700, margin: 0 }}>
              🏅 Ranking Eliminatoria
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
              Incluye puntos de campeón
            </p>
          </div>

          {ranking.length === 0 ? (
            <div className="empty-state">
              <p>Aún no hay puntos registrados</p>
            </div>
          ) : (
            <>
              {/* Cabecera tabla */}
              <div className="ko-ranking-cols ko-ranking-cols--header">
                <span>#</span>
                <span>Jugador</span>
                <span>Pts</span>
                <span>⭐</span>
                <span>✓</span>
                <span>🥇</span>
              </div>

              {ranking.map((row) => {
                const isMe = row.uid === user?.id;
                const posLabel =
                  row.pos === 1 ? '🥇' :
                  row.pos === 2 ? '🥈' :
                  row.pos === 3 ? '🥉' : row.pos;
                const posClass =
                  row.pos === 1 ? 'leaderboard-rank top-1' :
                  row.pos === 2 ? 'leaderboard-rank top-2' :
                  row.pos === 3 ? 'leaderboard-rank top-3' : 'leaderboard-rank';

                return (
                  <div
                    key={row.uid}
                    className={`ko-ranking-cols${isMe ? ' ko-ranking-row--me' : ''}`}
                  >
                    <span className={posClass}>{posLabel}</span>
                    <span className={`ko-ranking-name${isMe ? ' ko-ranking-name--me' : ''}`}>
                      {row.name}
                      {isMe && <span className="ko-ranking-you"> (vos)</span>}
                    </span>
                    <span className="ko-ranking-pts">{row.points}</span>
                    <span className="ko-ranking-exact">{row.exact}</span>
                    <span className="ko-ranking-correct">{row.correct}</span>
                    <span className="ko-ranking-champ">{row.hasChampion ? '✓' : '-'}</span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

    </div>
  );
}
