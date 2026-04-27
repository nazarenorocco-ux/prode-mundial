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

// Rutas donde NO se muestra la Navbar
const ROUTES_WITHOUT_NAVBAR = ['/', '/login', '/register']

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
  const { user, loading, signingOut } = useAuth()
  if (loading || signingOut) return <LoadingScreen />
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin, signingOut } = useAuth()
  if (loading || signingOut) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading, signingOut } = useAuth()
  if (loading || signingOut) return <LoadingScreen />
  return user ? <Navigate to="/dashboard" replace /> : children
}

function AppContent() {
  const { signingOut } = useAuth()
  const location = useLocation()

  if (signingOut) return <LoadingScreen />

  const showNavbar = !ROUTES_WITHOUT_NAVBAR.includes(location.pathname)

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>

        <Route path="/" element={<Landing />} />

        <Route path="/login" element={
          <PublicRoute><Login /></PublicRoute>
        } />

        <Route path="/register" element={
          <PublicRoute><Register /></PublicRoute>
        } />

        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />

        <Route path="/leaderboard" element={
          <PrivateRoute><Leaderboard /></PrivateRoute>
        } />

        <Route path="/admin" element={
          <AdminRoute><Admin /></AdminRoute>
        } />

        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />
        <Route path="/payment/pending" element={<PaymentPending />} />

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
