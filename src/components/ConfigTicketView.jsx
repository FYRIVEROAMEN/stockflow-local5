import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { ArrowLeft, Save, Ticket } from 'lucide-react'
import { supabase, LOCAL_ID } from '../services/authService'
import styles from './ConfigTicket.module.css'

function ConfigTicketView({ onBack }) {
  const [instagram, setInstagram] = useState('')
  const [ticketFooter, setTicketFooter] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from('locales')
        .select('instagram, ticket_footer, config')
        .eq('id', LOCAL_ID)
        .single()
      if (data) {
        setInstagram(data.instagram || data.config?.instagram || '')
        setTicketFooter(data.ticket_footer || data.config?.ticket_footer || '')
      }
      setLoading(false)
    }
    cargar()
  }, [])

  const guardar = async () => {
    setSaving(true)
    try {
      const ig = instagram.trim().replace(/^@/, '') || null
      const footer = ticketFooter.trim() || null
      // leo el config actual y mergeo (no piso lo de la web)
      const { data: loc } = await supabase.from('locales').select('config').eq('id', LOCAL_ID).single()
      const config = { ...(loc?.config || {}), instagram: ig, ticket_footer: footer }
      const { error } = await supabase
        .from('locales')
        .update({ instagram: ig, ticket_footer: footer, config })
        .eq('id', LOCAL_ID)
      if (error) throw error
      Swal.fire({ title: '¡Guardado!', text: 'El ticket y el WhatsApp ya usan tus textos nuevos.', icon: 'success', timer: 1600, showConfirmButton: false })
    } catch (err) {
      Swal.fire('Error al guardar', err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <button onClick={onBack} className={styles.backBtn} aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h2 className={styles.title}>Tu comprobante</h2>
      </div>
      <p className={styles.subtitle}>
        Estos textos salen al pie del ticket impreso y del mensaje de WhatsApp. Editalos cuando quieras: promos, sorteos, tu redes.
      </p>

      <div className={styles.card}>
        <label className={styles.label}>Instagram (sin @)</label>
        <div className={styles.igRow}>
          <span className={styles.igAt}>@</span>
          <input
            className={styles.igInput}
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="tu.negocio"
          />
        </div>
        <p className={styles.hint}>Si lo dejás vacío, no aparece en el ticket.</p>

        <label className={styles.label}>Mensaje de cierre / promos</label>
        <textarea
          className={styles.textarea}
          rows={4}
          value={ticketFooter}
          onChange={(e) => setTicketFooter(e.target.value)}
          placeholder={'Ej:\n¡SORTEO DE FIN DE MES!\nAl agendarnos, participás automáticamente.'}
        />
        <p className={styles.hint}>Si lo dejás vacío, el ticket dice solo "¡Gracias por tu compra!".</p>

        {/* preview en vivo, chiquito como sale impreso */}
        <div className={styles.previewBox}>
          <p className={styles.previewTitle}><Ticket size={12} /> Así sale al pie del ticket:</p>
          <div className={styles.previewTicket}>
            <span>{ticketFooter.trim() || '¡Gracias por tu compra!'}</span>
            {instagram.trim() && <span>@{instagram.trim().replace(/^@/, '')}</span>}
          </div>
        </div>

        <button onClick={guardar} disabled={saving || loading} className={styles.saveBtn}>
          <Save size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

export default ConfigTicketView 