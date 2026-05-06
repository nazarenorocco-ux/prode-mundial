import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PaymentSuccess() {
  const { user, profile, loading, profileLoading, signingOut, isActive } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading || profileLoading || signingOut) return

    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    if (isActive || profile?.status === 'active') {
      navigate('/dashboard', { replace: true })
    }
  }, [user, profile, loading, profileLoading, signingOut, isActive, navigate])

  if (loading || profileLoading || signingOut) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Procesando...</h2>
          <p className="auth-subtitle">Estamos confirmando tu pago</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">¡Pago recibido!</h2>

        <p className="auth-subtitle">
          Tu pago fue procesado correctamente. Si todavía no ves tu cuenta activa, esperá unos
          minutos o contactanos por WhatsApp.
        </p>

        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: '12px',
            background: 'rgba(34, 197, 94, 0.12)',
            color: '#4ade80'
          }}
        >
          Estado actual: <strong>{profile?.status || 'pendiente'}</strong>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link to="/dashboard" className="btn-mercadopago" style={{ textAlign: 'center' }}>
            Ir al dashboard
          </Link>

          <Link to="/" className="auth-link" style={{ textAlign: 'center' }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
