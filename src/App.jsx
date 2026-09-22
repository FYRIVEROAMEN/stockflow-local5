import Login from './components/Login'
import Dashboard from './components/Dashboard'
import CrearLocal from './components/CrearLocal'
import Landing from './components/Landing'
import { AuthProvider, useAuth } from './context/AuthContext'
import { logout as authLogout } from './services/authService'

// 🌐 Portal TiDix: ¿mostrar la landing de marketing?
function esRaizMarketing() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  const path = window.location.pathname
  const params = new URLSearchParams(window.location.search)

  // 🧪 OVERRIDE DE DEV: ?marketing=1 fuerza la landing
  if (params.get('marketing') === '1') return true

  const esApex = host === 'stockshop.com.ar' || host === 'www.stockshop.com.ar'
  const esRaiz = path === '/' || path === ''
  const sinSalir = !window.location.search.includes('salir=1')
  return esApex && esRaiz && sinSalir
}

// Componente interno: YA está dentro del AuthProvider
function AppInner() {
  const { session, profile, loading } = useAuth()
  const path = window.location.pathname

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
      // Al salir marcamos que venimos de logout para no mostrar landing
      window.location.href = '/?salir=1'
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    }
  }

  // ─────────────────────────────────────────────
  // 🔓 SIN SESIÓN: decidimos por host + path
  // ─────────────────────────────────────────────
  if (!session) {
    // 🎨 Landing de marketing (apex/www en la raíz)
    if (esRaizMarketing()) {
      return <Landing />
    }
    // 🔑 Todo lo demás: /login, /crear-cuenta, cualquier ruta
    //    (en /crear-cuenta el usuario se registra y al tener
    //     sesión nueva SIN local_id, el bloque G2 de abajo
    //     lo mete directo al onboarding CrearLocal ✔)
    return <Login />
  }

  // ─────────────────────────────────────────────
  // 🔐 CON SESIÓN
  // ─────────────────────────────────────────────

  // 🏢 G2: sesión SIN local (profile inexistente o sin local_id)
  // → onboarding de creación: la fábrica estrena dueño
  // → acá aterrizan los registros nuevos que entraron por /crear-cuenta
  if (!profile?.local_id) {
    return <CrearLocal />
  }

  // 🔒 Sesión CON local pero sin sombrero de dueño
  // (ej: un customer de alguna tienda que abrió la gestión)
  if (profile.rol !== 'owner') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-sm">
          <p className="text-2xl mb-3">🔒</p>
          <p className="text-gray-700 font-semibold mb-1">Pantalla solo para dueños</p>
          <p className="text-gray-500 text-sm mb-5">
            Tu cuenta es de cliente. Para comprar, entrá a la tienda que te invitó.
          </p>
          <button
            onClick={handleLogout}
            className="bg-gray-800 text-white rounded-lg px-4 py-2 text-sm font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  // 🏭 Dueño con local: la fábrica
  return <Dashboard onLogout={handleLogout} />
}

// Export: envuelve todo con el provider (no hay que tocar main.jsx)
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}