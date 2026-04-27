import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Ref para evitar actualizaciones de estado en componente desmontado
  const isMounted = useRef(true)

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single()

      if (error) throw error
      if (isMounted.current) setIsAdmin(data?.is_admin ?? false)
    } catch {
      // Perfil no encontrado o error de red — asumir no-admin
      if (isMounted.current) setIsAdmin(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // Si el signOut falla en Supabase, igual limpiamos el estado local
    } finally {
      if (isMounted.current) {
        setUser(null)
        setIsAdmin(false)
      }
    }
  }

  useEffect(() => {
    isMounted.current = true

    // onAuthStateChange recibe INITIAL_SESSION como primer evento,
    // que equivale al getSession() — lo usamos como única fuente de verdad
    // para evitar la race condition del flag initialized.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setIsAdmin(false)
        }

        // Loading false después del primer evento (INITIAL_SESSION)
        // que siempre dispara al montar, con o sin sesión activa
        if (isMounted.current) setLoading(false)
      }
    )

    return () => {
      isMounted.current = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
