import { useEffect, useState, useRef } from 'react'
import { Bell, X, Megaphone, Sparkles, AlertTriangle, Info } from 'lucide-react'
import { supabase, LOCAL_ID } from '../services/authService'
import styles from './NotifBell.module.css'

const ICONOS = { novedad: Sparkles, aviso: Megaphone, urgente: AlertTriangle, info: Info }

const haceCuanto = (fecha) => {
  const mins = Math.floor((Date.now() - new Date(fecha)) / 60000)
  if (mins < 1) return 'recién'
  if (mins < 60) return `hace ${mins} min`
  const hs = Math.floor(mins / 60)
  if (hs < 24) return `hace ${hs} h`
  const dias = Math.floor(hs / 24)
  return dias === 1 ? 'hace 1 día' : `hace ${dias} días`
}

function NotifBell() {
  const [notis, setNotis] = useState([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  const cargar = async () => {
    if (!LOCAL_ID) return
    const { data: todas } = await supabase
      .from('notificaciones').select('*')
      .eq('activa', true)
      .order('creado_en', { ascending: false }).limit(20)
    const { data: leidas } = await supabase
      .from('notificaciones_leidas').select('notificacion_id')
      .eq('local_id', LOCAL_ID)
    const setLeidas = new Set((leidas || []).map(l => l.notificacion_id))
    setNotis(todas || [])
    setNoLeidas((todas || []).filter(n => !setLeidas.has(n.id)).length)
  }

  useEffect(() => { cargar() }, [])

  // cierra al tocar afuera
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const abrir = async () => {
    const siguiente = !abierto
    setAbierto(siguiente)
    if (siguiente && noLeidas > 0) {
      const filas = notis.map(n => ({ local_id: LOCAL_ID, notificacion_id: n.id }))
      await supabase.from('notificaciones_leidas').upsert(filas, { onConflict: 'local_id,notificacion_id' })
      setNoLeidas(0)
    }
  }

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.bell} onClick={abrir} aria-label="Notificaciones">
        <Bell size={20} />
        {noLeidas > 0 && <span className={styles.badge}>{noLeidas > 9 ? '9+' : noLeidas}</span>}
      </button>

      {abierto && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.panelTitle}>Novedades de StockShop</p>
            <button onClick={() => setAbierto(false)} className={styles.close}><X size={16} /></button>
          </div>
          <div className={styles.lista}>
            {notis.length === 0 && <p className={styles.vacio}>Sin novedades por ahora ✔</p>}
            {notis.map(n => {
              const Icono = ICONOS[n.tipo] || Info
              return (
                <div key={n.id} className={styles.item}>
                  <div className={`${styles.itemIcono} ${styles[n.tipo] || styles.info}`}><Icono size={16} /></div>
                  <div>
                    <p className={styles.itemTitulo}>{n.titulo}</p>
                    {n.cuerpo && <p className={styles.itemCuerpo}>{n.cuerpo}</p>}
                    <p className={styles.itemFecha}>{haceCuanto(n.creado_en)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotifBell