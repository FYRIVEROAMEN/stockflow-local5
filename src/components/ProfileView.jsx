import { useState } from 'react'
import { User, Globe, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { cambiarPassword, activarWeb, desactivarWeb } from '../services/authService'
import TarjetaWeb from './TarjetaWeb'

export default function ProfileView() {
  const { session, profile } = useAuth()
  const [webActiva, setWebActiva] = useState(profile?.locales?.web_activa || false)
  const [operando, setOperando] = useState(false)
  const [passNueva, setPassNueva] = useState('')
  const [passConfirmar, setPassConfirmar] = useState('')
  const [msgPass, setMsgPass] = useState(null)

  const cambiarPass = async (e) => {
    e.preventDefault()
    setMsgPass(null)
    if (passNueva.length < 6) return setMsgPass({ ok: false, texto: 'Mínimo 6 caracteres' })
    if (passNueva !== passConfirmar) return setMsgPass({ ok: false, texto: 'Las contraseñas no coinciden' })
    setOperando(true)
    try {
      await cambiarPassword(passNueva)
      setMsgPass({ ok: true, texto: 'Contraseña actualizada ✔' })
      setPassNueva('')
      setPassConfirmar('')
    } catch (err) {
      setMsgPass({ ok: false, texto: err.message })
    }
    setOperando(false)
  }

  const toggleWeb = async () => {
    setOperando(true)
    try {
      if (webActiva) {
        await desactivarWeb()
        setWebActiva(false)
      } else {
        await activarWeb()
        setWebActiva(true)
      }
    } catch (err) {
      alert(err.message)
    }
    setOperando(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Mi cuenta</h1>

      {/* PERFIL */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="text-blue-600" />
          <h2 className="font-semibold text-gray-700">Tu perfil</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Nombre</p><p className="font-medium">{profile?.nombre || '-'}</p></div>
          <div><p className="text-gray-500">Email</p><p className="font-medium">{session?.user?.email}</p></div>
          <div><p className="text-gray-500">Rol</p><p className="font-medium uppercase">{profile?.rol}</p></div>
          <div><p className="text-gray-500">Local</p><p className="font-medium">{profile?.locales?.nombre || '-'}</p></div>
        </div>
      </div>

      {/* WEB */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Globe className="text-blue-600" />
            <h2 className="font-semibold text-gray-700">Tu página web</h2>
          </div>
          {webActiva ? (
            <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">ACTIVA</span>
          ) : (
            <span className="text-xs font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full">INACTIVA</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {webActiva
            ? 'Tu vidriera está publicada y los clientes pueden verla.'
            : 'Activala cuando quieras publicar tu vidriera online.'}
        </p>
        <button
          onClick={toggleWeb}
          disabled={operando}
          className={`w-full p-3 rounded-lg font-medium text-white transition ${webActiva ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {operando ? 'Procesando...' : webActiva ? 'Desactivar web' : '🚀 Dar de alta mi web'}
        </button>
           <TarjetaWeb />
      </div>

      {/* CONTRASEÑA */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="text-blue-600" />
          <h2 className="font-semibold text-gray-700">Cambiar contraseña</h2>
        </div>
        <form onSubmit={cambiarPass} className="space-y-3">
          <input
            type="password"
            value={passNueva}
            onChange={e => setPassNueva(e.target.value)}
            placeholder="Nueva contraseña"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={passConfirmar}
            onChange={e => setPassConfirmar(e.target.value)}
            placeholder="Repetir nueva contraseña"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {msgPass && (
            <p className={`text-sm ${msgPass.ok ? 'text-green-700' : 'text-red-700'}`}>{msgPass.texto}</p>
          )}
          <button
            type="submit"
            disabled={operando}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Actualizar contraseña
          </button>
        </form>
      </div>
    </div>
  )
}