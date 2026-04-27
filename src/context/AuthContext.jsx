import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

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

    // Opción B: getSession() como respaldo inmediato
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!isMounted.current) return

      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      }
      if (isMounted.current) setLoading(false)
    }

    initAuth()

    // onAuthStateChange maneja cambios posteriores (login, logout, etc.)
    // ignoramos INITIAL_SESSION porque ya lo manejó initAuth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return
        if (event === 'INITIAL_SESSION') return

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setIsAdmin(false)
        }
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
