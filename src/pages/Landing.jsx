// src/pages/Landing.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link  } from 'react-router-dom';
import { calculatePrizes, formatARS, PRIZE_TIERS, ENTRY_FEE, PRIZE_POOL_PERCENTAGE } from '../utils/prizeCalculator';
import '../styles/Landing.css';
import { supabase, getFlagUrl } from '../lib/supabaseClient';
import { formatearFechaLarga } from '../utils/dateUtils';
import rygarLogo from '../assets/rygar-logo.png';

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

  const playersNeeded = currentTier.maxPlayers - activePlayers + 1;
  const nextPool      = (currentTier.maxPlayers + 1) * ENTRY_FEE * PRIZE_POOL_PERCENTAGE;

  return {
    playersNeeded,
    nextPrizes:     nextTier.prizes,
    nextFirstPrize: Math.round(nextPool * nextTier.percentages[0])
  };
}

// Hook para detectar cuando un elemento entra en viewport
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Si ya es visible (display none → block), marcar directo
    const style = window.getComputedStyle(el);
    if (style.display === 'none') {
      setInView(true); // forzar visible si está oculto por display:none
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.15, ...options });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}

export default function Landing() {
  const navigate = useNavigate();
  const [activePlayers, setActivePlayers]     = useState(0);
  const [displayCount, setDisplayCount]       = useState(0);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [groupsOpen, setGroupsOpen]           = useState(false);
  const [knockoutOpen, setKnockoutOpen]       = useState(false);

  // refs para animaciones de entrada
  const [statsRef, statsInView]           = useInView();
  const [prizesRef, prizesInView]         = useInView();
  const [scoringRef, scoringInView]       = useInView();
  const [competitionsRef, competitionsInView] = useInView();
  const [matchesRef, matchesInView]       = useInView();

  useEffect(() => {
    async function fetchData() {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setActivePlayers(count || 0);

      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'upcoming')
        .order('match_date', { ascending: true })
        .limit(5);

      setUpcomingMatches(matches || []);

      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['groups_registration_open', 'knockout_registration_open']);

      if (settings) {
        settings.forEach(s => {
          if (s.key === 'groups_registration_open')   setGroupsOpen(s.value === 'true' || s.value === 'true');
          if (s.key === 'knockout_registration_open') setKnockoutOpen(s.value === 'true' || s.value === 'true');
        });
      }

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

  const playerCount           = Math.max(activePlayers, 1);
  const { totalPool, prizes } = calculatePrizes(playerCount);
  const nextTierInfo          = getNextTierInfo(playerCount);

  return (
    <div className="landing">

      {/* ── HERO ── */}
      <section className="landing-hero">
        <div className="hero-overlay" />

        {/* Partículas CSS */}
        <div className="hero-particles" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className="particle" style={{ '--i': i }} />
          ))}
        </div>

        <div className="hero-content">
          {/* Badge */}
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Mundial 2026
        </div>

        <p className="hero-subtitle">Estados Unidos &nbsp;·&nbsp; Canadá &nbsp;·&nbsp; México</p>

        {/* Título + Logo Rygar */}
       <div className="hero-title-wrapper">
          <img 
             src={rygarLogo}
            alt="Rygar Pool & Pub"
            className="hero-sponsor-logo"
          />
          <div className="hero-title">
            <span className="hero-title-prode">Prode</span>
            <span className="hero-title-mundial">Mundial</span>
          </div>
        </div>
          <p className="hero-date">Junio — Julio 2026</p>

          <div className="hero-buttons">
            {groupsOpen && (
              <button className="hero-btn" onClick={() => navigate('/register')}>
                ¡Anotate a Fase de Grupos!
              </button>
            )}
            {knockoutOpen && (
              <button className="hero-btn hero-btn-knockout" onClick={() => navigate('/register?competition=knockout')}>
                ¡Anotate a Eliminatorias!
              </button>
            )}
            {!groupsOpen && !knockoutOpen && (
              <button className="hero-btn" disabled style={{ opacity: 0.5, cursor: 'default' }}>
                Inscripciones cerradas
              </button>
            )}
            <button className="hero-btn hero-btn-secondary" onClick={() => navigate('/login')}>
              Ya tengo cuenta
            </button>
            <Link to="/reglas" className="hero-btn hero-btn-rules">
              📋 Reglas
            </Link>
            <a
              href="https://chat.whatsapp.com/I4cAhUo4nv5C5PgbCOIw2g"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-btn hero-btn-whatsapp"
            >
              💬 Unirse al grupo de WhatsApp
            </a>
          </div>
        </div>

        <div className="hero-scroll-hint">
          <span>↓</span>
          scroll
        </div>
      </section>

      {/* ── STATS ── */}
      <section
        className={`landing-stats ${statsInView ? 'section-visible' : 'section-hidden'}`}
        ref={statsRef}
      >
        <div className="stats-container">
          <div className="stat-card participants-card">
            <div className="stat-icon">👥</div>
            <p className="stat-label">Jugadores confirmados</p>
            <div className="stat-number">{displayCount.toLocaleString('es-AR')}</div>
            <p className="stat-sublabel">con pago confirmado</p>
          </div>
        </div>
      </section>

      {/* ── PREMIOS ── */}
      <section
        className={`landing-prizes ${prizesInView ? 'section-visible' : 'section-hidden'}`}
        ref={prizesRef}
      >
        <h2 className="section-title">💰 Premios actuales</h2>
        <p className="section-subtitle">
          Los premios se actualizan automáticamente con cada nuevo participante
        </p>

        {/* Podio top 3 */}
        <div className="prizes-podium">
          {/* 2do lugar — izquierda */}
          {prizes[1] && (
            <div className="podium-slot podium-second">
              <div className="podium-card">
                <div className="prize-icon">🥈</div>
                <div className="prize-label">2do Premio</div>
                <div className="prize-amount silver">{formatARS(prizes[1].amount)}</div>
                <div className="prize-pct">{(prizes[1].percentage * 100).toFixed(0)}% del pozo</div>
              </div>
              <div className="podium-base podium-base-2">2</div>
            </div>
          )}

          {/* 1er lugar — centro, más alto */}
          {prizes[0] && (
            <div className="podium-slot podium-first">
              <div className="podium-crown">👑</div>
              <div className="podium-card podium-card-first">
                <div className="prize-icon">🥇</div>
                <div className="prize-label">1er Premio</div>
                <div className="prize-amount gold">{formatARS(prizes[0].amount)}</div>
                <div className="prize-pct">{(prizes[0].percentage * 100).toFixed(0)}% del pozo</div>
              </div>
              <div className="podium-base podium-base-1">1</div>
            </div>
          )}

          {/* 3er lugar — derecha */}
          {prizes[2] && (
            <div className="podium-slot podium-third">
              <div className="podium-card">
                <div className="prize-icon">🥉</div>
                <div className="prize-label">3er Premio</div>
                <div className="prize-amount bronze">{formatARS(prizes[2].amount)}</div>
                <div className="prize-pct">{(prizes[2].percentage * 100).toFixed(0)}% del pozo</div>
              </div>
              <div className="podium-base podium-base-3">3</div>
            </div>
          )}
        </div>

        {/* Premios menores */}
        {prizes.length > 3 && (
          <>
            <p className="prizes-minor-title">Más premios</p>
            <div className="prizes-minor-grid">
              {prizes.slice(3).map((prize, index) => (
                <div key={prize.position} className="prize-minor-card">
                  <div className="prize-minor-pos">{prize.position}°</div>
                  <div className="prize-minor-label">{POSITION_LABELS[index + 3]}</div>
                  <div className="prize-minor-amount">{formatARS(prize.amount)}</div>
                  <div className="prize-pct">{(prize.percentage * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </>
        )}

        {nextTierInfo && (
          <div className="prizes-next-tier">
            🚀 Con <strong>{nextTierInfo.playersNeeded} jugadores más</strong> se suma un premio extra
            y el 1er puesto sube a <strong>{formatARS(nextTierInfo.nextFirstPrize)}</strong>
          </div>
        )}
      </section>

      {/* ── PUNTUACIÓN ── */}
      <section
        className={`landing-scoring ${scoringInView ? 'section-visible' : 'section-hidden'}`}
        ref={scoringRef}
      >
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

      {/* ── COMPETENCIAS ── */}
      <section
        className={`landing-competitions ${competitionsInView ? 'section-visible' : 'section-hidden'}`}
        ref={competitionsRef}
        style={{ display: (groupsOpen || knockoutOpen) ? '' : 'none' }}
      >
        <h2 className="section-title">🏆 Competencias disponibles</h2>
        <p className="section-subtitle">Elegí tu competencia o participá en las dos</p>

        <div className="competitions-grid">
          {groupsOpen && (
            <div className="competition-card groups-card">
              <div className="competition-card-header groups-header">
                <div className="competition-icon">⚽</div>
                <div className="competition-badge">Disponible</div>
              </div>
              <h3>Fase de Grupos</h3>
              <p>Predecí los 72 partidos de la fase de grupos del Mundial 2026</p>
              <ul className="competition-features">
                <li>✅ 72 partidos para predecir</li>
                <li>✅ 3 pts resultado exacto / 1 pt ganador</li>
                <li>✅ Cierre 30 min antes de cada partido</li>
              </ul>
              <div className="competition-fee groups-fee">$40.000 ARS</div>
              <button className="hero-btn competition-btn" onClick={() => navigate('/register')}>
                Inscribirme a Groups
              </button>
            </div>
          )}

          {knockoutOpen && (
            <div className="competition-card knockout-card">
              <div className="competition-card-header knockout-header">
                <div className="competition-icon">🏆</div>
                <div className="competition-badge knockout-badge">Disponible</div>
              </div>
              <h3>Fase Knockout</h3>
              <p>Predecí los partidos eliminatorios incluyendo penales y el campeón</p>
              <ul className="competition-features">
                <li>✅ R32, R16, QF, SF, Final</li>
                <li>✅ Incluye penales y prórroga</li>
                <li>✅ Predicción del campeón (10 pts)</li>
              </ul>
              <div className="competition-fee knockout-fee">$20.000 ARS</div>
              <button className="hero-btn hero-btn-knockout competition-btn" onClick={() => navigate('/register?competition=knockout')}>
                Inscribirme al Knockout
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── PRÓXIMOS PARTIDOS ── */}
      <section
        className={`landing-matches ${matchesInView ? 'section-visible' : 'section-hidden'}`}
        ref={matchesRef}
      >
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
          {groupsOpen && (
            <button className="hero-btn" onClick={() => navigate('/register')}>
              ¡Quiero participar en Groups!
            </button>
          )}
          {knockoutOpen && (
            <button className="hero-btn hero-btn-knockout" onClick={() => navigate('/register?competition=knockout')}>
              ¡Quiero participar en Knockout!
            </button>
          )}
          {!groupsOpen && !knockoutOpen && (
            <p style={{ color: '#c4b5fd', fontWeight: '600' }}>
              Las inscripciones están cerradas por el momento
            </p>
          )}
          <button className="hero-btn hero-btn-secondary" onClick={() => navigate('/login')}>
            Ya tengo cuenta
          </button>
        </div>
      </section>

    </div>
  );
}
