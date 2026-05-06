import { Link } from 'react-router-dom'

export default function KnockoutComingSoon() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Próximamente</h2>

        <p className="auth-subtitle">
          La competencia de knockout todavía no está habilitada. Apenas se active, vas a poder
          sumarte y cargar tus pronósticos.
        </p>

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link to="/" className="btn-mercadopago" style={{ textAlign: 'center' }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
