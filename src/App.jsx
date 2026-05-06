import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Pages
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
  const { user, loading, profileLoading, isPending, isBlocked, isActive, isAdmin } = useAuth()
  const location = useLocation()

  if (loading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (isAdmin) {
    return children
  }

  if (isPending) {
    return <Navigate to="/payment/pending" replace />
  }

  if (isBlocked || !isActive) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AdminRoute({ children }) {
  const { user, loading, profileLoading, isAdmin, isSuperAdmin } = useAuth()
  const location = useLocation()

  if (loading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function PublicRoute({ children }) {
  const { user, loading, profileLoading, isPending, isBlocked, isActive, isAdmin } = useAuth()

  if (loading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  if (user) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />
    }

    if (isPending) {
      return <Navigate to="/payment/pending" replace />
    }

    if (isBlocked || !isActive) {
      return <Navigate to="/login" replace />
    }

    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <Landing />
          </PublicRoute>
        }
      />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      <Route
        path="/registro-exitoso"
        element={
          <PublicRoute>
            <RegistroExitoso />
          </PublicRoute>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/payment/success"
        element={
          <PublicRoute>
            <PaymentSuccess />
          </PublicRoute>
        }
      />

      <Route
        path="/payment/failure"
        element={
          <PublicRoute>
            <PaymentFailure />
          </PublicRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/leaderboard"
        element={
          <PrivateRoute>
            <Leaderboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/knockout"
        element={
          <PrivateRoute>
            <Knockout />
          </PrivateRoute>
        }
      />

      <Route
        path="/knockout/page"
        element={
          <PrivateRoute>
            <KnockoutPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/knockout/coming-soon"
        element={
          <PrivateRoute>
            <KnockoutComingSoon />
          </PrivateRoute>
        }
      />

      <Route
        path="/knockout/join"
        element={
          <PrivateRoute>
            <KnockoutJoin />
          </PrivateRoute>
        }
      />

      <Route
        path="/payment/pending"
        element={
          <PrivateRoute>
            <PaymentPending />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/knockout"
        element={
          <AdminRoute>
            <KnockoutAdmin />
          </AdminRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
