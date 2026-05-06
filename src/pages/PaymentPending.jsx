import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PaymentPending() {
  const { user, profile, loading, profileLoading, signingOut, isPending, isActive } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading || profileLoading || signingOut) return

    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    if (isActive || profile?.status === 'active') {
      navigate('/dashboard', { replace: true })
      return
    }
  }, [user, profile, loading, profileLoading, signingOut, isActive, navigate])

  if (loading || profileLoading || signingOut) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Cargando...</h2>
          <p className="auth-subtitle">Verificando tu estado de pago</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Pago pendiente</h2>

        <p className="auth-subtitle">
          Tu cuenta todavía está pendiente de confirmación. En breve te vamos a habilitar
          cuando verifiquemos tu pago.
        </p>

        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: '12px',
            background: 'rgba(251, 191, 36, 0.12)',
            color: '#facc15'
          }}
        >
          Estado actual: <strong>{profile?.status || 'pending'}</strong>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link to="/" className="btn-mercadopago" style={{ textAlign: 'center' }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
