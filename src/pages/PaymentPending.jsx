import { useNavigate } from 'react-router-dom'

export default function PaymentPending() {
  const navigate = useNavigate()

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">⏳ Pago pendiente</h2>
        <p className="auth-subtitle">
          Tu pago está siendo procesado. Te avisaremos cuando se confirme.
        </p>
        <button
          className="auth-button"
          onClick={() => navigate('/login')}
        >
          Ir al login
        </button>
      </div>
    </div>
  )
}
