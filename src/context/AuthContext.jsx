//AuthContext.jsx

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)
const SUPERADMIN_EMAIL = 'nazareno_rocco@hotmail.com'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  const isMounted = useRef(true)
  const hasSettled = useRef(false)
  const isSigningOutRef = useRef(false)

  const isRecoveryRoute = () => window.location.pathname === '/reset-password'

  const settle = useCallback(() => {
    if (!hasSettled.current && isMounted.current) {
      hasSettled.current = true
      setLoading(false)
    }
  }, [])

  const clearAuthState = useCallback(() => {
    setUser(null)
    setProfile(null)
    setIsAdmin(false)
    setIsSuperAdmin(false)
  }, [])

  const fetchProfile = useCallback(async (userId, userEmail) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (isMounted.current) {
        const adminFromDb = data?.is_admin ?? false
        const superAdminFromDb = data?.is_superadmin ?? false
        const superAdmin = superAdminFromDb && userEmail === SUPERADMIN_EMAIL

        setProfile(data)
        setIsAdmin(adminFromDb || superAdmin)
        setIsSuperAdmin(superAdmin)
      }
    } catch (e) {
      if (isMounted.current) {
        setProfile(null)
        setIsAdmin(false)
        setIsSuperAdmin(false)
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!isMounted.current) return

    isSigningOutRef.current = true
    setSigningOut(true)
    clearAuthState()

    try {
      localStorage.removeItem('recovery_in_progress')
      await supabase.auth.signOut({ scope: 'global' })
    } catch (e) {
      console.error('❌ Error en signOut:', e)
    } finally {
      if (isMounted.current) {
        isSigningOutRef.current = false
        setSigningOut(false)
      }
    }
  }, [clearAuthState])

  useEffect(() => {
    isMounted.current = true
    hasSettled.current = false

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!isMounted.current) return

        if (isRecoveryRoute() || localStorage.getItem('recovery_in_progress') === 'true') {
          clearAuthState()
          settle()
          return
        }

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id, session.user.email)
        } else {
          clearAuthState()
        }
      } catch (e) {
        if (isMounted.current) {
          clearAuthState()
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

        if (isRecoveryRoute()) return
        if (event === 'PASSWORD_RECOVERY') return
        if (localStorage.getItem('recovery_in_progress') === 'true') return

        if (event === 'SIGNED_OUT') {
          if (isSigningOutRef.current) return
          clearAuthState()
          return
        }

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id, session.user.email)
        } else {
          clearAuthState()
        }
      }
    )

    return () => {
      isMounted.current = false
      subscription.unsubscribe()
    }
  }, [clearAuthState, fetchProfile, settle])

  // Derivados del profile
  const isActive = profile?.status === 'activo'
  const isPending = profile?.status === 'pendiente'
  const isBlocked = profile?.status === 'bloqueado'

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        isSuperAdmin,
        isActive,
        isPending,
        isBlocked,
        loading,
        signingOut,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
