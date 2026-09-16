import { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink, Share2 } from 'lucide-react'
import { supabase } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { urlMiTienda } from '../utils/tenantUrl'

export default function TarjetaWeb() {
  const { profile } = useAuth()
  const [dominio, setDominio] = useState(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!profile?.local_id) return
    supabase
      .from('dominios')
      .select('subdominio, dominio_propio')
      .eq('local_id', profile.local_id)
      .maybeSingle()
      .then(({ data }) => setDominio(data || null))
      .catch(() => {})
  }, [profile?.local_id])

  if (!dominio) return null

  const host = dominio.dominio_propio || dominio.subdominio
  const url = urlMiTienda(host)
  const webActiva = profile?.locales?.web_activa

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      window.prompt('Copiá tu link:', url)
    }
  }

  const compartirWhatsApp = () => {
    const texto = encodeURIComponent(`Mirá mi tienda online: ${url}`)
    window.open(`https://wa.me/?text=${texto}`, '_blank')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
      <h3 className="font-semibold text-gray-700 mb-1">🌐 Tu vidriera web</h3>
      <p className="text-sm text-gray-600 mb-3">
        Dirección: <b>{host}</b>{' '}
        <span className={`text-xs font-semibold ${webActiva ? 'text-green-600' : 'text-amber-600'}`}>
          · {webActiva ? 'ACTIVA' : 'CERRADA'}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-2 flex items-center gap-2"
        >
          <ExternalLink size={15} /> Ver mi vidriera
        </a>
        <button
          onClick={copiar}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-2 flex items-center gap-2"
        >
          {copiado ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
          {copiado ? '¡Copiado!' : 'Copiar link'}
        </button>
        <button
          onClick={compartirWhatsApp}
          className="text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2 flex items-center gap-2"
        >
          <Share2 size={15} /> Compartir por WhatsApp
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Mandale este link a tus clientes: entran directo a tu tienda.
      </p>
    </div>
  )
}