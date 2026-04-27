import { useNavigate } from 'react-router-dom'

export default function PaymentSuccess() {
  const navigate = useNavigate()

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h2 className="auth-title">¡Pago recibido!</h2>
        <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
          Tu pago está siendo procesado. En unos minutos tu cuenta
          quedará activa automáticamente.
        </p>
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginBottom: '1.5rem',
          lineHeight: '1.5'
        }}>
          Si en 5 minutos no podés acceder, contactanos por WhatsApp.
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
