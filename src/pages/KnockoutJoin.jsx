import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function KnockoutJoin() {
  const { user, profile, loading, profileLoading, signingOut } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (loading || profileLoading || signingOut) return

    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [user, loading, profileLoading, signingOut, navigate])

  const handleJoin = async () => {
    try {
      setSubmitting(true)
      navigate('/register', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || profileLoading || signingOut) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Cargando...</h2>
          <p className="auth-subtitle">Verificando tu cuenta</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Sumate al knockout</h2>

        <p className="auth-subtitle">
          Ya podés inscribirte a la competencia knockout y empezar a participar con tus
          pronósticos.
        </p>

        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: '12px',
            background: 'rgba(59, 130, 246, 0.12)',
            color: '#60a5fa'
          }}
        >
          Estado actual: <strong>{profile?.status || 'pendiente'}</strong>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            className="btn-mercadopago"
            onClick={handleJoin}
            disabled={submitting}
            style={{ cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? 'Redirigiendo...' : 'Inscribirme'}
          </button>

          <Link to="/" className="auth-link" style={{ textAlign: 'center' }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
