import { useState, useEffect } from 'react';
import { supabase } from "../lib/supabaseClient";

const ROUNDS = ['R32', 'R16', 'QF', 'SF', '3P', 'F'];
const ROUND_LABELS = {
  R32: '16avos de Final',
  R16: '8avos de Final',
  QF: 'Cuartos de Final',
  SF: 'Semifinales',
  '3P': 'Tercer Puesto',
  F: 'Final',
};

const COMPETITION_ID = '01030879-760e-4fe3-b329-7c09c623cc58';

// Mapeo de slots a grupos para R32
// Slot format: "1º Grupo A", "2º Grupo B", "3º Grupo A/B/C/D/E/F", etc.
function parseSlot(slot) {
  if (!slot) return null;
  const match = slot.match(/^(\d+)º Grupo (.+)$/);
  if (!match) return null;
  return { position: parseInt(match[1]), groups: match[2].split('/') };
}

export default function KnockoutAdmin() {
  const [matches, setMatches] = useState([]);
  const [activeRound, setActiveRound] = useState('R32');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);
  const [groupTeams, setGroupTeams] = useState({}); // { "A": [{team, flag}, ...], ... }

  useEffect(() => {
    fetchMatches();
    fetchGroupTeams();
  }, []);

  async function fetchMatches() {
    setLoading(true);
    const { data, error } = await supabase
      .from('knockout_matches')
      .select('*')
      .eq('competition_id', COMPETITION_ID)
      .order('match_number');

    if (error) {
      console.error(error);
    } else {
      setMatches(data);
    }
    setLoading(false);
  }

  async function fetchGroupTeams() {
    const { data, error } = await supabase
      .from('matches')
      .select('home_team, away_team, home_flag, away_flag, group_name')
      .not('group_name', 'is', null);

    if (error) {
      console.error('Error fetching group teams:', error);
      return;
    }

    // Construir mapa { "A": Set de {team, flag} }
    const map = {};
    data.forEach((m) => {
      [
        { team: m.home_team, flag: m.home_flag },
        { team: m.away_team, flag: m.away_flag },
      ].forEach(({ team, flag }) => {
        if (!team) return;
        const g = m.group_name;
        if (!map[g]) map[g] = new Map();
        if (!map[g].has(team)) map[g].set(team, flag);
      });
    });

    // Convertir a arrays
    const result = {};
    Object.entries(map).forEach(([g, teamMap]) => {
      result[g] = Array.from(teamMap.entries()).map(([team, flag]) => ({ team, flag }));
    });

    setGroupTeams(result);
  }

  function startEdit(match) {
    setEditingMatch({
      ...match,
      home_score_90: match.home_score_90 ?? '',
      away_score_90: match.away_score_90 ?? '',
      home_score_120: match.home_score_120 ?? '',
      away_score_120: match.away_score_120 ?? '',
      home_penalties: match.home_penalties ?? '',
      away_penalties: match.away_penalties ?? '',
      went_to_extra_time: match.went_to_extra_time ?? false,
      went_to_penalties: match.went_to_penalties ?? false,
    });
  }

  function cancelEdit() {
    setEditingMatch(null);
  }

  function determineWinnerAndLoser(match) {
    const h90 = Number(match.home_score_90);
    const a90 = Number(match.away_score_90);

    let winnerTeam, winnerFlag, loserTeam, loserFlag;

    if (match.went_to_penalties) {
      const hp = Number(match.home_penalties);
      const ap = Number(match.away_penalties);
      if (hp > ap) {
        winnerTeam = match.home_team; winnerFlag = match.home_flag;
        loserTeam = match.away_team; loserFlag = match.away_flag;
      } else {
        winnerTeam = match.away_team; winnerFlag = match.away_flag;
        loserTeam = match.home_team; loserFlag = match.home_flag;
      }
    } else if (match.went_to_extra_time) {
      const h120 = Number(match.home_score_120);
      const a120 = Number(match.away_score_120);
      if (h120 > a120) {
        winnerTeam = match.home_team; winnerFlag = match.home_flag;
        loserTeam = match.away_team; loserFlag = match.away_flag;
      } else {
        winnerTeam = match.away_team; winnerFlag = match.away_flag;
        loserTeam = match.home_team; loserFlag = match.home_flag;
      }
    } else {
      if (h90 > a90) {
        winnerTeam = match.home_team; winnerFlag = match.home_flag;
        loserTeam = match.away_team; loserFlag = match.away_flag;
      } else {
        winnerTeam = match.away_team; winnerFlag = match.away_flag;
        loserTeam = match.home_team; loserFlag = match.home_flag;
      }
    }

    return { winnerTeam, winnerFlag, loserTeam, loserFlag };
  }

  async function saveMatch() {
    if (!editingMatch) return;
    setSaving(editingMatch.id);

    const isFinished =
      editingMatch.home_score_90 !== '' &&
      editingMatch.away_score_90 !== '';

    const updates = {
      home_team: editingMatch.home_team || null,
      away_team: editingMatch.away_team || null,
      home_flag: editingMatch.home_flag || null,
      away_flag: editingMatch.away_flag || null,
      home_score_90: editingMatch.home_score_90 !== '' ? Number(editingMatch.home_score_90) : null,
      away_score_90: editingMatch.away_score_90 !== '' ? Number(editingMatch.away_score_90) : null,
      went_to_extra_time: editingMatch.went_to_extra_time,
      home_score_120: editingMatch.went_to_extra_time && editingMatch.home_score_120 !== ''
        ? Number(editingMatch.home_score_120) : null,
      away_score_120: editingMatch.went_to_extra_time && editingMatch.away_score_120 !== ''
        ? Number(editingMatch.away_score_120) : null,
      went_to_penalties: editingMatch.went_to_penalties,
      home_penalties: editingMatch.went_to_penalties && editingMatch.home_penalties !== ''
        ? Number(editingMatch.home_penalties) : null,
      away_penalties: editingMatch.went_to_penalties && editingMatch.away_penalties !== ''
        ? Number(editingMatch.away_penalties) : null,
      status: isFinished ? 'finished' : 'pending',
    };

                if (isFinished) {
                const h90 = Number(updates.home_score_90);
                const a90 = Number(updates.away_score_90);
                const empate90 = h90 === a90;

                if (empate90 && !updates.went_to_extra_time) {
                alert(
                    '⚠️ El resultado es empate pero no se marcó "Fue a tiempo extra".\n' +
                    'Verificá el resultado: en eliminatorias siempre debe haber un ganador.'
                );
                setSaving(null);
                return;
                }

                if (updates.went_to_extra_time) {
                const h120 = Number(updates.home_score_120);
                const a120 = Number(updates.away_score_120);
                const empate120 = h120 === a120;

                if (empate120 && !updates.went_to_penalties) {
                    alert(
                    '⚠️ El resultado a 120 minutos es empate pero no se marcó "Fue a penales".\n' +
                    'Verificá el resultado: debe definirse un ganador.'
                    );
                    setSaving(null);
                    return;
                }

                if (updates.went_to_penalties) {
                    const hp = Number(updates.home_penalties);
                    const ap = Number(updates.away_penalties);

                    if (hp === ap) {
                    alert(
                        '⚠️ El resultado de penales es empate.\n' +
                        'Verificá los penales: debe haber un ganador.'
                    );
                    setSaving(null);
                    return;
                    }
                }
                }
            }

    const { error } = await supabase
      .from('knockout_matches')
      .update(updates)
      .eq('id', editingMatch.id);

    if (error) {
      console.error(error);
      alert('Error al guardar: ' + error.message);
      setSaving(null);
      return;
    }

    if (isFinished) {
      // 1. Calcular puntos
      const { error: rpcError } = await supabase.rpc('calculate_knockout_points', {
        p_match_id: editingMatch.id,
      });
      if (rpcError) console.error('Error calculando puntos:', rpcError);if (rpcError) {
  console.error('Error calculando puntos:', rpcError);
  alert('⚠️ Error calculando puntos: ' + rpcError.message);
        }


      // 2. Avanzar ganador (excepto Final y 3er Puesto)
      const skipAdvance = [103, 104];
      if (!skipAdvance.includes(editingMatch.match_number)) {
        const { winnerTeam, winnerFlag, loserTeam, loserFlag } =
          determineWinnerAndLoser({ ...editingMatch, ...updates });

        if (winnerTeam) {
          const { error: advanceError } = await supabase.rpc('advance_knockout_winner', {
            p_match_number: editingMatch.match_number,
            p_winner_team: winnerTeam,
            p_winner_flag: winnerFlag || '',
            p_loser_team: loserTeam || '',
            p_loser_flag: loserFlag || '',
            p_competition_id: COMPETITION_ID,
          });
          if (advanceError) console.error('Error avanzando ganador:', advanceError);if (advanceError) {
            console.error('Error avanzando ganador:', advanceError);
                alert('⚠️ Error avanzando ganador: ' + advanceError.message);
            }

        }
      }
    }

    await fetchMatches();
    setEditingMatch(null);
    setSaving(null);
  }

  const roundMatches = matches.filter((m) => m.round === activeRound);

  function getStatusColor(match) {
    if (match.status === 'finished') return '#4ade80';
    if (match.home_team && match.away_team) return '#60a5fa';
    return '#6b7280';
  }

  function getStatusLabel(match) {
    if (match.status === 'finished') return '✅ Finalizado';
    if (match.home_team && match.away_team) return '🔵 Con equipos';
    return '⏳ Sin equipos';
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', color: '#ccc', textAlign: 'center' }}>
        Cargando partidos...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#fff', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
        ⚽ Admin Eliminatorias
      </h2>

      {/* Round Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {ROUNDS.map((r) => (
          <button
            key={r}
            onClick={() => { setActiveRound(r); setEditingMatch(null); }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeRound === r ? '700' : '400',
              background: activeRound === r ? '#7c3aed' : '#374151',
              color: '#fff',
              transition: 'background 0.2s',
            }}
          >
            {ROUND_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Match List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {roundMatches.map((match) => (
          <div
            key={match.id}
            style={{
              background: '#1f2937',
              borderRadius: '12px',
              border: `2px solid ${getStatusColor(match)}`,
              padding: '1rem 1.25rem',
            }}
          >
            {editingMatch?.id === match.id ? (
              <EditMatchForm
                match={editingMatch}
                onChange={setEditingMatch}
                onSave={saveMatch}
                onCancel={cancelEdit}
                saving={saving === match.id}
                isR32={activeRound === 'R32'}
                groupTeams={groupTeams}
              />
            ) : (
              <MatchDisplay
                match={match}
                statusLabel={getStatusLabel(match)}
                onEdit={() => startEdit(match)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Match Display ────────────────────────────────────────────────────────────
function MatchDisplay({ match, statusLabel, onEdit }) {
  const homeLabel = match.home_team || match.home_slot || '???';
  const awayLabel = match.away_team || match.away_slot || '???';

  function scoreDisplay() {
    if (match.status !== 'finished') return null;
    let score = `${match.home_score_90} - ${match.away_score_90}`;
    if (match.went_to_extra_time) score += ` (ET: ${match.home_score_120}-${match.away_score_120})`;
    if (match.went_to_penalties) score += ` (Pen: ${match.home_penalties}-${match.away_penalties})`;
    return score;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
      <div>
        <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
          Partido {match.match_number} · {statusLabel}
        </div>
        <div style={{ color: '#fff', fontSize: '1rem', fontWeight: '600' }}>
          {match.home_flag && (
            <img src={match.home_flag} alt="" style={{ width: '20px', marginRight: '6px', verticalAlign: 'middle' }} />
          )}
          {homeLabel}
          <span style={{ color: '#9ca3af', margin: '0 0.5rem' }}>vs</span>
          {awayLabel}
          {match.away_flag && (
            <img src={match.away_flag} alt="" style={{ width: '20px', marginLeft: '6px', verticalAlign: 'middle' }} />
          )}
        </div>
        {scoreDisplay() && (
          <div style={{ color: '#4ade80', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {scoreDisplay()}
          </div>
        )}
      </div>
      <button
        onClick={onEdit}
        style={{
          padding: '0.5rem 1rem',
          background: '#7c3aed',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.875rem',
        }}
      >
        ✏️ Editar
      </button>
    </div>
  );
}

// ─── Edit Match Form ──────────────────────────────────────────────────────────
function EditMatchForm({ match, onChange, onSave, onCancel, saving, isR32, groupTeams }) {
  function set(field, value) {
    onChange((prev) => ({ ...prev, [field]: value }));
  }

  // Cuando se elige un equipo desde el dropdown, también setear el flag automáticamente
  function handleTeamSelect(side, teamName) {
    // Buscar el flag en groupTeams
    let foundFlag = '';
    Object.values(groupTeams).forEach((teams) => {
      const found = teams.find((t) => t.team === teamName);
      if (found) foundFlag = found.flag || '';
    });
    set(side === 'home' ? 'home_team' : 'away_team', teamName);
    set(side === 'home' ? 'home_flag' : 'away_flag', foundFlag);
  }

  // Obtener opciones para un slot
  function getOptionsForSlot(slot) {
    if (!slot) return [];
    const parsed = parseSlot(slot);
    if (!parsed) return [];

    const options = [];
    parsed.groups.forEach((g) => {
      const teams = groupTeams[g] || [];
      teams.forEach((t) => {
        options.push({ ...t, group: g });
      });
    });
    return options;
  }

  const inputStyle = {
    background: '#374151',
    border: '1px solid #4b5563',
    borderRadius: '6px',
    color: '#fff',
    padding: '0.4rem 0.6rem',
    width: '100%',
    fontSize: '0.875rem',
  };

  const labelStyle = {
    color: '#9ca3af',
    fontSize: '0.75rem',
    marginBottom: '0.25rem',
    display: 'block',
  };

  const scoreInputStyle = {
    ...inputStyle,
    width: '60px',
    textAlign: 'center',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const homeOptions = isR32 ? getOptionsForSlot(match.home_slot) : [];
  const awayOptions = isR32 ? getOptionsForSlot(match.away_slot) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
        Partido {match.match_number}
      </div>

      {/* Equipos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Equipo Local */}
        <div>
          <label style={labelStyle}>
            Equipo Local
            {match.home_slot && (
              <span style={{ color: '#7c3aed', marginLeft: '0.4rem' }}>({match.home_slot})</span>
            )}
          </label>
          {isR32 ? (
            <select
              style={selectStyle}
              value={match.home_team || ''}
              onChange={(e) => handleTeamSelect('home', e.target.value)}
            >
              <option value="">-- Seleccionar --</option>
              {homeOptions.map((opt) => (
                <option key={opt.team} value={opt.team}>
                  {opt.team} (Grupo {opt.group})
                </option>
              ))}
            </select>
          ) : (
            <input
              style={{ ...inputStyle, background: '#1f2937', color: '#6b7280', cursor: 'not-allowed' }}
              value={match.home_team || match.home_slot || 'Por definir'}
              disabled
            />
          )}
        </div>

        {/* Equipo Visitante */}
        <div>
          <label style={labelStyle}>
            Equipo Visitante
            {match.away_slot && (
              <span style={{ color: '#7c3aed', marginLeft: '0.4rem' }}>({match.away_slot})</span>
            )}
          </label>
          {isR32 ? (
            <select
              style={selectStyle}
              value={match.away_team || ''}
              onChange={(e) => handleTeamSelect('away', e.target.value)}
            >
              <option value="">-- Seleccionar --</option>
              {awayOptions.map((opt) => (
                <option key={opt.team} value={opt.team}>
                  {opt.team} (Grupo {opt.group})
                </option>
              ))}
            </select>
          ) : (
            <input
              style={{ ...inputStyle, background: '#1f2937', color: '#6b7280', cursor: 'not-allowed' }}
              value={match.away_team || match.away_slot || 'Por definir'}
              disabled
            />
          )}
        </div>

        {/* Flag Local - solo mostrar si es R32 o ya tiene equipo */}
        {(isR32 || match.home_team) && (
          <div>
            <label style={labelStyle}>Flag Local (URL)</label>
            <input
              style={inputStyle}
              value={match.home_flag || ''}
              onChange={(e) => set('home_flag', e.target.value)}
              placeholder="https://..."
            />
          </div>
        )}

        {/* Flag Visitante */}
        {(isR32 || match.away_team) && (
          <div>
            <label style={labelStyle}>Flag Visitante (URL)</label>
            <input
              style={inputStyle}
              value={match.away_flag || ''}
              onChange={(e) => set('away_flag', e.target.value)}
              placeholder="https://..."
            />
          </div>
        )}
      </div>

      {/* Solo mostrar resultado si hay equipos asignados */}
      {(match.home_team && match.away_team) && (
        <>
          {/* Resultado 90' */}
          <div>
            <label style={labelStyle}>Resultado 90 minutos</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                style={scoreInputStyle}
                type="number"
                min="0"
                max="20"
                value={match.home_score_90}
                onChange={(e) => set('home_score_90', e.target.value)}
                placeholder="0"
              />
              <span style={{ color: '#9ca3af' }}>-</span>
              <input
                style={scoreInputStyle}
                type="number"
                min="0"
                max="20"
                value={match.away_score_90}
                onChange={(e) => set('away_score_90', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Extra time toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#fff' }}>
            <input
              type="checkbox"
              checked={match.went_to_extra_time}
              onChange={(e) => {
                set('went_to_extra_time', e.target.checked);
                if (!e.target.checked) {
                  set('went_to_penalties', false);
                  set('home_score_120', '');
                  set('away_score_120', '');
                  set('home_penalties', '');
                  set('away_penalties', '');
                }
              }}
            />
            Fue a tiempo extra
          </label>

          {/* Resultado 120' */}
          {match.went_to_extra_time && (
            <div>
              <label style={labelStyle}>Resultado 120 minutos</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  style={scoreInputStyle}
                  type="number"
                  min="0"
                  max="20"
                  value={match.home_score_120}
                  onChange={(e) => set('home_score_120', e.target.value)}
                  placeholder="0"
                />
                <span style={{ color: '#9ca3af' }}>-</span>
                <input
                  style={scoreInputStyle}
                  type="number"
                  min="0"
                  max="20"
                  value={match.away_score_120}
                  onChange={(e) => set('away_score_120', e.target.value)}
                  placeholder="0"
                />
              </div>

              {/* Penalties toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#fff', marginTop: '0.75rem' }}>
                <input
                  type="checkbox"
                  checked={match.went_to_penalties}
                  onChange={(e) => {
                    set('went_to_penalties', e.target.checked);
                    if (!e.target.checked) {
                      set('home_penalties', '');
                      set('away_penalties', '');
                    }
                  }}
                />
                Fue a penales
              </label>
            </div>
          )}

          {/* Penales */}
          {match.went_to_penalties && (
            <div>
              <label style={labelStyle}>Resultado penales</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  style={scoreInputStyle}
                  type="number"
                  min="0"
                  max="20"
                  value={match.home_penalties}
                  onChange={(e) => set('home_penalties', e.target.value)}
                  placeholder="0"
                />
                <span style={{ color: '#9ca3af' }}>-</span>
                <input
                  style={scoreInputStyle}
                  type="number"
                  min="0"
                  max="20"
                  value={match.away_penalties}
                  onChange={(e) => set('away_penalties', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Mensaje si no hay equipos en R16+ */}
      {!isR32 && (!match.home_team || !match.away_team) && (
        <div style={{
          padding: '0.75rem',
          background: '#374151',
          borderRadius: '8px',
          color: '#9ca3af',
          fontSize: '0.875rem',
          textAlign: 'center',
        }}>
          ⏳ Los equipos se asignan automáticamente cuando avancen del partido anterior.
        </div>
      )}

      {/* Botones */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            padding: '0.6rem 1.25rem',
            background: saving ? '#4b5563' : '#4ade80',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: '700',
          }}
        >
          {saving ? 'Guardando...' : '💾 Guardar'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          style={{
            padding: '0.6rem 1.25rem',
            background: '#374151',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}