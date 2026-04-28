import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [success, setSuccess] = useState(false)

  const navigate = useNavigate()
  const handledRef = useRef(false)

  useEffect(() => {
    localStorage.setItem('recovery_in_progress', 'true')

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!ready) {
      setError('El link de recuperación no es válido o expiró.')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setLoading(false)
      setError('No se pudo actualizar la contraseña.')
      return
    }

    if (handledRef.current) return
    handledRef.current = true

    setSuccess(true)

    try {
      await supabase.auth.signOut({ scope: 'global' })
    } catch (e) {
      console.error('Error al cerrar sesión después del reset:', e)
    } finally {
      localStorage.removeItem('recovery_in_progress')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1000)
    }
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">✅ Contraseña actualizada</h1>
          <p className="auth-subtitle">Redirigiendo al login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">🔒 Nueva contraseña</h1>
        <p className="auth-subtitle">Elegí una nueva contraseña</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label>Repetir contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
