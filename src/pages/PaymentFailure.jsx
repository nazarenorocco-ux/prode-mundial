import { useNavigate } from 'react-router-dom'

export default function PaymentFailure() {
  const navigate = useNavigate()

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <h2 className="auth-title">Pago rechazado</h2>
        <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
          El pago no pudo procesarse. Podés intentarlo de nuevo o elegir
          pago por transferencia bancaria.
        </p>
        <button
          className="btn btn-primary btn-full"
          onClick={() => navigate('/register')}
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
