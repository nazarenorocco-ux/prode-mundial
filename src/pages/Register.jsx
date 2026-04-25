import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Crear usuario en Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      })

      if (signUpError) throw signUpError

      const userId = data.user.id

      // 2. Actualizar perfil con status pendiente
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username, status: 'pendiente' })
        .eq('id', userId)

      if (profileError) throw profileError

      // 3. Crear preferencia de pago en MercadoPago
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail: email })
      })

      const paymentData = await response.json()

      if (!paymentData.init_point) {
        throw new Error('No se pudo crear el link de pago')
      }

      // 4. Redirigir a MercadoPago
      window.location.href = paymentData.init_point

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Crear cuenta</h2>
        <p className="auth-subtitle">
          La inscripción se realiza con unan donación de <strong>$40.000 ARS</strong>
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label>Nombre de usuario</label>
            <input
              type="text"
              placeholder="Tu nombre"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Registrarme y Donar →'}
          </button>
        </form>

        <p className="auth-link">
          ¿Ya tenés cuenta? <a href="/login">Iniciá sesión</a>
        </p>
      </div>
    </div>
  )
}
