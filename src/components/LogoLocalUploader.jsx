import { useState, useRef } from 'react'
import { Upload, Camera } from 'lucide-react'
import Swal from 'sweetalert2'
import { supabase, LOCAL_ID } from '../services/authService'
import styles from './LogoLocalUploader.module.css'

function LogoLocalUploader({ onSaved }) {
  const [subiendo, setSubiendo] = useState(false)
  const [logo, setLogo] = useState(null)
  const inputRef = useRef(null)

  // carga el logo actual al montar
  useState(() => {
    supabase.from('locales').select('config').eq('id', LOCAL_ID).single()
      .then(({ data }) => setLogo(data?.config?.logo_url || null))
    return null
  })

  const subir = async (file) => {
    if (!file) return
    setSubiendo(true)
    try {
      // 1 · sube a Cloudinary (mismo preset que usa la web)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!data.secure_url) throw new Error('No se pudo subir la imagen a Cloudinary')

      // 2 · merge en config.logo_url (no pisa el resto del config)
      const { data: loc, error: e1 } = await supabase.from('locales').select('config').eq('id', LOCAL_ID).single()
      if (e1) throw e1
      const config = { ...(loc?.config || {}), logo_url: data.secure_url }
      const { error: e2 } = await supabase.from('locales').update({ config }).eq('id', LOCAL_ID)
      if (e2) throw e2

      setLogo(data.secure_url)
      Swal.fire({ title: '¡Logo actualizado!', text: 'Ya se ve en la gestión Y en tu tienda online.', icon: 'success', timer: 1800, showConfirmButton: false })
      onSaved?.(data.secure_url)
    } catch (err) {
      Swal.fire('Error al subir el logo', err.message, 'error')
    } finally {
      setSubiendo(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

   return (
    <>
      {!logo ? (
        <button className={styles.ctaBig} onClick={() => inputRef.current?.click()} disabled={subiendo}>
          <Camera size={28} />
          <span className={styles.ctaBigTitle}>{subiendo ? 'Subiendo...' : 'Subí el logo de tu comercio'}</span>
          <span className={styles.ctaBigHint}>Se ve en la app y en tu tienda online · PNG cuadrado ideal</span>
        </button>
      ) : (
        <div className={styles.row}>
          <div className={styles.preview}><img src={logo} alt="Logo del local" className={styles.img} /></div>
          <div className={styles.acciones}>
            <button onClick={() => inputRef.current?.click()} disabled={subiendo} className={styles.btn}>
              <Upload size={16} /> {subiendo ? 'Subiendo...' : 'Cambiar logo'}
            </button>
            <p className={styles.hint}>Recomendado: PNG cuadrado con fondo transparente.</p>
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={(e) => subir(e.target.files[0])} />
    </>
  )
}

export default LogoLocalUploader