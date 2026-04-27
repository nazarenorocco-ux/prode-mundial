import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

function LoadingScreen() {
  return (
    <div className="main-container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh' 
    }}>
      <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

// PublicRoute: si ya está logueado lo manda al dashboard
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? <Navigate to="/dashboard" replace /> : children
}

function AppContent() {
  return (
    <>
      <Navbar />
      <Routes>

        <Route path="/" element={<Landing />} />

        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />

        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />

        <Route path="/leaderboard" element={
          <PrivateRoute>
            <Leaderboard />
          </PrivateRoute>
        } />

        <Route path="/admin" element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        } />

        {/* Callbacks MercadoPago — sin protección */}
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
