import Login from './components/Login'
import CrearCuenta from './components/CrearCuenta'  // 👈 NUEVO
import Dashboard from './components/Dashboard'
import CrearLocal from './components/CrearLocal'
import Landing from './components/Landing'
import Terminos from './pages/Terminos'
import Privacidad from './pages/Privacidad'
import { AuthProvider, useAuth } from './context/AuthContext'
import { logout as authLogout } from './services/authService'

function esRaizMarketing() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  const path = window.location.pathname
  const params = new URLSearchParams(window.location.search)

  if (params.get('marketing') === '1') return true

  const esApex = host === 'stockshop.com.ar' || host === 'www.stockshop.com.ar'
  const esRaiz = path === '/' || path === ''
  const sinSalir = !window.location.search.includes('salir=1')
  return esApex && esRaiz && sinSalir
}

function esRutaLegal() {
  if (typeof window === 'undefined') return null
  const path = window.location.pathname
  if (path === '/terminos')   return 'terminos'
  if (path === '/privacidad') return 'privacidad'
  return null
}

function AppInner() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await authLogout()
      window.location.href = '/?salir=1'
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    }
  }

  // Rutas públicas legales
  const rutaLegal = esRutaLegal()
  if (rutaLegal === 'terminos')   return <Terminos />
  if (rutaLegal === 'privacidad') return <Privacidad />

  // Sin sesión
  if (!session) {
    if (esRaizMarketing()) return <Landing />
    
    // 👇 DISTINGUIR /login de /crear-cuenta
    const path = window.location.pathname
    if (path === '/crear-cuenta') return <CrearCuenta />
    
    // Cualquier otra ruta (incluyendo /login) → Login
    return <Login />
  }

  // Con sesión
  if (!profile?.local_id) {
    return <CrearLocal />
  }

  if (profile.rol !== 'owner') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-sm">
          <p className="text-2xl mb-3">🔒</p>
          <p className="text-gray-700 font-semibold mb-1">Pantalla solo para dueños</p>
          <p className="text-gray-500 text-sm mb-5">
            Tu cuenta es de cliente. Para comprar, entrá a la tienda que te invitó.
          </p>
          <button onClick={handleLogout} className="bg-gray-800 text-white rounded-lg px-4 py-2 text-sm font-medium">
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  return <Dashboard onLogout={handleLogout} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}