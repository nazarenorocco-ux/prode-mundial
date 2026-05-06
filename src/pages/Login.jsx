import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { user, profile, loading: authLoading, profileLoading, signingOut } = useAuth()

  useEffect(() => {
    if (authLoading || profileLoading || signingOut) return
    if (!user || !profile) return

    if (profile.status === 'pending') {
      navigate('/payment/pending', { replace: true })
      return
    }

    if (profile.status === 'active') {
      navigate('/dashboard', { replace: true })
      return
    }

    if (profile.status === 'blocked') {
      navigate('/login', { replace: true })
    }
  }, [user, profile, authLoading, profileLoading, signingOut, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // La redirección la hace el useEffect cuando el profile esté listo
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Iniciar sesión</h2>
        <p className="auth-subtitle">Accedé con tu email y contraseña</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              required
            />
          </div>

          <button type="submit" className="btn-mercadopago" disabled={loading}>
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: '1rem' }}>
          <Link to="/forgot-password" className="auth-link">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <p className="auth-link" style={{ marginTop: '1rem' }}>
          ¿No tenés cuenta? <Link to="/register">Registrate</Link>
        </p>
      </div>
    </div>
  )
}
