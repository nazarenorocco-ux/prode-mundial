import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verificando')
  const navigate = useNavigate()

  useEffect(() => {
    const activateAccount = async () => {
      try {
        const externalReference = searchParams.get('external_reference')

        if (!externalReference) {
          setStatus('error')
          return
        }

        // Activar cuenta en Supabase
        const { error } = await supabase
          .from('profiles')
          .update({ status: 'activo' })
          .eq('id', externalReference)

        if (error) throw error

        setStatus('exitoso')

        // Redirigir al dashboard después de 3 segundos
        setTimeout(() => navigate('/'), 3000)

      } catch (err) {
        setStatus('error')
      }
    }

    activateAccount()
  }, [])

  return (
    <div className="auth-container">
      <div className="auth-card">
        {status === 'verificando' && (
          <>
            <h2 className="auth-title">⏳ Verificando pago...</h2>
            <p className="auth-subtitle">Aguardá un momento</p>
          </>
        )}

        {status === 'exitoso' && (
          <>
            <h2 className="auth-title">✅ ¡Pago confirmado!</h2>
            <p className="auth-subtitle">
              Tu cuenta está activa. Redirigiendo al dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 className="auth-title">❌ Algo salió mal</h2>
            <p className="auth-subtitle">
              Contactá al administrador
            </p>
            <button
              className="auth-button"
              onClick={() => navigate('/login')}
            >
              Ir al login
            </button>
          </>
        )}
      </div>
    </div>
  )
}
