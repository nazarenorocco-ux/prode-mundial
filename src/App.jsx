import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Leaderboard from './pages/Leaderboard'
import Admin from './pages/Admin'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentFailure from './pages/PaymentFailure'
import PaymentPending from './pages/PaymentPending'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Knockout from './pages/Knockout'        
import KnockoutAdmin from './pages/KnockoutAdmin' 

const ROUTES_WITHOUT_NAVBAR = ['/', '/login', '/register', '/forgot-password', '/reset-password']

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'var(--bg-primary, #0f172a)'
    }}>
      <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '1rem' }}>
        Cargando...
      </p>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, profile, loading, profileLoading, signingOut, isActive, isPending, isBlocked, isAdmin, isSuperAdmin } = useAuth()
  const location = useLocation()

  if (loading || signingOut || profileLoading) return <LoadingScreen />  // ← agregar profileLoading
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <LoadingScreen />
  
  if (isAdmin || isSuperAdmin) return children

  if (isPending) {
    if (location.pathname === '/payment/pending') return children
    return <Navigate to="/payment/pending" replace />
  }

  if (isBlocked) return <Navigate to="/login" replace />
  if (!isActive) return <Navigate to="/login" replace />

  return children
}

function AdminRoute({ children }) {
  const { user, loading, profileLoading, isAdmin, signingOut } = useAuth()  // ← agregar profileLoading
  if (loading || signingOut || profileLoading) return <LoadingScreen />      // ← agregar profileLoading
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, profile, loading, profileLoading, signingOut } = useAuth()  // ← agregar profileLoading
  if (loading || signingOut || profileLoading) return <LoadingScreen />      // ← agregar profileLoading
  if (user && !profile) return <LoadingScreen />
  
  if (user && profile && profile.status === 'pending') return children
  
  return user ? <Navigate to="/dashboard" replace /> : children
}

function AppContent() {
  const { signingOut } = useAuth()
  const location = useLocation()

 // if (signingOut) return <LoadingScreen />

  const showNavbar = !ROUTES_WITHOUT_NAVBAR.includes(location.pathname)

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />

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
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />

        <Route path="/reset-password" element={<ResetPassword />} />

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

        <Route
          path="/knockout"
          element={
            <PrivateRoute>
              <Knockout />
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

        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
