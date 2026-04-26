import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'

// ─── Datos de contacto para transferencia manual ───────────────────────────
const TRANSFER_INFO = {
  alias: 'borro.214',
  cbu: '0000003100012341234567',
  banco: 'Personal Pay',
  titular: 'Lambertucci Roberto',
  whatsapp: '+54 9 3401 648383',
  monto: '$40.000 ARS'
}

// ─── Modal de transferencia ────────────────────────────────────────────────
function TransferModal({ onClose }) {
  const [copied, setCopied] = useState(null)

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <span className="modal-icon">🏦</span>
          <h3>Donar por Transferencia</h3>
          <p>Realizá una transferencia de <strong>{TRANSFER_INFO.monto}</strong> y envianos el comprobante</p>
        </div>

        <div className="transfer-info">

          <div className="transfer-row">
            <span className="transfer-label">Alias</span>
            <div className="transfer-value-group">
              <span className="transfer-value">{TRANSFER_INFO.alias}</span>
              <button
                className={`copy-btn ${copied === 'alias' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(TRANSFER_INFO.alias, 'alias')}
              >
                {copied === 'alias' ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          <div className="transfer-row">
            <span className="transfer-label">CBU</span>
            <div className="transfer-value-group">
              <span className="transfer-value cbu">{TRANSFER_INFO.cbu}</span>
              <button
                className={`copy-btn ${copied === 'cbu' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(TRANSFER_INFO.cbu, 'cbu')}
              >
                {copied === 'cbu' ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          <div className="transfer-row">
            <span className="transfer-label">Banco</span>
            <span className="transfer-value">{TRANSFER_INFO.banco}</span>
          </div>

          <div className="transfer-row">
            <span className="transfer-label">Titular</span>
            <span className="transfer-value">{TRANSFER_INFO.titular}</span>
          </div>

        </div>

        <div className="transfer-contact">
          <p>📱 Enviá el comprobante por WhatsApp:</p>
          <a
            href={`https://wa.me/${TRANSFER_INFO.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-btn"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {TRANSFER_INFO.whatsapp}
          </a>
        </div>

        <div className="transfer-note">
          <span>⚠️</span>
          <p>Tu cuenta quedará <strong>pendiente</strong> hasta que confirmemos tu pago. Te avisaremos por WhatsApp.</p>
        </div>

        <button className="modal-done-btn" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(null) // 'mp' | 'manual' | null
  const [showTransferModal, setShowTransferModal] = useState(false)

  // Paso 1: solo crear la cuenta (sin pago aún)
  const createAccount = async () => {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    })
    if (signUpError) throw signUpError

    const userId = data.user.id

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ username, status: 'pendiente' })
      .eq('id', userId)

    if (profileError) throw profileError

    return userId
  }

  // Botón MercadoPago
  const handleMercadoPago = async (e) => {
    e.preventDefault()
    setError('')
    setLoading('mp')

    try {
      const userId = await createAccount()

      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail: email })
      })

      const paymentData = await response.json()
      if (!paymentData.init_point) throw new Error('No se pudo crear el link de pago')

      window.location.href = paymentData.init_point

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(null)
    }
  }

  // Botón transferencia manual
  const handleManual = async (e) => {
    e.preventDefault()
    setError('')
    setLoading('manual')

    try {
      await createAccount()
      setShowTransferModal(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      {showTransferModal && (
        <TransferModal onClose={() => setShowTransferModal(false)} />
      )}

      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Crear cuenta</h2>
          <p className="auth-subtitle">
            La inscripción se realiza con una donación de <strong>$40.000 ARS</strong>
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form">
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

            {/* ── Botones de pago ── */}
            <div className="payment-buttons">
              <button
                type="button"
                className="btn-mercadopago"
                onClick={handleMercadoPago}
                disabled={loading !== null}
              >
                {loading === 'mp' ? (
                  <span>Procesando...</span>
                ) : (
                  <>
                    <img
                      src="https://imgmp.mlstatic.com/org-img/banners/ar/medios/120X60.jpg"
                      alt="MercadoPago"
                      className="mp-logo"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                    <span>Registrarse y Donar con MercadoPago</span>
                  </>
                )}
              </button>

              <div className="payment-divider">
                <span>o</span>
              </div>

              <button
                type="button"
                className="btn-transfer"
                onClick={handleManual}
                disabled={loading !== null}
              >
                {loading === 'manual' ? (
                  <span>Creando cuenta...</span>
                ) : (
                  <>
                    <span className="btn-icon">🏦</span>
                    <span>Registrase y Donar por Transferencia / Otro medio</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="auth-link">
            ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
          </p>
        </div>
      </div>
    </>
  )
}
