import Login from './components/Login'
import Dashboard from './components/Dashboard'
import { AuthProvider, useAuth } from './context/AuthContext'
import { logout as authLogout } from './services/authService'

// Componente interno: YA está dentro del AuthProvider
function AppInner() {
  const { session, loading } = useAuth()

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
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    }
  }

  if (!session) {
    return <Login />
  }

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