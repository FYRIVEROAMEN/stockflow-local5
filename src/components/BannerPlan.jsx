import { useEffect, useState } from 'react'
import { X, Gift, Crown, AlertTriangle, MessageCircle } from 'lucide-react'
import { getLocalConfig } from '../services/api'
import { LOCAL_ID } from '../services/authService'
import styles from './BannerPlan.module.css'

const DIAS_PRUEBA = 15
const WHATSAPP_PLATAFORMA = '5491158471339' // ← tu número (el de la plataforma)

function BannerPlan() {
  const [cfg, setCfg] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (LOCAL_ID) getLocalConfig(LOCAL_ID).then(setCfg).catch(() => {})
  }, [])

  if (!cfg) return null

  const creado = cfg.creado_en ? new Date(cfg.creado_en) : null
  const dias = creado ? Math.max(0, DIAS_PRUEBA - Math.floor((Date.now() - creado.getTime()) / 86400000)) : 0
  const esPago = cfg.plan === 'pago'
  const vencida = !esPago && dias === 0
  if (esPago) return null
  

  return (
    <>
      <div
        className={`${styles.banner} ${esPago ? styles.bannerOk : vencida ? styles.bannerRojo : styles.bannerTrial}`}
        onClick={() => setShowModal(true)}
        role="button"
      >
        {esPago ? <Crown size={18} /> : vencida ? <AlertTriangle size={18} /> : <Gift size={18} />}
        <div className={styles.textos}>
          <p className={styles.titulo}>
            {esPago ? 'Plan activo' : vencida ? 'Tu prueba gratis terminó' : `Prueba gratis: te quedan ${dias} día${dias === 1 ? '' : 's'}`}
          </p>
          <p className={styles.sub}>
            {esPago ? 'Gracias por confiar en StockShop ✔' : 'Tocá para ver los planes y no perder tu catálogo'}
          </p>
        </div>
        <span className={styles.flecha}>›</span>
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Planes de StockShop</h3>
              <button onClick={() => setShowModal(false)} className={styles.close}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.planCard}>
                <p className={styles.planNombre}>Prueba gratis</p>
                <p className={styles.planPrecio}>15 días</p>
                <p className={styles.planDesc}>Todo incluido: gestión + tienda online + importador</p>
              </div>
              <div className={`${styles.planCard} ${styles.planDestacado}`}>
                <p className={styles.planNombre}>Mensual</p>
                <p className={styles.planPrecio}>A definir</p>
                <p className={styles.planDesc}>Gestión completa + vidriera + pedidos web + tickets</p>
              </div>
              <div className={styles.planCard}>
                <p className={styles.planNombre}>Implementación</p>
                <p className={styles.planPrecio}>Pago único</p>
                <p className={styles.planDesc}>Te cargamos el catálogo inicial y dejamos todo andando</p>
              </div>
              <a
                className={styles.waBtn}
                href={`https://wa.me/${WHATSAPP_PLATAFORMA}?text=${encodeURIComponent('Hola! Quiero activar mi plan de StockShop')}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={16} /> Activar por WhatsApp
              </a>
              <p className={styles.nota}>Pagos con transferencia o MercadoPago (muy pronto desde acá mismo)</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BannerPlan