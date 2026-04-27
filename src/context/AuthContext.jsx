import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [isAdmin, setIsAdmin]     = useState(false)
  const [loading, setLoading]     = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  const isMounted  = useRef(true)
  const hasSettled = useRef(false)

  const settle = () => {
    if (!hasSettled.current && isMounted.current) {
      hasSettled.current = true
      setLoading(false)
      console.log('✅ Auth settled')
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
    console.log('🚪 signOut iniciado')
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      console.log('✅ supabase.auth.signOut() completado')
    } catch (e) {
      console.error('❌ Error en signOut:', e)
    } finally {
      if (isMounted.current) {
        setUser(null)
        setIsAdmin(false)
        setSigningOut(false)
        console.log('🔴 User seteado a null')
      }
    }
  }, [])

  useEffect(() => {
    isMounted.current  = true
    hasSettled.current = false

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔑 initAuth session:', session?.user?.email ?? 'sin sesión')

        if (!isMounted.current) return

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setIsAdmin(false)
        }
      } catch (e) {
        console.error('❌ initAuth error:', e)
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
        console.log('🔔 Auth event recibido:', event, 'hasSettled:', hasSettled.current, 'isMounted:', isMounted.current)

        if (!isMounted.current) return
        if (!hasSettled.current) return

        console.log('🔔 Auth event procesado:', event, session?.user?.email ?? 'sin sesión')

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          // El signOut manual ya maneja esto, evitar doble setState
          if (!signingOut) {
            setUser(null)
            setIsAdmin(false)
          }
        }
      }
    )

    return () => {
      isMounted.current = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])  // signingOut NO va en deps para no re-suscribir

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signingOut, signOut }}>
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
