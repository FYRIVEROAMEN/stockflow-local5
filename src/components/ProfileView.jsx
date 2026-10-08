import { useState, useEffect } from 'react'
import { User, Globe, KeyRound, Save, Edit2, ChevronDown, Ticket, Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { cambiarPassword, activarWeb, desactivarWeb, updateNombreProfile, updateNombreLocal, LOCAL_ID } from '../services/authService'
import { getLocalConfig } from '../services/api'
import TarjetaWeb from './TarjetaWeb'
import LogoLocalUploader from './LogoLocalUploader'
import styles from './ProfileView.module.css'

export default function ProfileView({ onNavigate, secInicial }) {
  const { session, profile, refreshProfile } = useAuth()
  const [webActiva, setWebActiva] = useState(profile?.locales?.web_activa || false)
  const [operando, setOperando] = useState(false)
  const [passNueva, setPassNueva] = useState('')
  const [passConfirmar, setPassConfirmar] = useState('')
  const [msgPass, setMsgPass] = useState(null)

  const [editandoIdentidad, setEditandoIdentidad] = useState(false)
  const [nombrePerfil, setNombrePerfil] = useState(profile?.nombre || '')
  const [nombreLocal, setNombreLocal] = useState(profile?.locales?.nombre || '')
  const [msgIdentidad, setMsgIdentidad] = useState(null)

  // logo del local (para el badge SIN LOGO)
  const [logoUrl, setLogoUrl] = useState(null)

  // 🪗 acordeón: arranca donde le digan (identidad si vienen del avatar/nudge)
  const [abierta, setAbierta] = useState(secInicial || 'perfil')
  const toggleSec = (k) => setAbierta(a => (a === k ? null : k))

  useEffect(() => {
    setNombrePerfil(profile?.nombre || '')
    setNombreLocal(profile?.locales?.nombre || '')
    setWebActiva(profile?.locales?.web_activa || false)
  }, [profile])

  useEffect(() => {
    if (LOCAL_ID) getLocalConfig(LOCAL_ID).then(c => setLogoUrl(c?.config?.logo_url || null)).catch(() => {})
  }, [])

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
      if (webActiva) { await desactivarWeb(); setWebActiva(false) }
      else { await activarWeb(); setWebActiva(true) }
    } catch (err) { alert(err.message) }
    setOperando(false)
  }

  const guardarIdentidad = async (e) => {
    e.preventDefault()
    setMsgIdentidad(null)
    setOperando(true)
    try {
      const userId = session?.user?.id
      const localId = profile?.local_id
      if (!userId || !localId) throw new Error('No se pudo identificar tu cuenta')
      await Promise.all([
        updateNombreProfile(userId, nombrePerfil),
        updateNombreLocal(localId, nombreLocal)
      ])
      await refreshProfile()
      setMsgIdentidad({ ok: true, texto: 'Identidad actualizada ✔' })
      setEditandoIdentidad(false)
    } catch (err) {
      setMsgIdentidad({ ok: false, texto: err.message })
    }
    setOperando(false)
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Mi cuenta</h1>

      {/* ============ SECCIÓN PERFIL ============ */}
      <section className={styles.card}>
        <button className={styles.accHeader} onClick={() => toggleSec('perfil')}>
          <span className={styles.cardTitle}><User className="text-blue-600" size={20} /> Tu perfil</span>
          <span className={styles.accRight}>
            <span className={styles.accSummary}>{profile?.nombre || '—'}</span>
            <ChevronDown size={18} className={`${styles.accChevron} ${abierta === 'perfil' ? styles.accChevronOpen : ''}`} />
          </span>
        </button>

        {abierta === 'perfil' && (
          <div className={styles.accBody}>
            {!editandoIdentidad ? (
              <>
                <div className={styles.profileGrid}>
                  <div><p className={styles.fieldLabel}>Nombre</p><p className={styles.fieldValue}>{profile?.nombre || '-'}</p></div>
                  <div><p className={styles.fieldLabel}>Email</p><p className={styles.fieldValue}>{session?.user?.email}</p></div>
                  <div><p className={styles.fieldLabel}>Rol</p><p className={`${styles.fieldValue} ${styles.fieldValueUpper}`}>{profile?.rol}</p></div>
                  <div><p className={styles.fieldLabel}>Local</p><p className={styles.fieldValue}>{profile?.locales?.nombre || '-'}</p></div>
                </div>
                <button onClick={() => setEditandoIdentidad(true)} className={`${styles.editBtn} mt-3`}>
                  <Edit2 size={14} /> Editar nombre o local
                </button>
              </>
            ) : (
              <form onSubmit={guardarIdentidad} className={styles.formGap}>
                <div>
                  <label className={styles.label}>Tu nombre</label>
                  <input type="text" value={nombrePerfil} onChange={e => setNombrePerfil(e.target.value)} placeholder="Ej: Facundo" className={styles.input} />
                </div>
                <div>
                  <label className={styles.label}>Nombre del local</label>
                  <input type="text" value={nombreLocal} onChange={e => setNombreLocal(e.target.value)} placeholder="Ej: Yamilstore" className={styles.input} />
                </div>
                {msgIdentidad && (
                  <p className={`${styles.msg} ${msgIdentidad.ok ? styles.msgOk : styles.msgErr}`}>{msgIdentidad.texto}</p>
                )}
                <div className={styles.formActions}>
                  <button type="button" disabled={operando} className={styles.btnGhost}
                    onClick={() => { setEditandoIdentidad(false); setNombrePerfil(profile?.nombre || ''); setNombreLocal(profile?.locales?.nombre || ''); setMsgIdentidad(null) }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={operando} className={styles.btnPrimary}>
                    <Save size={16} /> Guardar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </section>

      {/* ============ SECCIÓN IDENTIDAD DEL COMERCIO ============ */}
      <section className={styles.card}>
        <button className={styles.accHeader} onClick={() => toggleSec('identidad')}>
          <span className={styles.cardTitle}><Store className="text-blue-600" size={20} /> Identidad de tu comercio</span>
          <span className={styles.accRight}>
            {!logoUrl && <span className={`${styles.badge} ${styles.badgeOff}`}>SIN LOGO</span>}
            <ChevronDown size={18} className={`${styles.accChevron} ${abierta === 'identidad' ? styles.accChevronOpen : ''}`} />
          </span>
        </button>

        {abierta === 'identidad' && (
          <div className={styles.accBody}>
            <LogoLocalUploader onSaved={(url) => setLogoUrl(url)} />
            <p className={styles.webText}>
              Este logo se ve en el inicio de la app y en tu tienda online. Si no subís ninguno, se muestra la inicial de tu comercio.
            </p>
          </div>
        )}
      </section>

      {/* ============ SECCIÓN WEB ============ */}
      <section className={styles.card}>
        <button className={styles.accHeader} onClick={() => toggleSec('web')}>
          <span className={styles.cardTitle}><Globe className="text-blue-600" size={20} /> Tu página web</span>
          <span className={styles.accRight}>
            <span className={`${styles.badge} ${webActiva ? styles.badgeOn : styles.badgeOff}`}>
              {webActiva ? 'ACTIVA' : 'INACTIVA'}
            </span>
            <ChevronDown size={18} className={`${styles.accChevron} ${abierta === 'web' ? styles.accChevronOpen : ''}`} />
          </span>
        </button>

        {abierta === 'web' && (
          <div className={styles.accBody}>
            <p className={styles.webText}>
              {webActiva
                ? 'Tu vidriera está publicada y los clientes pueden verla.'
                : 'Activala cuando quieras publicar tu vidriera online.'}
            </p>
            <button onClick={toggleWeb} disabled={operando} className={`${styles.webBtn} ${webActiva ? styles.webBtnOn : styles.webBtnOff}`}>
              {operando ? 'Procesando...' : webActiva ? 'Desactivar web' : '🚀 Dar de alta mi web'}
            </button>
            <TarjetaWeb />
          </div>
        )}
      </section>

      {/* ============ SECCIÓN CONTRASEÑA ============ */}
      <section className={styles.card}>
        <button className={styles.accHeader} onClick={() => toggleSec('pass')}>
          <span className={styles.cardTitle}><KeyRound className="text-blue-600" size={20} /> Cambiar contraseña</span>
          <span className={styles.accRight}>
            <span className={styles.accSummary}>••••••••</span>
            <ChevronDown size={18} className={`${styles.accChevron} ${abierta === 'pass' ? styles.accChevronOpen : ''}`} />
          </span>
        </button>

        {abierta === 'pass' && (
          <div className={styles.accBody}>
            <form onSubmit={cambiarPass} className={styles.formGap}>
              <div>
                <label className={styles.label}>Nueva contraseña</label>
                <input type="password" value={passNueva} onChange={e => setPassNueva(e.target.value)} placeholder="Mínimo 6 caracteres" className={styles.input} />
              </div>
              <div>
                <label className={styles.label}>Repetir contraseña</label>
                <input type="password" value={passConfirmar} onChange={e => setPassConfirmar(e.target.value)} placeholder="Repetí la nueva contraseña" className={styles.input} />
              </div>
              {msgPass && (
                <p className={`${styles.msg} ${msgPass.ok ? styles.msgOk : styles.msgErr}`}>{msgPass.texto}</p>
              )}
              <button type="submit" disabled={operando} className={styles.btnPrimary}>
                Actualizar contraseña
              </button>
            </form>
          </div>
        )}
      </section>

      {/* ============ ACCESO: COMPROBANTE DE VENTA ============ */}
      <section
        onClick={() => onNavigate?.('configticket')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate?.('configticket') }}
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '2px dashed #94a3b8',
          borderRadius: '0.75rem',
          padding: '0.875rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          <div style={{
            width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem',
            background: '#dbeafe', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0
          }}>
            <Ticket size={20} color="#1d4ed8" />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.9375rem', margin: 0 }}>
              Comprobante de venta
            </p>
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '2px 0 0' }}>
              Editá las promos y el Instagram que salen al pie del ticket
            </p>
          </div>
        </div>
        <ChevronDown size={20} color="#94a3b8" style={{ transform: 'rotate(-90deg)' }} />
      </section>
    </div>
  )
}