import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path ? 'active' : ''

  const displayName =
    user?.user_metadata?.username ||
    user?.email ||
    ''

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        ⚽ Prode Mundial 2026
      </Link>

      <div className="navbar-actions">
        {user ? (
          <>
            <Link
              to="/dashboard"
              className={`navbar-link ${isActive('/dashboard')}`}
            >
              Predicciones
            </Link>
            <Link
              to="/leaderboard"
              className={`navbar-link ${isActive('/leaderboard')}`}
            >
              Tabla
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className={`navbar-link ${isActive('/admin')}`}
              >
                Admin
              </Link>
            )}
            <span className="navbar-user" title={user.email}>
              {displayName}
            </span>
            <button className="btn btn-secondary" onClick={handleSignOut}>
              Salir
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className={`navbar-link ${isActive('/login')}`}
            >
              Ingresar
            </Link>
            <Link to="/register" className="btn btn-primary">
              Registrarse
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
