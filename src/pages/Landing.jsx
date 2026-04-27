// src/pages/Landing.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculatePrizes, formatARS, PRIZE_TIERS, ENTRY_FEE, PRIZE_POOL_PERCENTAGE } from '../utils/prizeCalculator';
import '../styles/Landing.css';
import { supabase, getFlagUrl } from '../lib/supabaseClient';
import { formatearFechaLarga } from '../utils/dateUtils'; // ✅ importamos util centralizada

const MEDAL_ICONS = ['🥇', '🥈', '🥉'];
const POSITION_LABELS = [
  '1er Premio', '2do Premio', '3er Premio',
  '4to Premio', '5to Premio', '6to Premio',
  '7mo Premio', '8vo Premio', '9no Premio',
  '10mo Premio', '11mo Premio', '12mo Premio'
];

function getNextTierInfo(activePlayers) {
  const currentTierIndex = PRIZE_TIERS.findIndex(t => activePlayers <= t.maxPlayers);
  const currentTier      = PRIZE_TIERS[currentTierIndex];
  const nextTier         = PRIZE_TIERS[currentTierIndex + 1];
  if (!nextTier) return null;

  const playersNeeded   = currentTier.maxPlayers - activePlayers + 1;
  const nextPool        = (currentTier.maxPlayers + 1) * ENTRY_FEE * PRIZE_POOL_PERCENTAGE;

  return {
    playersNeeded,
    nextPrizes:      nextTier.prizes,
    nextFirstPrize:  Math.round(nextPool * nextTier.percentages[0])
  };
}

// ✅ ELIMINADO: formatMatchDate local reemplazado por formatearFechaLarga de dateUtils

export default function Landing() {
  const navigate = useNavigate();
  const [activePlayers, setActivePlayers]     = useState(0);
  const [displayCount, setDisplayCount]       = useState(0);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading]                 = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'activo');

      setActivePlayers(count || 0);

      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'upcoming')
        .order('match_date', { ascending: true })
        .limit(5);

      setUpcomingMatches(matches || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  // Contador animado
  useEffect(() => {
    if (activePlayers === 0) { setDisplayCount(0); return; }

    let current     = 0;
    const steps     = 60;
    const increment = activePlayers / steps;
    const interval  = 1500 / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= activePlayers) {
        setDisplayCount(activePlayers);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(current));
      }
    }, interval);

    return () => clearInterval(timer);
  }, [activePlayers]);

  const playerCount             = Math.max(activePlayers, 1);
  const { totalPool, prizes }   = calculatePrizes(playerCount);
  const nextTierInfo            = getNextTierInfo(playerCount);

  return (
    <div className="landing">

      {/* ── HERO ── */}
      <section className="landing-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-subtitle">Estados Unidos &nbsp;·&nbsp; Canadá &nbsp;·&nbsp; México</p>
          <h1 className="hero-title">
            Prode Mundial<br /><span>2026</span>
          </h1>
          <p className="hero-date">Junio — Julio 2026</p>
          <div className="hero-buttons">
            <button className="hero-btn" onClick={() => navigate('/register')}>
              ¡Anotate ahora!
            </button>
            <button className="hero-btn hero-btn-secondary" onClick={() => navigate('/login')}>
              Ya tengo cuenta
            </button>
          </div>
        </div>
        <div className="hero-scroll-hint">
          <span>↓</span>
          scroll
        </div>
      </section>

      {/* ── PARTICIPANTES + POZO ── */}
      <section className="landing-stats">
        <div className="stats-container">
          <div className="stat-card participants-card">
            <p className="stat-label">Jugadores confirmados</p>
            <div className="stat-number">{displayCount.toLocaleString('es-AR')}</div>
            <p className="stat-sublabel">con pago confirmado</p>
          </div>
          <div className="stat-card pool-card">
            <p className="stat-label">Pozo total</p>
            <div className="stat-number pool-amount">{formatARS(totalPool)}</div>
          </div>
        </div>
      </section>

      {/* ── PREMIOS ── */}
      <section className="landing-prizes">
        <h2 className="section-title">💰 Premios actuales</h2>
        <p className="section-subtitle">
          Los premios se actualizan automáticamente con cada nuevo participante
        </p>
        <div className="prizes-grid">
          {prizes.map((prize, index) => (
            <div
              key={prize.position}
              className={`prize-card ${index < 3 ? 'prize-top' : 'prize-minor'}`}
            >
              <div className="prize-icon">
                {index < 3 ? MEDAL_ICONS[index] : `${prize.position}°`}
              </div>
              <div className="prize-label">{POSITION_LABELS[index]}</div>
              <div className="prize-amount">{formatARS(prize.amount)}</div>
              <div className="prize-pct">{(prize.percentage * 100).toFixed(0)}% del pozo</div>
            </div>
          ))}
        </div>
        {nextTierInfo && (
          <div className="prizes-next-tier">
            🚀 Con <strong>{nextTierInfo.playersNeeded} jugadores más</strong> se suma un premio extra
            y el 1er puesto sube a <strong>{formatARS(nextTierInfo.nextFirstPrize)}</strong>
          </div>
        )}
      </section>

      {/* ── PUNTUACION ── */}
      <section className="landing-scoring">
        <h2 className="section-title">📊 Sistema de puntuación</h2>
        <div className="scoring-grid">
          <div className="scoring-card exact">
            <div className="scoring-points">3</div>
            <div className="scoring-label">puntos</div>
            <div className="scoring-desc">
              Resultado exacto<br />
              <span>Ej: predecís 2-1 y sale 2-1</span>
            </div>
          </div>
          <div className="scoring-card outcome">
            <div className="scoring-points">1</div>
            <div className="scoring-label">punto</div>
            <div className="scoring-desc">
              Ganador correcto<br />
              <span>Ej: predecís 2-1 y sale 3-0</span>
            </div>
          </div>
          <div className="scoring-card zero">
            <div className="scoring-points">0</div>
            <div className="scoring-label">puntos</div>
            <div className="scoring-desc">
              Resultado incorrecto<br />
              <span>Ej: predecís 2-1 y sale 0-0</span>
            </div>
          </div>
        </div>
        <div className="scoring-note">
          ⏱ Las predicciones se cierran <strong>30 minutos antes</strong> de cada partido
        </div>
      </section>

      {/* ── PRÓXIMOS PARTIDOS ── */}
      <section className="landing-matches">
        <h2 className="section-title">📅 Próximos partidos</h2>
        {loading ? (
          <p className="loading-text">Cargando partidos...</p>
        ) : upcomingMatches.length === 0 ? (
          <p className="loading-text">⚽ Próximamente...</p>
        ) : (
          <div className="matches-list">
            {upcomingMatches.map(match => (
              <div key={match.id} className="match-card">
                <div className="match-teams">
                  <span className="team">
                    {match.home_flag && (
                      <img
                        src={getFlagUrl(match.home_flag)}
                        alt={match.home_team}
                        className="flag-img"
                      />
                    )}
                    {match.home_team}
                  </span>
                  <span className="vs">vs</span>
                  <span className="team">
                    {match.away_flag && (
                      <img
                        src={getFlagUrl(match.away_flag)}
                        alt={match.away_team}
                        className="flag-img"
                      />
                    )}
                    {match.away_team}
                  </span>
                </div>
                <div className="match-info">
                  <span className="match-group">{match.group_name}</span>
                  {/* ✅ formatearFechaLarga reemplaza a formatMatchDate */}
                  <span className="match-date">
                    {formatearFechaLarga(match.match_date) ?? 'Fecha por confirmar'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── CTA FINAL ── */}
      <section className="landing-cta">
        <h2>¿Estás listo para competir?</h2>
        <p>Anotate antes de que empiece el torneo y ganá tu parte del pozo</p>
        <div className="hero-buttons">
          <button className="hero-btn" onClick={() => navigate('/register')}>
            ¡Quiero participar!
          </button>
          <button className="hero-btn hero-btn-secondary" onClick={() => navigate('/login')}>
            Ya tengo cuenta
          </button>
        </div>
      </section>

    </div>
  );
}
