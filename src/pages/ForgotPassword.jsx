import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://prode-mundial-tau.vercel.app/reset-password'
    })

    setLoading(false)

    if (resetError) {
      setError('No se pudo enviar el email. Verificá la dirección e intentá de nuevo.')
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">📧 Revisá tu email</h1>
          <p className="auth-subtitle">
            Te mandamos un link a <strong>{email}</strong> para restablecer tu contraseña.
          </p>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '1rem' }}>
            Si no llega en unos minutos, revisá la carpeta de spam.
          </p>
          <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
            <Link to="/login">Volver al inicio de sesión</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">🔑 Recuperar contraseña</h1>
        <p className="auth-subtitle">Ingresá tu email y te mandamos un link</p>

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

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">← Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  )
}
