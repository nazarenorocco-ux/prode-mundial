import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

// Doble seguridad: hardcodeado en el frontend Y verificado contra DB
const SUPERADMIN_EMAIL = 'nazarenorocco@gmail.com'

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null)
  const [isAdmin, setIsAdmin]         = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading]         = useState(true)
  const [signingOut, setSigningOut]   = useState(false)

  const isMounted       = useRef(true)
  const hasSettled      = useRef(false)
  const isSigningOutRef = useRef(false)

  const settle = () => {
    if (!hasSettled.current && isMounted.current) {
      hasSettled.current = true
      setLoading(false)
    }
  }

  const fetchProfile = useCallback(async (userId, userEmail) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin, is_superadmin')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (isMounted.current) {
        const adminFromDb      = data?.is_admin      ?? false
        const superAdminFromDb = data?.is_superadmin ?? false

        // Triple check: DB + email hardcodeado + ambos deben coincidir
        const superAdmin = superAdminFromDb && (userEmail === SUPERADMIN_EMAIL)

        setIsAdmin(adminFromDb || superAdmin) // superadmin siempre es admin
        setIsSuperAdmin(superAdmin)
      }
    } catch {
      if (isMounted.current) {
        setIsAdmin(false)
        setIsSuperAdmin(false)
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!isMounted.current) return

    isSigningOutRef.current = true
    setSigningOut(true)
    setUser(null)
    setIsAdmin(false)
    setIsSuperAdmin(false)

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
          await fetchProfile(session.user.id, session.user.email)
        } else {
          setUser(null)
          setIsAdmin(false)
          setIsSuperAdmin(false)
        }
      } catch {
        if (isMounted.current) {
          setUser(null)
          setIsAdmin(false)
          setIsSuperAdmin(false)
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

        if (event === 'SIGNED_OUT') {
          if (isSigningOutRef.current) return
          // SignOut externo (otra pestaña, token expirado)
          setUser(null)
          setIsAdmin(false)
          setIsSuperAdmin(false)
          return
        }

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id, session.user.email)
        } else {
          setUser(null)
          setIsAdmin(false)
          setIsSuperAdmin(false)
        }
      }
    )

    return () => {
      isMounted.current = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin,
      isSuperAdmin,
      loading,
      signingOut,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
