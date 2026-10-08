import { Globe, Rocket } from 'lucide-react'
import styles from './NudgeWeb.module.css'

function NudgeWeb({ webActiva, onNavigate }) {
  if (webActiva) return null
  return (
    <div className={styles.card}>
      <div className={styles.badge}>DESACTIVADO</div>
      <div className={styles.header}>
        <Globe size={32} className={styles.icon} />
        <h3 className={styles.title}>Tu tienda online está desactivada</h3>
      </div>
      <p className={styles.desc}>
        Activá tu vidriera online para que tus clientes compren 24/7 sin WhatsApp.
        Incluido en tu plan, sin costo extra.
      </p>
      <button onClick={() => onNavigate?.('activarweb')} className={styles.cta}>
        <Rocket size={18} /> Activar mi tienda online
      </button>
    </div>
  )
}

export default NudgeWeb