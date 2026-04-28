import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function getErrorMessage(error) {
  if (!error) return ''
  const msg = error.message?.toLowerCase() ?? ''

  if (msg.includes('invalid login credentials')) {
    return 'Email o contraseña incorrectos'
  }
  if (msg.includes('email not confirmed')) {
    return 'Confirmá tu email antes de ingresar. Revisá tu casilla.'
  }
  if (msg.includes('too many requests') || error.status === 429) {
    return 'Demasiados intentos. Esperá unos minutos antes de volver a intentar.'
  }
  return 'Error al iniciar sesión. Intentá de nuevo.'
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        setError(getErrorMessage(signInError))
        setLoading(false)
        return
      }

      if (!data?.session) {
        setError('No se pudo crear la sesión. Intentá nuevamente.')
        setLoading(false)
        return
      }

      // Fuerza resync de sesión antes de navegar
      await supabase.auth.getSession()

      // Pequeña pausa para que AuthContext tome la sesión
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 200)
    } catch (err) {
      setError('Error de conexión. Verificá tu internet e intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">⚽ Prode Mundial 2026</h1>
        <p className="auth-subtitle">Ingresá a tu cuenta</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
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
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
            <Link
              to="/forgot-password"
              style={{ fontSize: '0.85rem', color: 'var(--color-accent)' }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>

        <div className="auth-footer">
          ¿No tenés cuenta? <Link to="/register">Registrate</Link>
        </div>
      </div>
    </div>
  )
}
