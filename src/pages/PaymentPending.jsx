import { useNavigate } from 'react-router-dom'

export default function PaymentPending() {
  const navigate = useNavigate()

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <h2 className="auth-title">Pago pendiente</h2>
        <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
          Tu pago está siendo procesado. Te avisaremos cuando se confirme.
        </p>
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginBottom: '1.5rem',
          lineHeight: '1.5'
        }}>
          Esto puede tardar unos minutos. Una vez confirmado, podrás
          ingresar y cargar tus predicciones.
        </p>
        <button
          className="btn btn-primary btn-full"
          onClick={() => navigate('/login')}
        >
          Ir al Login
        </button>
      </div>
    </div>
  )
}
