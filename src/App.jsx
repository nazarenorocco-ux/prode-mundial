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

  if (isPending) {
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

function OpenRoute({ children }) {
  return children
}

export default function App() {
  return (
    <Routes>
      {/* ── Públicas ──────────────────────────────────────────────────────── */}
      <Route path="/" element={<OpenRoute><Landing /></OpenRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

      {/* ── Abiertas ──────────────────────────────────────────────────────── */}
      <Route path="/registro-exitoso" element={<OpenRoute><RegistroExitoso /></OpenRoute>} />
      <Route path="/payment/success" element={<OpenRoute><PaymentSuccess /></OpenRoute>} />
      <Route path="/payment/failure" element={<OpenRoute><PaymentFailure /></OpenRoute>} />
      <Route path="/payment/pending" element={<OpenRoute><PaymentPending /></OpenRoute>} />

      {/* ── Privadas ──────────────────────────────────────────────────────── */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
      <Route path="/knockout" element={<PrivateRoute><Knockout /></PrivateRoute>} />

      {/* ── Admin ─────────────────────────────────────────────────────────── */}
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="/admin/knockout" element={<AdminRoute><KnockoutAdmin /></AdminRoute>} />

      {/* ── Fallback ──────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
