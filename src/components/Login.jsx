import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { login } from '../services/authService'
import { useAuth } from '../context/AuthContext'

function Login() {
  // 🧠 LA LÓGICA INTACTA, NI LA MIRAMOS
  const { loginConGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      // El AuthContext detecta la sesión y App re-renderiza al Dashboard
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    try {
      await loginConGoogle()
      // Google redirige a accounts.google.com y vuelve al redirect configurado
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* 🇦🇷 LADO IZQUIERDO: La mística (Se oculta en celulares para no estorbar) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#3882F6] to-[#08285B] flex-col justify-between p-12 overflow-hidden">
        
        {/* Emojis flotantes semi-transparentes de fondo (estilo marca de agua) */}
        <div className="absolute top-10 right-10 text-8xl opacity-10 rotate-12 select-none">☀️</div>
        <div className="absolute bottom-32 left-10 text-8xl opacity-10 -rotate-12 select-none">🧉</div>
        <div className="absolute top-1/2 right-20 text-7xl opacity-10 rotate-12 select-none">🃏</div>
        <div className="absolute bottom-10 right-32 text-8xl opacity-10 -rotate-12 select-none">🏆</div>
        
        {/* Contenido Superior */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            {/* Si tenés tu logo, cambialo acá. Puse el genérico por las dudas */}
            <img src="/MateLogo.png" alt="Logo StockShop" className="w-10 h-10 object-contain" onError={(e) => e.target.style.display = 'none'} />
            <span className="text-3xl font-black text-white tracking-tight">StockShop</span>
          </div>
          
          <h1 className="text-4xl font-black text-white leading-[1.1] mb-6">
            Bienvenido de<br/>nuevo, campeón.
          </h1>
          <p className="text-blue-100 text-base mb-10 max-w-sm">
            Ingresá para gestionar tu stock, ventas y tu tienda online con la nuestra.
          </p>

          <ul className="space-y-4">
            {[
              'Stock, ventas y clientes en un solo lugar',
              'Tu tienda online con el mismo catálogo',
              'Reportes claros de tu comercio'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-blue-50 text-sm font-medium">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Contenido Inferior (Testimonio como en Tiendix) */}
        <div className="relative z-10">
          <p className="text-blue-200 text-sm italic">
            "Por fin dejé el cuaderno y el Excel..."
          </p>
          <p className="text-white font-bold mt-1 text-sm">— Comercios como el tuyo.</p>
        </div>
      </div>

      {/* 🧑‍💻 LADO DERECHO: El Formulario (Toda la lógica tuya sigue acá adentro) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        
        {/* Botón Volver al inicio */}
        <a 
  href={window.location.hostname.includes('stockshop.com.ar') ? '/' : '/?marketing=1'} 
  className="absolute top-6 left-6 sm:top-10 sm:left-10 text-sm text-slate-500 hover:text-[#08285B] flex items-center gap-2 font-semibold transition-colors"
>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Volver al inicio
        </a>

        <div className="w-full max-w-[380px] mt-10 lg:mt-0">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-black text-[#08285B] mb-1">Ingresar</h2>
            <p className="text-sm text-slate-500 font-medium">Panel de gestión</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3882F6] focus:bg-white transition-all text-sm font-medium"
                placeholder="tu@email.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3882F6] focus:bg-white transition-all text-sm font-medium"
                placeholder="Tu contraseña"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 font-bold">
                <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3882F6] text-white py-3.5 rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-[0_8px_20px_rgba(56,130,246,.25)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 text-center lg:text-left">
            <a href="#" className="text-xs font-bold text-[#3882F6] hover:text-blue-800 transition-colors">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white text-slate-400 font-bold uppercase tracking-widest">O</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="w-full bg-white border-2 border-slate-100 text-slate-700 py-3.5 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-all font-bold flex items-center justify-center gap-3 text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Ingresar con Google
          </button>
        </div>
      </div>
      
    </div>
  )
}

export default Login