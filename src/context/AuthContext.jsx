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
      // silencioso
    } finally {
      if (isMounted.current) {
        setUser(null)
        setIsAdmin(false)
      }
    }
  }

  useEffect(() => {
    isMounted.current = true
    let settled = false

    const settle = () => {
      if (!settled && isMounted.current) {
        settled = true
        setLoading(false)
      }
    }

    // ── Safety net: si en 3s no resolvió, desbloqueamos igual ──
    const timeout = setTimeout(() => {
      console.warn('⚠️ Auth timeout — forzando loading=false')
      settle()
    }, 3000)

    const initAuth = async () => {
      try {
        console.log('🔄 initAuth start')
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('✅ getSession result:', { session, error })

        if (!isMounted.current) return

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
      } catch (err) {
        console.error('❌ initAuth error:', err)
      } finally {
        clearTimeout(timeout)
        settle()
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 onAuthStateChange:', event, session?.user?.email)
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
      clearTimeout(timeout)
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
