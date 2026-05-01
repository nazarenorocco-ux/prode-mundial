import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, isAdmin, signOut, signingOut } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleSignOut = async () => {
    navigate('/', { replace: true })
    await signOut()
    window.location.reload()
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
            <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard')}`}>
              Predicciones
            </Link>
            <Link to="/leaderboard" className={`navbar-link ${isActive('/leaderboard')}`}>
              Tabla
            </Link>
            <Link to="/knockout" className={`navbar-link ${isActive('/knockout')}`}>
              Eliminatorias
            </Link>
            {isAdmin && (
               <>
            <Link to="/admin" className={`navbar-link ${isActive('/admin')}`}>
                Admin
            </Link>
            <Link to="/admin/knockout" className={`navbar-link ${isActive('/admin/knockout')}`}>
                  Admin KO
                </Link>
            </>
            )}
            <span className="navbar-user" title={user.email}>
              {displayName}
            </span>
            <button
              className="btn btn-secondary"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? 'Saliendo...' : 'Salir'}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={`navbar-link ${isActive('/login')}`}>
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
