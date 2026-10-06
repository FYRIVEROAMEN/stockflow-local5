import { useEffect, useState } from 'react'
import { getLocalConfig } from '../services/api'
import { LOCAL_ID } from '../services/authService'
import styles from './LocalAvatar.module.css'

function LocalAvatar({ size = 44, onClick }) {
  const [cfg, setCfg] = useState(null)
  useEffect(() => {
    if (LOCAL_ID) getLocalConfig(LOCAL_ID).then(setCfg).catch(() => {})
  }, [])
  const logo = cfg?.config?.logo_url
  const inicial = (cfg?.nombre || 'Mi local').charAt(0).toUpperCase()
  return (
    <button
      className={styles.avatar}
      style={{ width: size, height: size }}
      onClick={onClick}
      title="Configurar mi local"
      aria-label="Configurar mi local"
    >
      {logo ? <img src={logo} alt={cfg?.nombre} className={styles.img} /> : <span className={styles.inicial}>{inicial}</span>}
    </button>
  )
}

export default LocalAvatar  