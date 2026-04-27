import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [isAdmin, setIsAdmin]       = useState(false)
  const [loading, setLoading]       = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  const isMounted      = useRef(true)
  const hasSettled     = useRef(false)
  const isSigningOutRef = useRef(false)   // ref sincrónico para el listener

  const settle = () => {
    if (!hasSettled.current && isMounted.current) {
      hasSettled.current = true
      setLoading(false)
    }
  }

  const fetchProfile = useCallback(async (userId) => {
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
  }, [])

  const signOut = useCallback(async () => {
    if (!isMounted.current) return

    // Marcar ANTES del await — ref sincrónico + estado React
    isSigningOutRef.current = true
    setSigningOut(true)
    setUser(null)
    setIsAdmin(false)

    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('❌ Error en signOut:', e)
    } finally {
      if (isMounted.current) {
        isSigningOutRef.current = false
        setSigningOut(false)
      }
    }
  }, [])

  useEffect(() => {
    isMounted.current  = true
    hasSettled.current = false

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!isMounted.current) return

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setIsAdmin(false)
        }
      } catch {
        if (isMounted.current) {
          setUser(null)
          setIsAdmin(false)
        }
      } finally {
        settle()
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return
        if (!hasSettled.current) return

        // Si estamos en proceso de signOut, ignorar el evento SIGNED_OUT
        if (event === 'SIGNED_OUT') {
          if (isSigningOutRef.current) return  // ya lo manejamos en signOut()
          // SignOut externo (otra pestaña, token expirado, etc.)
          setUser(null)
          setIsAdmin(false)
          return
        }

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
  }, [fetchProfile])

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signingOut, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
