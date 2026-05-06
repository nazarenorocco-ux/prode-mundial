import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)
const SUPERADMIN_EMAIL = 'nazarenorocco@gmail.com'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)

  const isMounted = useRef(true)
  const hasSettled = useRef(false)
  const isSigningOutRef = useRef(false)
  const initialEventProcessed = useRef(false)
  const pendingEvent = useRef(null)

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
    setProfileLoading(false)
  }, [])

  const fetchProfile = useCallback(async (userId) => {
    setProfileLoading(true)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (isMounted.current) {
        setProfile(data)
      }
    } catch (e) {
      if (isMounted.current) {
        setProfile(null)
      }
    } finally {
      if (isMounted.current) {
        setProfileLoading(false)
      }
    }
  }, [])

 const signOut = useCallback(async (onComplete) => {
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
      setSigningOut(false)
      onComplete?.()
      // Resetear DESPUÉS para que SIGNED_OUT event sea ignorado
      setTimeout(() => {
        isSigningOutRef.current = false
      }, 500)
    }
  }
}, [clearAuthState])


  useEffect(() => {
    isMounted.current = true
    hasSettled.current = false
    initialEventProcessed.current = false
    pendingEvent.current = null

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
          await fetchProfile(session.user.id)
        } else {
          clearAuthState()
        }
      } catch (e) {
        if (isMounted.current) clearAuthState()
      } finally {
        settle()
        initialEventProcessed.current = true

        if (pendingEvent.current && isMounted.current) {
          const { session } = pendingEvent.current
          pendingEvent.current = null

          if (session?.user) {
            setUser(session.user)
            fetchProfile(session.user.id)
          }
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return
        if (isRecoveryRoute()) return
        if (event === 'PASSWORD_RECOVERY') return
        if (localStorage.getItem('recovery_in_progress') === 'true') return

        if (!initialEventProcessed.current) {
          if (event === 'SIGNED_IN') {
            pendingEvent.current = { event, session }
          }
          return
        }

        if (event === 'SIGNED_OUT') {
          if (isSigningOutRef.current) return
          clearAuthState()
          return
        }

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
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

  const isAdmin = profile?.is_admin === true || profile?.role === 'admin'
  const isSuperAdmin = profile?.is_superadmin === true || user?.email === SUPERADMIN_EMAIL
  const isActive = profile?.status === 'active'
  const isPending = profile?.status === 'pending'
  const isBlocked = profile?.status === 'blocked'

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
        profileLoading,
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
