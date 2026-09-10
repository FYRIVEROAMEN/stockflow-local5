import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Login con email + password
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

// Logout
export const logout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Obtener sesión actual
export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Escuchar cambios de autenticación
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}

// Obtener perfil del usuario logueado
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, locales(nombre, web_activa)')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

// Activar web (solo owner)
export const activarWeb = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No hay sesión activa')
  
  const profile = await getProfile(session.user.id)
  if (profile.rol !== 'owner') throw new Error('Solo el owner puede activar la web')
  
  const { data, error } = await supabase
    .from('locales')
    .update({ web_activa: true })
    .eq('id', profile.local_id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Desactivar web (solo owner)
export const desactivarWeb = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No hay sesión activa')
  
  const profile = await getProfile(session.user.id)
  if (profile.rol !== 'owner') throw new Error('Solo el owner puede desactivar la web')
  
  const { data, error } = await supabase
    .from('locales')
    .update({ web_activa: false })
    .eq('id', profile.local_id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Cambiar contraseña
export const cambiarPassword = async (nuevaPassword) => {
  const { error } = await supabase.auth.updateUser({
    password: nuevaPassword
  })
  if (error) throw error
}