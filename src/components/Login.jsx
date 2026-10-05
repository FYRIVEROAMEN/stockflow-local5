import { useState } from 'react'
import { AlertTriangle, Eye, EyeOff, CheckCircle, Mail, Lock, ArrowRight } from 'lucide-react'
import { login } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import logoMate from '../assets/LogoStockShopUsable.png'
import styles from './Login.module.css'


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
      
      {/* ============ PANEL IZQUIERDO: SE OCULTA EN CELULARES ============ */}
      <div className={styles.heroPanel}>
        <div className={styles.heroTop}>
          <img src={logoMate} alt="StockShop Logo" className={styles.heroLogoSmall} />
          <span className={styles.heroBrandName}>STOCKSHOP</span>
        </div>

        <div className={styles.heroMain}>
          <h2 className={styles.heroTitle}>Bienvenido de nuevo</h2>
          <p className={styles.heroSubtitle}>
            Ingresá para gestionar tu stock, tus ventas y tu tienda online sin volverte loco.
          </p>

          <ul className={styles.heroBullets}>
            <li className={styles.heroBulletItem}>
              <CheckCircle size={20} className={styles.bulletIcon} />
              Stock, ventas y clientes en un solo lugar
            </li>
            <li className={styles.heroBulletItem}>
              <CheckCircle size={20} className={styles.bulletIcon} />
              Tu tienda online con el mismo catálogo
            </li>
            <li className={styles.heroBulletItem}>
              <CheckCircle size={20} className={styles.bulletIcon} />
              Chau al cuaderno, el Excel y los papelitos
            </li>
          </ul>
        </div>

        <div className={styles.heroBottom}>
          <p className={styles.heroQuote}>
            "Menos pérdidas, cero planillas. El control total de tu stock en un solo lugar."
          </p>
          <p className={styles.heroAuthor}>— Comercios como el tuyo</p>
        </div>
      </div>

      {/* ============ PANEL DERECHO: FORMULARIO TIPO TARJETA ============ */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          
          <div className={styles.formHeader}>
            <a href="https://www.stockshop.com.ar" className={styles.backLink}>
              ← Volver al inicio
            </a>
            
            <div className={styles.logoCenterWrap}>
               <img src={logoMate} alt="StockShop" className={styles.logoCenter} />
            </div>

            <h1 className={styles.title}>Iniciar sesión</h1>
            <p className={styles.tagline}>Ingresá tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Correo electrónico</label>
              <div className={styles.inputWrap}>
                <Mail className={styles.iconLeft} size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${styles.input} ${styles.inputWithIcon} ${error ? styles.inputWithError : ''}`}
                  placeholder="tu@correo.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Contraseña</label>
              <div className={styles.inputWrap}>
                <Lock className={styles.iconLeft} size={18} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${styles.input} ${styles.inputWithIcon} ${error ? styles.inputWithError : ''}`}
                  placeholder="••••••••"
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

            <div className={styles.forgotPassWrap}>
              <a href="#" className={styles.forgotLink}>¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" disabled={loading} className={styles.submit}>
              {loading ? 'Ingresando...' : 'Ingresar a mi cuenta'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className={styles.divider}>o</div>

          <button type="button" onClick={handleGoogle} className={styles.googleBtn}>
            <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Acceder con Google
          </button>

          <p className={styles.footer}>
            ¿No tenés cuenta?{' '}
            <a href="#" className={styles.footerLink}>Crear mi tienda gratis</a>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Login