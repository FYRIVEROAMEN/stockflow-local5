import { useState } from 'react'
import { AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { login } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'

// ⚠️ Si tu logo se llama distinto, cambiá SOLO esta línea
const LOGO = 'public/MateLogoUtil.png'

function Login() {
  const { loginConGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    try {
      await loginConGoogle()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className={styles.page}>
      {/* ============ PANEL IZQUIERDO: FORM ============ */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.brand}>
            <img src={LOGO} alt="Logo StockShop" className={styles.logoImg} />
            <h1 className={styles.title}>StockShop</h1>
            <p className={styles.tagline}>El stock del local, en tu bolsillo 🇦</p>
          </div>

          <button type="button" onClick={handleGoogle} className={styles.googleBtn}>
            <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <div className={styles.divider}>o con email</div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${styles.input} ${error ? styles.inputWithError : ''}`}
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Contraseña</label>
              <div className={styles.inputWrap}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${styles.input} ${error ? styles.inputWithError : ''}`}
                  placeholder="Tu contraseña"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className={styles.eyeBtn}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className={styles.error} role="alert">
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className={styles.submit}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className={styles.footer}>
            ¿Problemas para entrar? <a href="mailto:soporte@stockshop.ar" className={styles.footerLink}>Escribinos</a>
          </p>
        </div>
      </div>

      {/* ============ PANEL DERECHO: HERO DE MARCA ============ */}
      <div className={styles.heroPanel}>
        <img src={LOGO} alt="" className={styles.heroLogo} aria-hidden="true" />
        <div className={styles.heroContent}>
          <p className={styles.heroQuote}>
            El que sabe de números, sabe del negocio. El que sabe de su stock, sabe de su gente.
          </p>
          <p className={styles.heroAuthor}>— dicho de almacenero, versión digital</p>
        </div>
      </div>
    </div>
  )
}

export default Login