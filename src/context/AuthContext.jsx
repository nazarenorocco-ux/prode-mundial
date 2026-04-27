import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const isMounted  = useRef(true)
  const hasSettled = useRef(false)

  const settle = () => {
    if (!hasSettled.current && isMounted.current) {
      hasSettled.current = true
      setLoading(false)
    }
  }

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
      // silencioso
    } finally {
      if (isMounted.current) {
        setUser(null)
        setIsAdmin(false)
      }
    }
  }

  useEffect(() => {
    isMounted.current  = true
    hasSettled.current = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth event:', event, session?.user?.email ?? 'sin sesión')
        if (!isMounted.current) return

        if (session?.user) {
          setUser(session.user)
          settle()
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setIsAdmin(false)
          settle()
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
