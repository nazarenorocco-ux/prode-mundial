// src/App.jsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import RegistroExitoso from './pages/RegistroExitoso'
import ResetPassword from './pages/ResetPassword'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Leaderboard from './pages/Leaderboard'
import KnockoutPage from './pages/KnockoutPage'
import KnockoutComingSoon from './pages/KnockoutComingSoon'
import KnockoutJoin from './pages/KnockoutJoin'
import Knockout from './pages/Knockout'
import PaymentPending from './pages/PaymentPending'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentFailure from './pages/PaymentFailure'
import Admin from './pages/Admin'
import KnockoutAdmin from './pages/KnockoutAdmin'

function PrivateRoute({ children }) {
  const { user, loading, profileLoading, signingOut, isPending, isBlocked, isActive, isAdmin, isSuperAdmin } = useAuth()
  const location = useLocation()

  if (loading || profileLoading || signingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: '#94a3b8' }}>Cargando...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (isAdmin || isSuperAdmin) {
    return <><Navbar />{children}</>
  }

  // Permitir acceso a /payment/pending aunque el usuario esté pending
  // sin esta excepción se produce un loop infinito de redirecciones
  if (isPending && location.pathname !== '/payment/pending') {
    return <Navigate to="/payment/pending" replace />
  }

  if (isBlocked || (!isActive && !isPending)) {
    return <Navigate to="/login" replace />
  }

  return <><Navbar />{children}</>
}

function AdminRoute({ children }) {
  const { user, loading, profileLoading, signingOut, isAdmin, isSuperAdmin } = useAuth()
  const location = useLocation()

  if (loading || profileLoading || signingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: '#94a3b8' }}>Cargando...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <><Navbar />{children}</>
}

function PublicRoute({ children }) {
  const { user, loading, profileLoading, signingOut, isPending, isBlocked, isActive, isAdmin, isSuperAdmin } = useAuth()

  if (loading || profileLoading || signingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: '#94a3b8' }}>Cargando...</p>
      </div>
    )
  }

  if (user) {
    if (isAdmin || isSuperAdmin) return <Navigate to="/admin" replace />
    if (isPending) return <Navigate to="/payment/pending" replace />
    if (isBlocked || !isActive) return <Navigate to="/login" replace />
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Ruta abierta: accesible siempre, sin importar estado de autenticación.
// Usada para páginas de destino post-registro o post-pago donde el usuario
// puede estar logueado pero con status pending y no debe ser redirigido.
function OpenRoute({ children }) {
  return children
}

export default function App() {
  return (
    <Routes>
      {/* ── Públicas: solo para NO logueados ─────────────────────────────── */}
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

      {/* ── Abiertas: accesibles siempre, sin redirecciones ──────────────── */}
      {/* /registro-exitoso: destino post-registro (usuario puede estar pending) */}
      {/* /payment/success y /payment/failure: destino post-pago MercadoPago   */}
      <Route path="/registro-exitoso" element={<OpenRoute><RegistroExitoso /></OpenRoute>} />
      <Route path="/payment/success" element={<OpenRoute><PaymentSuccess /></OpenRoute>} />
      <Route path="/payment/failure" element={<OpenRoute><PaymentFailure /></OpenRoute>} />

      {/* ── Privadas: requieren login y status active ─────────────────────── */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
      <Route path="/knockout" element={<PrivateRoute><Knockout /></PrivateRoute>} />
      <Route path="/knockout/page" element={<PrivateRoute><KnockoutPage /></PrivateRoute>} />
      <Route path="/knockout/coming-soon" element={<PrivateRoute><KnockoutComingSoon /></PrivateRoute>} />
      <Route path="/knockout/join" element={<PrivateRoute><KnockoutJoin /></PrivateRoute>} />
      <Route path="/payment/pending" element={<PrivateRoute><PaymentPending /></PrivateRoute>} />

      {/* ── Admin ────────────────────────────────────────────────────────── */}
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="/admin/knockout" element={<AdminRoute><KnockoutAdmin /></AdminRoute>} />

      {/* ── Fallback ─────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
