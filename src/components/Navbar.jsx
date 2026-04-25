import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        ⚽ Prode Mundial 2026
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/">Predicciones</Link>
            <Link to="/leaderboard">Tabla</Link>
            {isAdmin && <Link to="/admin">Admin</Link>}
            <button onClick={handleSignOut}>Salir</button>
          </>
        ) : (
          <>
            <Link to="/login">Ingresar</Link>
            <Link to="/register">Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  )
}
