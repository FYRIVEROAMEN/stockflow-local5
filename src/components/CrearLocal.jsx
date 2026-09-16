import { useState } from 'react'
import { supabase } from '../services/authService'
import { useAuth } from '../context/AuthContext'

export default function CrearLocal() {
  const { refreshProfile } = useAuth()
  const [nombre, setNombre] = useState('')
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState(null)

  const crear = async () => {
    if (!nombre.trim()) return setError('Poné un nombre para tu tienda')
    setError(null)
    setCreando(true)
    try {
      const { error: err } = await supabase.rpc('crear_tienda', { p_nombre: nombre.trim() })
      if (err) throw err
      await refreshProfile()
    } catch (err) {
      setError(err.message)
      setCreando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2"> Bienvenido a StockShop</h1>
        <p className="text-gray-500 text-sm mb-6">
          Creá tu local para empezar a cargar productos, ventas y clientes.
        </p>
        <input
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Nombre de tu tienda (ej: Like Store)"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && crear()}
        />
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        <button
          onClick={crear}
          disabled={creando}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-3 disabled:opacity-60"
        >
          {creando ? 'Creando...' : 'Crear mi local'}
        </button>
      </div>
    </div>
  )
}