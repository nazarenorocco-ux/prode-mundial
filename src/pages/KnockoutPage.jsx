import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function KnockoutPage() {
  const { user, profile, loading, profileLoading, signingOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading || profileLoading || signingOut) return

    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [user, loading, profileLoading, signingOut, navigate])

  if (loading || profileLoading || signingOut) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Cargando...</h2>
          <p className="auth-subtitle">Verificando competencia</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Competencia knockout</h2>

        <p className="auth-subtitle">
          Bienvenido a la competencia knockout. Acá vas a poder ver el estado de tu inscripción
          y acceder a tus pronósticos cuando esté habilitada.
        </p>

        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: '12px',
            background: 'rgba(147, 51, 234, 0.12)',
            color: '#c084fc'
          }}
        >
          Estado de cuenta: <strong>{profile?.status || 'pendiente'}</strong>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link to="/knockout/join" className="btn-mercadopago" style={{ textAlign: 'center' }}>
            Sumarme
          </Link>

          <Link to="/" className="auth-link" style={{ textAlign: 'center' }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
