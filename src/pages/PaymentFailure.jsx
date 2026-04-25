import { useNavigate } from 'react-router-dom'

export default function PaymentFailure() {
  const navigate = useNavigate()

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">❌ Pago rechazado</h2>
        <p className="auth-subtitle">
          El pago no pudo procesarse. Podés intentarlo de nuevo.
        </p>
        <button
          className="auth-button"
          onClick={() => navigate('/register')}
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
