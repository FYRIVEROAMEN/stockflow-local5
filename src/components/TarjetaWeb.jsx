import { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink, Share2, Globe } from 'lucide-react'
import { supabase } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { urlMiTienda } from '../utils/tenantUrl'
import styles from './TarjetaWeb.module.css'

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
    <div className={styles.wrap}>
      <h3 className={styles.title}><Globe size={16} className="text-blue-600" /> Tu vidriera web</h3>
      <p className={styles.hostRow}>
        <b>{host}</b>{' '}
        <span className={webActiva ? styles.hostOn : styles.hostOff}>
          · {webActiva ? 'ACTIVA' : 'CERRADA'}
        </span>
      </p>
      <div className={styles.btnRow}>
        <a href={url} target="_blank" rel="noopener noreferrer" className={styles.btnSec}>
          <ExternalLink size={15} /> Ver
        </a>
        <button onClick={copiar} className={`${styles.btnSec} ${copiado ? styles.btnSecOk : ''}`}>
          {copiado ? <Check size={15} /> : <Copy size={15} />}
          {copiado ? '¡Copiado!' : 'Copiar'}
        </button>
      </div>
      <button onClick={compartirWhatsApp} className={styles.btnWa}>
        <Share2 size={16} /> Compartir por WhatsApp
      </button>
      <p className={styles.hint}>Mandale este link a tus clientes: entran directo a tu tienda.</p>
    </div>
  )
}