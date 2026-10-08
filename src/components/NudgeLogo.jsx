import { useEffect, useState } from 'react'
import { Camera } from 'lucide-react'
import { getLocalConfig } from '../services/api'
import { LOCAL_ID } from '../services/authService'
import styles from './NudgeLogo.module.css'

function NudgeLogo({ onNavigate }) {
  const [cfg, setCfg] = useState(null)
  useEffect(() => {
    if (LOCAL_ID) getLocalConfig(LOCAL_ID).then(setCfg).catch(() => {})
  }, [])
  if (!cfg) return null
  if (cfg.config?.logo_url) return null // tiene logo → silencio

  return (
    <div className={styles.nudge} onClick={() => onNavigate?.('identidad')} role="button">
      <div className={styles.icono}><Camera size={18} /></div>
      <div className={styles.textos}>
        <p className={styles.titulo}>Tu comercio aún no tiene logo</p>
        <p className={styles.sub}>Subilo una vez y aparece en la app y en tu tienda online</p>
      </div>
      <span className={styles.flecha}>›</span>
    </div>
  )
}

export default NudgeLogo