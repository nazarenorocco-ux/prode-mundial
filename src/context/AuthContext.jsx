import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const isMounted     = useRef(true)
  const hasSettled    = useRef(false)
  const initFinished  = useRef(false)  // ← nuevo: saber si initAuth terminó

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
    isMounted.current    = true
    hasSettled.current   = false
    initFinished.current = false

    // 1. Leer sesión existente al inicio (para reloads y nuevas pestañas)
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
        initFinished.current = true  // ← initAuth terminó
        settle()
      }
    }

    initAuth()

    // 2. Escuchar cambios futuros (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return

        // Si initAuth no terminó, esperarlo
        if (!initFinished.current) {
          const wait = () => new Promise(resolve => {
            const check = setInterval(() => {
              if (initFinished.current) {
                clearInterval(check)
                resolve()
              }
            }, 50)
          })
          await wait()
        }

        if (!isMounted.current) return

        console.log('🔔 Auth event:', event, session?.user?.email ?? 'sin sesión')

        // Solo procesar eventos relevantes, no el inicial que ya manejó initAuth
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUser(session.user)
            await fetchProfile(session.user.id)
            settle() // por si llegó antes que initAuth
          }
        } else if (event === 'SIGNED_OUT') {
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
