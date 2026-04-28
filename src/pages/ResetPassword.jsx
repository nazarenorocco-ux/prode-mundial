import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

// Marcamos el recovery apenas se carga el módulo
if (typeof window !== 'undefined') {
  localStorage.setItem('recovery_in_progress', 'true')
}

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  const navigate = useNavigate()
  const handledRef = useRef(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event:', event, session)

        if (event === 'PASSWORD_RECOVERY' && session) {
          setReady(true)
          return
        }

        if (event === 'USER_UPDATED' && !handledRef.current) {
          handledRef.current = true
          setLoading(false)
          setSuccess(true)

          try {
            localStorage.removeItem('recovery_in_progress')
            await supabase.auth.signOut({ scope: 'global' })
          } catch (e) {
            console.error('❌ Error al cerrar sesión luego de recovery:', e)
          } finally {
            setTimeout(() => {
              navigate('/login', { replace: true })
            }, 1200)
          }
        }
      }
    )

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📦 getSession:', session)
      if (session) setReady(true)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [navigate])

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

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setLoading(false)

      if (updateError.status === 422) {
        console.warn('422 falso positivo, esperando USER_UPDATED...')
        return
      }

      if (
        updateError.message?.toLowerCase().includes('same') ||
        updateError.message?.toLowerCase().includes('different')
      ) {
        setError('La nueva contraseña debe ser diferente a la anterior.')
        return
      }

      setError('No se pudo actualizar. El link puede haber expirado.')
    }
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">✅ ¡Listo!</h1>
          <p className="auth-subtitle">Tu contraseña fue actualizada correctamente.</p>
          <p
            style={{
              textAlign: 'center',
              fontSize: '0.85rem',
              color: 'var(--color-text-muted)',
              marginTop: '1rem'
            }}
          >
            Redirigiendo al login...
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
          <div
            style={{
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              marginBottom: '1rem'
            }}
          >
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
