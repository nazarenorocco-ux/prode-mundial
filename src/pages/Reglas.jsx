import { Link } from 'react-router-dom';
import './Reglas.css';

export default function Reglas() {
  return (
    <div className="reglas-page">
      <div className="reglas-container">

        {/* ── HEADER ── */}
        <div className="reglas-header">
          <Link to="/" className="reglas-back">← Volver al inicio</Link>
          <h1 className="reglas-title">📋 Reglas del Prode</h1>
          <p className="reglas-subtitle">Todo lo que necesitás saber para participar en el Mundial 2026</p>
        </div>

        {/* ── DOS COMPETENCIAS ── */}
        <div className="reglas-block">
          <h2 className="reglas-block-title">
            <span className="reglas-step">1</span>
            Dos competencias independientes
          </h2>
          <p className="reglas-intro-text">
            El prode tiene <strong>dos fases separadas</strong>. Podés anotarte en una o en ambas.
            Cada una tiene su propio ranking, su propio pozo de premios y su propia inscripción.
          </p>

          <div className="reglas-comps-banner">
            <div className="reglas-comp-card reglas-comp-groups">
              <div className="reglas-comp-icon">🏟️</div>
              <h3>Fase de Grupos</h3>
              <p>Predecí los 72 partidos de la fase de grupos del Mundial 2026.</p>
              <div className="reglas-comp-fee">$40.000</div>
            </div>

            <div className="reglas-comp-separator">
              <span>+</span>
              <p>Independientes entre sí. Ranking y premios propios.</p>
            </div>

            <div className="reglas-comp-card reglas-comp-knockout">
              <div className="reglas-comp-icon">⚡</div>
              <h3>Fase Eliminatoria</h3>
              <p>Predecí desde dieciseisavos de final hasta la gran final.</p>
              <div className="reglas-comp-fee reglas-fee-knockout">$20.000</div>
            </div>
          </div>

          <div className="reglas-tip">
           
          </div>
        </div>

        {/* ── CÓMO REGISTRARSE ── */}
            <div className="reglas-block">
            <h2 className="reglas-block-title">
                <span className="reglas-step">2</span>
                Cómo registrarse
            </h2>
            <div className="reglas-steps">
                <div className="reglas-step-item">
                <span className="reglas-step-icon">📝</span>
                <div>
                    <strong>Creá tu cuenta</strong>
                    <p>Completá el formulario con tu nombre, usuario y contraseña.</p>
                </div>
                </div>
                <div className="reglas-step-item">
                <span className="reglas-step-icon">💸</span>
                <div>
                    <strong>Realizá tu donación</strong>
                    <p>
                    Transferí al alias <strong>borro.214</strong> el monto correspondiente:
                    <strong> $40.000</strong> para Grupos o <strong>$20.000</strong> para Eliminatorias.
                    </p>
                </div>
                </div>
                <div className="reglas-step-item">
                <span className="reglas-step-icon">✅</span>
                <div>
                    <strong>Activación</strong>
                    <p>
                    Verificamos el pago y activamos tu cuenta. Te avisamos por WhatsApp.
                    Una vez activo, podés cargar tus predicciones.
                    </p>
                </div>
                </div>
            </div>
            </div>

        {/* ── PUNTUACIÓN GRUPOS ── */}
        <div className="reglas-block">
          <h2 className="reglas-block-title">
            <span className="reglas-step">3</span>
            Sistema de puntuación — Fase de Grupos
          </h2>
          <p className="reglas-block-desc">
            Por cada partido de la fase de grupos cargás el marcador que creés que va a salir.
            Los puntos se asignan al terminar cada partido:
          </p>
          <div className="reglas-scoring-grid">
            <div className="reglas-score-card reglas-score-exact">
              <div className="reglas-score-pts">3 pts</div>
              <div className="reglas-score-name">Resultado exacto</div>
              <div className="reglas-score-desc">Acertás el marcador exacto</div>
              <div className="reglas-score-example">Predecís 2‑1 → sale 2‑1 ✓</div>
            </div>
            <div className="reglas-score-card reglas-score-outcome">
              <div className="reglas-score-pts">1 pt</div>
              <div className="reglas-score-name">Resultado correcto</div>
              <div className="reglas-score-desc">Acertás si ganó local, visitante o empate</div>
              <div className="reglas-score-example">Predecís 2‑1 → sale 1‑0 (ganó local) ✓</div>
            </div>
            <div className="reglas-score-card reglas-score-zero">
              <div className="reglas-score-pts">0 pts</div>
              <div className="reglas-score-name">Sin puntos</div>
              <div className="reglas-score-desc">El resultado no coincide con tu predicción</div>
              <div className="reglas-score-example">Predecís 2‑1 → sale 0‑0 ✗</div>
            </div>
          </div>
        </div>

        {/* ── PUNTUACIÓN ELIMINATORIAS ── */}
        <div className="reglas-block">
          <h2 className="reglas-block-title">
            <span className="reglas-step">4</span>
            Sistema de puntuación — Fase Eliminatoria
          </h2>
          <p className="reglas-block-desc">
           En eliminatorias, los partidos pueden extenderse a alargue. Los puntos se calculan al finalizar el tiempo de juego,
            ya sea a los 90' o a los 120' dependiendo de cuánto dure el encuentro.
             En caso de predecir un empate, podrás predecir también el resultado de los penales.
              Acertar el marcador exacto o el resultado correcto te otorgará puntos extras.
          </p>
          <div className="reglas-scoring-grid">
            <div className="reglas-score-card reglas-score-exact">
              <div className="reglas-score-pts">3 pts</div>
              <div className="reglas-score-name">Marcador exacto</div>
              <div className="reglas-score-desc">Acertás el marcador al final del tiempo reglamentario</div>
              <div className="reglas-score-example">Predecís 1‑0 → sale 1‑0  ✓</div>
            </div>
            <div className="reglas-score-card reglas-score-outcome">
              <div className="reglas-score-pts">1 pts</div>
              <div className="reglas-score-name">Ganador correcto</div>
              <div className="reglas-score-desc">Acertás qué equipo avanza aunque no el marcador exacto</div>
              <div className="reglas-score-example">Predecís que gana Brasil → gana Brasil por penales ✓</div>
            </div>
            <div className="reglas-score-card reglas-score-zero">
              <div className="reglas-score-pts">0 pts</div>
              <div className="reglas-score-name">Sin puntos</div>
              <div className="reglas-score-desc">El equipo que elegiste queda eliminado</div>
              <div className="reglas-score-example">Predecís que gana Brasil → avanza Argentina ✗</div>
            </div>
          </div>

          {/* Campeón */}
          <div className="reglas-champion-banner">
            <span className="reglas-champion-icon">🏆</span>
            <div>
              <strong>Predicción del Campeón — 10 puntos</strong>
              <p>
                Al inscribirte en Eliminatorias elegís un campeón del torneo. Si acertás sumás
                <strong> 10 puntos extra</strong> al finalizar el torneo.
                La elección se bloquea <strong>30 minutos antes del primer partido de dieciseisavos de final.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* ── FECHAS LÍMITE ── */}
        <div className="reglas-block">
          <h2 className="reglas-block-title">
            <span className="reglas-step">5</span>
            Fechas límite para predecir
          </h2>
          <div className="reglas-deadlines">
            <div className="reglas-deadline-item">
              <span>🏟️</span>
              <div>
                <strong>Fase de Grupos</strong>
                <p>Cada predicción se bloquea <strong>30 minutos antes</strong> del inicio del partido.</p>
              </div>
            </div>
            <div className="reglas-deadline-item">
              <span>⚡</span>
              <div>
                <strong>Eliminatorias</strong>
                <p>Cada predicción se bloquea <strong>30 minutos antes</strong> del partido correspondiente.</p>
              </div>
            </div>
            <div className="reglas-deadline-item">
              <span>🏆</span>
              <div>
                <strong>Campeón</strong>
                <p>Se bloquea <strong>30 minutos antes</strong> del primer partido de dieciseisavos de final.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── PREMIOS ── */}
        <div className="reglas-block">
          <h2 className="reglas-block-title">
            <span className="reglas-step">6</span>
            Premios
          </h2>
          <p className="reglas-block-desc">
            El pozo de premios se forma con el total de donaciones recaudadas en cada competencia.
            Se distribuye entre los primeros puestos al finalizar el torneo.
            Los montos exactos se anuncian una vez cerrada la inscripción.
          </p>
          <div className="reglas-tip">
            💡 <strong>Fase de Grupos</strong> y <strong>Eliminatorias</strong> tienen pozos y
            rankings completamente separados. Participar en ambas duplica tus chances de ganar.
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="reglas-cta">
          <p>¿Todo claro? ¡Anotate y empezá a predecir!</p>
          <div className="reglas-cta-buttons">
            <Link to="/register" className="btn-primary">Registrarse</Link>
            <Link to="/" className="btn-secondary">Volver al inicio</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
