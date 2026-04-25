import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        ⚽ Prode Mundial 2026
      </Link>
      <div className="navbar-actions">
        {user ? (
          <>
            <Link
              to="/"
              className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Predicciones
            </Link>
            <Link
              to="/leaderboard"
              className={`navbar-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}
            >
              Tabla
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`}
              >
                Admin
              </Link>
            )}
            <span className="navbar-user">{user.email}</span>
            <button className="btn btn-secondary" onClick={handleSignOut}>
              Salir
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-link">Ingresar</Link>
            <Link to="/register" className="navbar-link">Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  )
}
