import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function RegistroExitoso() {
  const { user, profile, loading, profileLoading, signingOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const method = searchParams.get('method')

  useEffect(() => {
    if (loading || profileLoading || signingOut) return

    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    if (profile?.status === 'active') {
      navigate('/dashboard', { replace: true })
    }
  }, [user, profile, loading, profileLoading, signingOut, navigate])

  const handleVolverAlInicio = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading || profileLoading || signingOut) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Cargando...</h2>
          <p className="auth-subtitle">Estamos verificando tu cuenta</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const isPending = profile?.status === 'pending'

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">¡Registro exitoso!</h2>

        <p className="auth-subtitle">
          {method === 'transfer'
            ? 'Recibimos tu solicitud. Tu cuenta quedará pendiente hasta confirmar el pago.'
            : 'Tu cuenta fue creada correctamente. En breve vas a poder acceder.'}
        </p>

        {isPending && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '12px',
              background: 'rgba(251, 191, 36, 0.12)',
              color: '#facc15'
            }}
          >
            Tu cuenta todavía está <strong>pendiente</strong> de confirmación.
          </div>
        )}

       <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link to="/payment/pending" className="btn-mercadopago" style={{ textAlign: 'center' }}>
            Ver mi estado
          </Link>

          <button
            onClick={handleVolverAlInicio}
            className="auth-link"
            style={{ textAlign: 'center', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  )
}
