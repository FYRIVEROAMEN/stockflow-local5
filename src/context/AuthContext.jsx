import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase, onAuthStateChange, getProfile, setLocalId } from '../services/authService'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const userRef = useRef(null)

  const cargarProfile = async (userId) => {
    try {
      const data = await getProfile(userId)
      setProfile(data)
      setLocalId(data?.local_id ?? null)
    } catch (err) {
      console.error('Error cargando profile:', err)
      setProfile(null)
      setLocalId(null)
    }
  }

  useEffect(() => {
    let vivo = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      userRef.current = session?.user?.id ?? null
      if (session?.user) {
        await cargarProfile(session.user.id)
      } else {
        setProfile(null)
        setLocalId(null)
      }
      if (vivo) setLoading(false)
    })

    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      const nuevoId = session?.user?.id ?? null
      const cambioDeUsuario = nuevoId !== userRef.current
      userRef.current = nuevoId
      setSession(session)

      if (cambioDeUsuario) {
        setProfile(null)
        setLocalId(null)
      }

      if (session?.user) {
        cargarProfile(session.user.id)
      } else {
        setProfile(null)
        setLocalId(null)
      }
    })

    return () => {
      vivo = false
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = async () => {
    if (session?.user) await cargarProfile(session.user.id)
  }

  const loginConGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile, loginConGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}