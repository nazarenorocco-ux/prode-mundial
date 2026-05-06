// src/pages/Knockout.jsx
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

const TRANSFER_INFO = {
  alias:   'borro.214',
  cbu:     '0000076500000017488488',
  banco:   'Personal Pay',
  titular: 'Roberto Atilio Lambertucci',
  monto:   '$20.000 ARS',
  whatsapp: '+54 9 3401 648383',
};

// ─── Sub-componentes del flujo de inscripción ────────────────────────────────

function StepPaymentMethod({ onSelect, loading }) {
  return (
    <div className="main-container">
      <div className="page-header">
        <h1>🏆 Fase Eliminatoria</h1>
        <p>Mundial 2026</p>
      </div>

      <div style={{
        maxWidth: 420,
        margin: '0 auto',
        padding: '1.5rem',
        background: 'var(--bg-card)',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}>
        <div>
          <h2 style={{ color: 'var(--text-h)', margin: 0 }}>Unirse a la Eliminatoria</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Elegí cómo querés abonar la inscripción de <strong style={{ color: 'var(--text-h)' }}>$20.000 ARS</strong>.
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          onClick={() => onSelect('mercadopago')}
          disabled={loading}
        >
          💳 Pagar con MercadoPago
        </button>

        <button
          className="btn btn-secondary"
          style={{ width: '100%', padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          onClick={() => onSelect('transferencia')}
          disabled={loading}
        >
          🏦 Pagar por Transferencia
        </button>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', margin: 0 }}>
          Con transferencia, tu acceso se activa luego de la verificación manual del admin.
        </p>
      </div>
    </div>
  );
}


function StepTransferInfo({ onConfirm, onBack, loading }) {
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="main-container">
      <div className="page-header">
        <h1>🏆 Fase Eliminatoria</h1>
        <p>Mundial 2026</p>
      </div>

      <div style={{
        maxWidth: 440,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        padding: '0 1rem',
      }}>

        {/* Título */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏦</div>
          <h2 style={{ color: 'var(--text-h)', margin: '0 0 0.4rem' }}>
            Datos para transferir
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Realizá una transferencia de{' '}
            <strong style={{ color: '#38bdf8' }}>$20.000 ARS</strong> a:
          </p>
        </div>

        {/* Tabla de datos */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid var(--border, rgba(255,255,255,0.08))',
        }}>

          {/* Fila ALIAS */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.9rem 1.25rem',
            borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
          }}>
            <span style={{
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              minWidth: 70,
            }}>
              Alias
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: 'var(--text-h)', fontWeight: 700, fontSize: '1rem' }}>
                {TRANSFER_INFO.alias}
              </span>
              <button
                onClick={() => copyToClipboard(TRANSFER_INFO.alias, 'alias')}
                style={{
                  background: copied === 'alias' ? '#16a34a' : 'rgba(56,189,248,0.15)',
                  color: copied === 'alias' ? '#fff' : '#38bdf8',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {copied === 'alias' ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Fila CBU */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.9rem 1.25rem',
            borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
          }}>
            <span style={{
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              minWidth: 70,
            }}>
              CBU
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                color: 'var(--text-h)',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.03em',
              }}>
                {TRANSFER_INFO.cbu}
              </span>
              <button
                onClick={() => copyToClipboard(TRANSFER_INFO.cbu, 'cbu')}
                style={{
                  background: copied === 'cbu' ? '#16a34a' : 'rgba(56,189,248,0.15)',
                  color: copied === 'cbu' ? '#fff' : '#38bdf8',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {copied === 'cbu' ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Fila BANCO */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.9rem 1.25rem',
            borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
          }}>
            <span style={{
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              minWidth: 70,
            }}>
              Banco
            </span>
            <span style={{ color: 'var(--text-h)', fontWeight: 700, fontSize: '1rem' }}>
              {TRANSFER_INFO.banco}
            </span>
          </div>

          {/* Fila TITULAR */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.9rem 1.25rem',
          }}>
            <span style={{
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              minWidth: 70,
            }}>
              Titular
            </span>
            <span style={{ color: 'var(--text-h)', fontWeight: 700, fontSize: '1rem' }}>
              {TRANSFER_INFO.titular}
            </span>
          </div>

        </div>

        {/* WhatsApp */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            📋 Después de transferir, enviá el comprobante por WhatsApp junto con el email con el que te vas a registrar:
          </p>
          <a
            href={`https://wa.me/${TRANSFER_INFO.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#16a34a',
              color: '#fff',
              textDecoration: 'none',
              padding: '0.75rem 1.75rem',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {TRANSFER_INFO.whatsapp}
          </a>
        </div>

        {/* Aviso pendiente */}
        <div style={{
          background: 'rgba(234,179,8,0.1)',
          border: '1px solid rgba(234,179,8,0.3)',
          borderRadius: 10,
          padding: '0.875rem 1rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '1.1rem' }}>⚠️</span>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Tu cuenta quedará <strong style={{ color: '#f59e0b' }}>pendiente</strong> hasta
            confirmar el pago. Te avisamos por WhatsApp cuando esté activa.
          </p>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem' }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Ya transferí, quiero inscribirme'}
          </button>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: '0.5rem',
            }}
          >
            ← Volver
          </button>
        </div>

      </div>
    </div>
  );
}

function StepPending({ onBack }) {
  return (
    <div className="main-container">
      <div className="page-header">
        <h1>🏆 Fase Eliminatoria</h1>
        <p>Mundial 2026</p>
      </div>

      <div className="match-card" style={{ maxWidth: 480, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <h2 style={{ color: 'var(--text-h)', marginBottom: '0.75rem' }}>
          Inscripción pendiente
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Tu solicitud fue registrada. Un administrador verificará tu transferencia
          y activará tu acceso a la fase eliminatoria.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Consultas:{' '}
          <a
            href={`https://wa.me/${TRANSFER_INFO.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)' }}
          >
            {TRANSFER_INFO.whatsapp}
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function Knockout() {
  const { user, profile } = useAuth();

  const [mainTab, setMainTab]         = useState('predicciones');
  const [activeRound, setActiveRound] = useState('R32');
  const [activeFilter, setActiveFilter] = useState('todos');

  const [matches, setMatches]       = useState([]);
  const [predictions, setPredictions] = useState({});
  const [entry, setEntry]           = useState(undefined); // undefined = aún no cargó
  const [stats, setStats]           = useState({
    points: 0, exact: 0, correct: 0, wrong: 0, total: 0, rank: '-',
  });
  const [ranking, setRanking] = useState([]);

  const [r32Teams, setR32Teams]             = useState([]);
  const [championPred, setChampionPred]     = useState(null);
  const [championLocked, setChampionLocked] = useState(false);
  const [savingChampion, setSavingChampion] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ── Estados del flujo de inscripción ──
  const [joinStep, setJoinStep]           = useState('method'); // 'method' | 'transfer-info' | 'pending'
  const [joinLoading, setJoinLoading]     = useState(false);
  const [joinError, setJoinError]         = useState(null);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const isMatchLocked = (matchDate) => {
    if (!matchDate) return false;
    const kickoff = new Date(matchDate);
    const now     = new Date();
    return now >= new Date(kickoff.getTime() - 30 * 60 * 1000);
  };

  // ─── Fetchers ─────────────────────────────────────────────────────────────

  const fetchEntry = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('competition_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('competition_id', KNOCKOUT_COMPETITION_ID)
      .maybeSingle();
    setEntry(data ?? null); // null = no existe
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
    if (!user || !matches?.length) return;
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
        name:        e.profiles?.full_name || e.profiles?.username || 'Sin nombre',
        points:      0,
        exact:       0,
        correct:     0,
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
      if (
        i > 0 &&
        row.points === sorted[i - 1].points &&
        row.exact  === sorted[i - 1].exact
      ) {
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

  // ─── Guardar campeón ──────────────────────────────────────────────────────

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

  // ─── Guardar predicción de partido ────────────────────────────────────────

  const savePrediction = async (matchId, homeScore, awayScore, homePen, awayPen) => {
    if (!user) return;
    const existing = predictions[matchId];
    const payload  = {
      user_id:        user.id,
      match_id:       matchId,
      competition_id: KNOCKOUT_COMPETITION_ID,
      home_score:     homeScore,
      away_score:     awayScore,
      home_penalties: homePen  ?? null,
      away_penalties: awayPen  ?? null,
      points:         existing?.points ?? 0,
    };
    if (existing?.id) {
      await supabase.from('knockout_predictions').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('knockout_predictions').insert(payload);
    }
    setPredictions(prev => ({ ...prev, [matchId]: { ...existing, ...payload } }));
  };

  // ─── Inscripción: MercadoPago ──────────────────────────────────────────────

  const handleMercadoPago = async () => {
    setJoinLoading(true);
    setJoinError(null);
    try {
      const res = await fetch('/api/create-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:         user.id,
          userEmail:      user.email,
          userName:       profile?.full_name || profile?.username || user.email,
          competition_id: KNOCKOUT_COMPETITION_ID,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.init_point) {
        throw new Error(data.error || 'Error al crear el pago');
      }
      // Insertar entrada pending antes de redirigir
      await supabase.from('competition_entries').upsert({
        user_id:        user.id,
        competition_id: KNOCKOUT_COMPETITION_ID,
        status:         'pending',
        payment_method: 'mercadopago',
      }, { onConflict: 'user_id,competition_id' });

      window.location.href = data.init_point;
    } catch (err) {
      setJoinError(err.message);
      setJoinLoading(false);
    }
  };

  // ─── Inscripción: Transferencia ───────────────────────────────────────────

  const handleTransferConfirm = async () => {
    setJoinLoading(true);
    setJoinError(null);
    try {
      const { error } = await supabase.from('competition_entries').upsert({
        user_id:        user.id,
        competition_id: KNOCKOUT_COMPETITION_ID,
        status:         'pending',
        payment_method: 'transferencia',
      }, { onConflict: 'user_id,competition_id' });

      if (error) throw new Error(error.message);

      // Refrescar entry y mostrar pantalla pending
      await fetchEntry();
      setJoinStep('pending');
    } catch (err) {
      setJoinError(err.message);
    } finally {
      setJoinLoading(false);
    }
  };

  // ─── Effects ──────────────────────────────────────────────────────────────

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

  // ─── Filtrado ─────────────────────────────────────────────────────────────

  const filteredMatches = matches
    .filter(m => m.round === activeRound)
    .filter(m => {
      if (activeFilter === 'finalizados') return m.status === 'finished';
      if (activeFilter === 'pendientes')  return m.status !== 'finished';
      return true;
    });

  // ─── Render: loading ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="loading-text" style={{ paddingTop: '4rem' }}>
        Cargando fase eliminatoria…
      </div>
    );
  }

  // ─── Render: flujo de inscripción ─────────────────────────────────────────

  if (!entry || entry.status !== 'active') {

    // Ya tiene entrada pending (de una sesión anterior o recién creada)
    if (entry?.status === 'pending' || joinStep === 'pending') {
      return <StepPending />;
    }

    // Paso: elegir método de pago
    if (joinStep === 'method') {
      return (
        <StepPaymentMethod
          onSelect={(method) => {
            if (method === 'mercadopago') {
              handleMercadoPago();
            } else {
              setJoinStep('transfer-info');
            }
          }}
        />
      );
    }

    // Paso: info de transferencia
    if (joinStep === 'transfer-info') {
      return (
        <>
          {joinError && (
            <div style={{
              background: '#fee2e2', color: '#dc2626',
              padding: '0.75rem 1rem', borderRadius: 8,
              maxWidth: 480, margin: '1rem auto 0',
              fontSize: '0.875rem',
            }}>
              {joinError}
            </div>
          )}
          <StepTransferInfo
            onBack={() => setJoinStep('method')}
            onConfirm={handleTransferConfirm}
            loading={joinLoading}
          />
        </>
      );
    }
  }

  // ─── Render principal ──────────────────────────────────────────────────────

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
