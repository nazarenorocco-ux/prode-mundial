// ResetPassword.jsx completo
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [ready, setReady]       = useState(false)
  const navigate  = useNavigate()
  const { signOut } = useAuth()  // ✅ usar el signOut del contexto

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setReady(true)
      }

      if (event === 'USER_UPDATED') {
        setLoading(false)
        setSuccess(true)
        // ✅ signOut del contexto → setea isSigningOutRef = true
        // → AuthContext maneja limpiamente → navigate a login
        signOut().then(() => {
          setTimeout(() => navigate('/login', { replace: true }), 3000)
        })
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [navigate, signOut])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!ready) {
      setError('El link expiró. Solicitá uno nuevo.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    supabase.auth.updateUser({ password }).then(({ error: updateError }) => {
      if (updateError) {
        setLoading(false)
        if (
          updateError.message?.toLowerCase().includes('same') ||
          updateError.message?.toLowerCase().includes('different')
        ) {
          setError('La nueva contraseña debe ser diferente a la anterior.')
          return
        }
        setError('No se pudo actualizar. El link puede haber expirado.')
      }
    })
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">✅ ¡Listo!</h1>
          <p className="auth-subtitle">Tu contraseña fue actualizada correctamente.</p>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '1rem' }}>
            Redirigiendo al login en 3 segundos...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">🔒 Nueva contraseña</h1>
        <p className="auth-subtitle">Elegí una contraseña nueva</p>

        {!ready && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Verificando link...
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div className="form-group">
            <label>Repetir contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || !ready}
          >
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
