import { useState, useEffect, useCallback, useRef } from 'react'
import { Package, Plus, Edit2, Trash2, LogOut, Search, AlertTriangle, ShoppingCart, BarChart3, RotateCcw, ChevronUp, Globe, DollarSign, User, ShoppingBag, Home, MoreVertical, X, CheckCircle2, Check, Upload, ChevronRight } from 'lucide-react'

import ImportProductsView from './ImportProductsView'
import { getProductosActivos, deactivateProducto, reactivateProducto, getProductosInactivos, enviarAWeb, quitarDeWeb, getPedidosWeb } from '../services/api'
import { supabase } from '../services/authService'
import { LOCAL_ID } from '../services/authService'
import { useAuth } from '../context/AuthContext'

import PedidosWebView from './PedidosWebView'
import ProductForm from './ProductForm'
import SalesForm from './SalesForm'
import SalesHistory from './SalesHistory'
import Tutorial from './Tutorial'
import Swal from 'sweetalert2'
import MetricsView from './MetricsView'
import ClientesView from './ClientesView'
import GastosView from './GastosView'
import ProfileView from './ProfileView'

import styles from './Dashboard.module.css'

const fmt = (n) => '$ ' + Math.round(Number(n || 0)).toLocaleString('es-AR')

function Dashboard({ onLogout }) {
  const { profile } = useAuth()

  const [productos, setProductos] = useState([])
  const [search, setSearch] = useState('')
  const [filtroCat, setFiltroCat] = useState('todas')
  const [soloStockBajo, setSoloStockBajo] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('home')
  const [showInactive, setShowInactive] = useState(false)
  const [productosInactivos, setProductosInactivos] = useState([])
  const [showTutorial, setShowTutorial] = useState(false)
  const [addedToCart, setAddedToCart] = useState(null)
  const [cart, setCart] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [cantidadVisible, setCantidadVisible] = useState(12)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [menuAbiertoId, setMenuAbiertoId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modoSeleccion, setModoSeleccion] = useState(false)
  const [seleccion, setSeleccion] = useState([])
  const PASO = 12
  const [pedidosCount, setPedidosCount] = useState(0)

  const dingRef = useRef(null)
  useEffect(() => {
    dingRef.current = new Audio('/ding.mp3')
    dingRef.current.preload = 'auto'
    dingRef.current.volume = 0.3
  }, [])

  const fetchPedidosCount = useCallback(async () => {
    try {
      const { data } = await getPedidosWeb()
      setPedidosCount((data || []).filter(p => p.estado === 'recibido').length)
    } catch (err) { /* sin pedidos aún */ }
  }, [])

  useEffect(() => { fetchPedidosCount() }, [fetchPedidosCount, currentView])

  // 🔔 CAMPANITA realtime
  useEffect(() => {
    if (!LOCAL_ID) return
    const channel = supabase
      .channel(`pedidos-web-${LOCAL_ID}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos_web', filter: `local_id=eq.${LOCAL_ID}` },
        (payload) => {
          const pedido = payload.new
          fetchPedidosCount()
          Swal.fire({
            toast: true, position: 'top-end', icon: 'success', title: '🔔 ¡Nuevo pedido!',
            html: `<b>${pedido.nombre_cliente || pedido.telefono_contacto || 'Cliente'}</b><br/>${fmt(pedido.total)}`,
            showConfirmButton: false, timer: 5000, timerProgressBar: true, background: '#fef3c7', color: '#92400e'
          })
          if (dingRef.current) {
            const ding = dingRef.current.cloneNode()
            ding.volume = 0.3
            ding.play().catch(() => {})
          }
        })
      .subscribe((status) => { if (status === 'SUBSCRIBED') console.log('🔔 Campanita activa para local', LOCAL_ID) })
    return () => { supabase.removeChannel(channel) }
  }, [fetchPedidosCount])

  const fetchProductos = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getProductosActivos()
      if (data) setProductos(data)
    } catch (err) { console.error('Error al cargar productos:', err) }
    setLoading(false)
  }, [])

  const fetchProductosInactivos = useCallback(async () => {
    try {
      const { data } = await getProductosInactivos()
      if (data) setProductosInactivos(data)
    } catch (err) { console.error('Error al cargar inactivos:', err) }
  }, [])

  useEffect(() => {
    fetchProductos()
    const tutorialSeen = localStorage.getItem('tutorial_completed')
    if (!tutorialSeen) setTimeout(() => setShowTutorial(true), 500)
  }, [fetchProductos])

  // 📅 Ventas de hoy
  // useEffect(() => {
  //   if (currentView !== 'home' || !LOCAL_ID) return
  //   (async () => {
  //     try {
  //       const desde = new Date(); desde.setHours(0, 0, 0, 0)
  //       const { data } = await supabase.from('ventas').select('total').eq('local_id', LOCAL_ID).gte('fecha', desde.toISOString())
  //       const list = data || []
  //       setVentasHoy({ monto: list.reduce((s, v) => s + Number(v.total || 0), 0), count: list.length })
  //     } catch (err) { /* sin ventas hoy */ }
  //   })()
  // }, [currentView])

  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      setScrolled(prev => {
        if (prev && y < 10) return false
        if (!prev && y > 50) return true
        return prev
      })
      setShowScrollTop(y > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setCantidadVisible(PASO) }, [search, filtroCat, soloStockBajo])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Desactivar producto?',
      html: `<p style="margin-bottom:10px">Este producto dejará de aparecer en el inventario.</p>
             <p style="color:#6b7280;font-size:0.9rem">No se borrará de la base: podés reactivarlo después.</p>`,
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, desactivar', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280'
    })
    if (result.isConfirmed) {
      try {
        await deactivateProducto(id)
        fetchProductos()
        Swal.fire({ title: 'Producto desactivado', text: 'Podés reactivarlo cuando quieras', icon: 'success', timer: 2000, showConfirmButton: false })
      } catch (err) {
        Swal.fire({ title: 'Error', text: err.response?.data?.message || err.message, icon: 'error' })
      }
    }
  }

  const handleReactivar = async (id) => {
    try {
      await reactivateProducto(id)
      fetchProductosInactivos(); fetchProductos()
      Swal.fire({ title: 'Producto reactivado', text: 'El producto volvió al inventario activo', icon: 'success', timer: 2000, showConfirmButton: false })
    } catch (err) {
      Swal.fire({ title: 'Error al reactivar', text: err.response?.data?.message || err.message, icon: 'error', confirmButtonColor: '#dc2626' })
    }
  }

  const getWebButtonStyle = (estado) => {
    switch (estado) {
      case 'publicado': return { cls: 'bg-green-100 text-green-700 hover:bg-green-200', title: '🌐 Publicado — click para quitar de la web' }
      case 'pendiente': return { cls: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200', title: '⏳ Pendiente — click para cancelar el envío' }
      case 'rechazado': return { cls: 'bg-red-100 text-red-700 hover:bg-red-200', title: '❌ Rechazado — click para reenviar' }
      default: return { cls: 'bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600', title: '🌐 Enviar a la web' }
    }
  }

  const handleWebToggle = async (producto) => {
    const estado = producto.web_estado || 'no_enviado'
    const esEnvio = estado === 'no_enviado' || estado === 'rechazado'
    const result = await Swal.fire({
      title: esEnvio ? (estado === 'rechazado' ? '¿Reenviar a la web?' : '¿Enviar a la web?') : (estado === 'publicado' ? '¿Quitar de la web?' : '¿Cancelar el envío?'),
      text: esEnvio ? 'Quedará pendiente de aprobación del dueño' : 'Dejará de verse (o de estar pendiente) en el catálogo online',
      icon: 'question', showCancelButton: true,
      confirmButtonText: esEnvio ? 'Sí, enviar' : 'Sí, quitar', cancelButtonText: 'Cancelar',
      confirmButtonColor: esEnvio ? '#2563eb' : '#dc2626'
    })
    if (result.isConfirmed) {
      try {
        if (esEnvio) await enviarAWeb(producto.id)
        else await quitarDeWeb(producto.id)
        Swal.fire({ title: esEnvio ? '🌐 Enviado a la web' : 'Quitado de la web', icon: 'success', timer: 1500, showConfirmButton: false })
        fetchProductos()
      } catch (err) {
        Swal.fire({ title: 'Error', text: err.message, icon: 'error' })
      }
    }
  }

  // ✅ MODO SELECCIÓN
  const toggleSeleccion = (id) => setSeleccion(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const salirDeSeleccion = () => { setModoSeleccion(false); setSeleccion([]) }

  const enviarSeleccion = async () => {
    if (!seleccion.length) return
    Swal.fire({ title: `Enviando ${seleccion.length} a la web...`, allowOutsideClick: false, didOpen: () => Swal.showLoading() })
    try {
      await Promise.all(seleccion.map(id => enviarAWeb(id)))
      Swal.fire({ title: `🌐 ${seleccion.length} producto(s) enviados a la web`, text: 'Quedan pendientes de aprobación', icon: 'success', timer: 2500, showConfirmButton: false })
      salirDeSeleccion(); fetchProductos()
    } catch (err) {
      Swal.fire({ title: 'Error al enviar', text: err.message, icon: 'error' })
    }
  }

  const desactivarSeleccion = async () => {
    if (!seleccion.length) return
    const res = await Swal.fire({
      title: `¿Desactivar ${seleccion.length} producto(s)?`,
      text: 'Podrás reactivarlos después desde "Ver desactivados"',
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, desactivar', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280'
    })
    if (!res.isConfirmed) return
    Swal.fire({ title: 'Desactivando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })
    try {
      await Promise.all(seleccion.map(id => deactivateProducto(id)))
      Swal.fire({ title: `${seleccion.length} producto(s) desactivados`, icon: 'success', timer: 2000, showConfirmButton: false })
      salirDeSeleccion(); fetchProductos()
    } catch (err) {
      Swal.fire({ title: 'Error', text: err.message, icon: 'error' })
    }
  }

  const addToCartFromDashboard = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id)
      let newCart
      if (existingItem) {
        if (existingItem.quantity + 1 > product.stock) {
          Swal.fire({ title: 'Stock insuficiente', text: `Solo quedan ${product.stock} unidades de ${product.nombre}.`, icon: 'warning', confirmButtonColor: '#dc2626', timer: 2000, showConfirmButton: false })
          return prevCart
        }
        newCart = prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      } else {
        newCart = [...prevCart, { ...product, quantity: 1 }]
      }
      Swal.fire({ title: 'Agregado al carrito!', text: `${product.nombre} (${newCart.reduce((sum, item) => item.id === product.id ? item.quantity : sum, 0)} en total)`, icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true })
      return newCart
    })
  }

  const vender = (p) => {
  addToCartFromDashboard(p)
  setAddedToCart(p.id)
  setTimeout(() => setAddedToCart(null), 2000)
}

  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))].sort()

  const filteredProductos = productos.filter(p => {
    const matchSearch =
      p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(search.toLowerCase()) ||
      p.color?.toLowerCase().includes(search.toLowerCase())
    const matchCat = filtroCat === 'todas' || p.categoria === filtroCat
    const matchStock = !soloStockBajo || p.stock <= 5
    return matchSearch && matchCat && matchStock
  })

  const productosMostrados = filteredProductos.slice(0, cantidadVisible)
  const stockBajo = productos.filter(p => p.stock <= 5).length
  const totalProductos = productos.length
  const totalStock = productos.reduce((acc, p) => acc + (p.stock || 0), 0)
  const productosEnRiesgo = productos.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock)

  const irAStockBajo = () => { setSoloStockBajo(true); setCurrentView('inventario') }
  const irA = (vista) => { setCurrentView(vista); setDrawerOpen(false) }

  // badge de selección sobre la foto (el norte visual nunca se pierde)
  const CheckOverlay = ({ id }) => modoSeleccion ? (
    <span className={`${styles.checkOverlay} ${seleccion.includes(id) ? styles.checkOverlayOn : ''}`}>
      {seleccion.includes(id) && <Check className="w-3.5 h-3.5" />}
    </span>
  ) : null

  return (
    <div className={`min-h-screen pb-32 md:pb-8 ${styles.root}`}>
      {/* ============ HEADER ============ */}
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : styles.headerNormal}`}>
        <div className={styles.headerInner}>
          <h1 className={styles.logo}>
            <div className={`${styles.logoIcon} ${scrolled ? styles.logoIconSmall : styles.logoIconBig}`}>
              <Package className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className={styles.logoText}>Stock<span className={styles.logoAccent}>Shop</span></span>
          </h1>
          <button onClick={onLogout} className={`btn btn-secondary touch-target ${styles.soloDesktop}`}>
            <LogOut className="w-5 h-5" /> Salir
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* ============ TABS DESKTOP ============ */}
        <div className="top-tabs">
          <button onClick={() => irA('home')} className={`tab-btn ${currentView === 'home' ? 'active' : ''}`}>
            <Home className="w-6 h-6" /> Inicio
          </button>
          <button onClick={() => irA('inventario')} className={`tab-btn ${currentView === 'inventario' ? 'active' : ''}`}>
            <Package className="w-6 h-6" /> Inventario
          </button>
          <button onClick={() => irA('sales')} className={`tab-btn ${currentView === 'sales' ? 'active' : ''}`}>
            <div className="flex items-center gap-1">
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{cart.length}</span>}
            </div>
            Registrar Venta
          </button>
          <button onClick={() => irA('history')} className={`tab-btn ${currentView === 'history' ? 'active' : ''}`}>
            <BarChart3 className="w-6 h-6" /> Historial
          </button>
          <button onClick={() => irA('pedidos')} className={`tab-btn ${currentView === 'pedidos' ? 'active' : ''}`}>
            <div className="flex items-center gap-1">
              <ShoppingBag className="w-6 h-6" />
              {pedidosCount > 0 && <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{pedidosCount}</span>}
            </div>
            Pedidos
          </button>
          <button onClick={() => irA('clientes')} className={`tab-btn ${currentView === 'clientes' ? 'active' : ''}`}>
            <User className="w-6 h-6" /> Clientes
          </button>
          <button onClick={() => irA('metrics')} className={`tab-btn ${currentView === 'metrics' ? 'active' : ''}`}>
            <BarChart3 className="w-6 h-6" /> Métricas
          </button>
          <button onClick={() => irA('gastos')} className={`tab-btn ${currentView === 'gastos' ? 'active' : ''}`}>
            <DollarSign className="w-6 h-6" /> Gastos
          </button>
          <button onClick={() => irA('profile')} className={`tab-btn ${currentView === 'profile' ? 'active' : ''}`}>
            <User className="w-6 h-6" /> Mi cuenta
          </button>
        </div>

        {/* ============ VISTA HOME ============ */}
        {currentView === 'home' ? (
          <>
            {/* ----- MOBILE ----- */}
            <div className="sm:hidden">
              <p className={styles.greetingHola}>👋 Hola, {profile?.nombre || '¡a vender!'}</p>
              <p className={styles.greetingLocal}>{profile?.locales?.nombre || 'Tu comercio'}</p>

              <div className={styles.heroCard}>
                <div className={styles.heroLogo}><Package className="w-7 h-7" /></div>
                <div>
                  <p className={styles.heroName}>{profile?.locales?.nombre || 'Tu comercio'}</p>
                  <p className={styles.heroSub}>{totalProductos} productos · {totalStock} unidades</p>
                </div>
              </div>

              <div className={styles.mobileScroll}>
                <div className={styles.mobileScrollInner}>
                  <button onClick={() => irA('inventario')} className={`${styles.mobileMetricCard} ${styles.mobileMetricCardIndigo}`}>
                    <div>
                      <p className={styles.metricLabel}>Mis Productos</p>
                      <p className={styles.metricValue}>{totalProductos}</p>
                    </div>
                    <p className={styles.metricHint}>productos activos</p>
                  </button>
                  <button onClick={() => irA('inventario')} className={`${styles.mobileMetricCard} ${styles.mobileMetricCardBlue}`}>
                    <div>
                      <p className={styles.metricLabel}>Stock Disponible</p>
                      <p className={styles.metricValueBlue}>{totalStock}</p>
                    </div>
                    <p className={styles.metricHint}>unidades en inventario</p>
                  </button>
                  <button onClick={irAStockBajo} className={`${styles.mobileMetricCard} ${stockBajo > 0 ? styles.mobileMetricCardRed : styles.mobileMetricCardGreen}`}>
                    <div className="flex items-center justify-between">
                      <p className={`${styles.metricLabel} ${stockBajo > 0 ? 'text-red-800' : 'text-green-800'}`}>
                        <AlertTriangle className={`w-4 h-4 ${stockBajo > 0 ? 'animate-pulse' : ''}`} /> Alertas
                      </p>
                      {stockBajo > 0 && <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">¡Atención!</span>}
                    </div>
                    <p className={`${styles.metricValue} ${stockBajo > 0 ? 'text-red-600' : 'text-green-600'}`}>{stockBajo}</p>
                  </button>
                </div>
              </div>

              <div className={styles.quickGrid}>
                <button onClick={() => irA('sales')} className={`${styles.quickCard} ${styles.quickCardGreen}`}>
                  <ShoppingCart className="w-6 h-6" /> Vender
                </button>
                <button onClick={() => { setShowForm(true); setEditId(null); }} className={`${styles.quickCard} ${styles.quickCardBlue}`}>
                  <Plus className="w-6 h-6" /> Agregar
                </button>
                <button onClick={() => irA('pedidos')} className={`${styles.quickCard} ${styles.quickCardAmber}`}>
                  <ShoppingBag className="w-6 h-6" /> Pedidos {pedidosCount > 0 ? `(${pedidosCount})` : ''}
                </button>
              </div>

              <button onClick={() => irA('importar')} className={styles.importCard}>
  <div className={styles.importIcon}><Upload size={22} /></div>
  <div className={styles.importInfo}>
    <p className={styles.importTitle}>Importar stock masivamente</p>
    <p className={styles.importHint}>Cargá tu catálogo desde CSV en minutos</p>
  </div>
  <ChevronRight size={18} className={styles.importChevron} />
</button>
            </div>

            {/* ----- DESKTOP ----- */}
            <div className="hidden sm:block">
              <div className={styles.metricsGrid}>
                <button onClick={() => irA('inventario')} className={styles.metricCard}>
                  <p className={styles.metricLabel}>Mis Productos</p>
                  <p className={styles.metricValue}>{totalProductos}</p>
                  <p className={styles.metricHint}>Tocá para ver el inventario</p>
                </button>
                <button onClick={() => irA('inventario')} className={styles.metricCard}>
                  <p className={styles.metricLabel}>Stock Disponible</p>
                  <p className={styles.metricValueBlue}>{totalStock}</p>
                  <p className={styles.metricHint}>unidades en inventario</p>
                </button>
                <button onClick={irAStockBajo} className={styles.metricCard}>
                  <p className={styles.metricLabel}><AlertTriangle className="w-6 h-6 text-red-500" /> Alertas de Stock</p>
                  {stockBajo === 0 ? <p className={styles.alertOk}>Todo en orden</p> : (
                    <div className={styles.alertList}>
                      {productosEnRiesgo.slice(0, 5).map(p => (
                        <div key={p.id} className={`${styles.alertItem} ${p.stock === 0 ? styles.alertItemDanger : styles.alertItemWarning}`}>
                          <div className="flex-1 min-w-0">
                            <p className={`${styles.alertItemName} ${p.stock === 0 ? styles.alertItemNameDanger : styles.alertItemNameWarning}`}>{p.nombre}</p>
                            <p className={styles.alertItemMeta}>{p.categoria} • {p.talle || 'N/A'}</p>
                          </div>
                          <span className={`${styles.alertItemStock} ${p.stock === 0 ? styles.alertItemStockDanger : styles.alertItemStockWarning}`}>{p.stock}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              </div>

              <div className={styles.quickRow}>
                <button onClick={() => irA('sales')} className={`${styles.quickBtn} ${styles.quickBtnGreen}`}>
                  <ShoppingCart className="w-5 h-5" /> Registrar venta
                </button>
                <button onClick={() => { setShowForm(true); setEditId(null); }} className={`${styles.quickBtn} ${styles.quickBtnBlue}`}>
                  <Plus className="w-5 h-5" /> Agregar producto
                </button>
                <button onClick={() => irA('pedidos')} className={`${styles.quickBtn} ${styles.quickBtnAmber}`}>
                  <ShoppingBag className="w-5 h-5" /> Ver pedidos
                  {pedidosCount > 0 && <span className={styles.quickBadge}>{pedidosCount}</span>}
                </button>
              </div>

              <button onClick={() => irA('importar')} className={styles.importCard}>
  <div className={styles.importIcon}><Upload size={22} /></div>
  <div className={styles.importInfo}>
    <p className={styles.importTitle}>Importar stock masivamente</p>
    <p className={styles.importHint}>Cargá tu catálogo desde CSV en minutos</p>
  </div>
  <ChevronRight size={18} className={styles.importChevron} />
</button>
            </div>
          </>
        ) : null}

        {/* ============ VISTA INVENTARIO ============ */}
        {(currentView === 'inventario' || currentView === 'dashboard') ? (
          <>
            <div className={styles.filterBar}>
              <div className={styles.searchWrap}>
                <Search className={styles.searchIcon} />
                <input type="text" placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} className={styles.searchInput} />
              </div>
              <select value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)} className={styles.filterSelect}>
                <option value="todas">Todas las categorías</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={() => setSoloStockBajo(v => !v)} className={`${styles.filterCheck} ${soloStockBajo ? styles.filterCheckActive : ''}`}>
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Stock bajo</span>
                <span className="sm:hidden">Stock</span>
              </button>
              <button onClick={() => { setShowForm(true); setEditId(null); }} className="btn btn-primary">
                <Plus className="w-5 h-5" /> Agregar
              </button>
            </div>

            <div className={styles.listToolbar}>
              <p className={styles.listCount}>{filteredProductos.length} producto(s)</p>
              {!modoSeleccion ? (
                <button onClick={() => setModoSeleccion(true)} className={styles.selectBtn}>
                  <CheckCircle2 className="w-4 h-4" /> Seleccionar
                </button>
              ) : (
                <button onClick={() => setSeleccion(seleccion.length === productosMostrados.length ? [] : productosMostrados.map(p => p.id))} className={styles.selectBtn}>
                  {seleccion.length === productosMostrados.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
              )}
            </div>

            {/* hint con 0 seleccionados (no tapa nada) */}
            {modoSeleccion && seleccion.length === 0 && (
              <div className={styles.selectHint}>
                <span>Tocá productos para seleccionarlos</span>
                <button onClick={salirDeSeleccion} className={styles.hintClose} aria-label="Salir del modo selección">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* LISTA MOBILE */}
            <div className={styles.mobileList}>
              {loading ? <div className="loading-state">Cargando productos...</div> :
                filteredProductos.length === 0 ? (
                  <div className="empty-state">{search || filtroCat !== 'todas' || soloStockBajo ? 'No se encontraron productos con esos filtros.' : 'No hay productos. ¡Agrega el primero!'}</div>
                ) : (
                  productosMostrados.map((p) => (
                    <div
                      key={p.id}
                      className={`${styles.mobileRow} ${seleccion.includes(p.id) ? styles.mobileRowSelected : ''}`}
                      onClick={() => modoSeleccion && toggleSeleccion(p.id)}
                    >
                      <div className={styles.thumbWrap}>
                        {p.imagen_url ? (
                          <img src={p.imagen_url} alt={p.nombre} className={styles.mobileThumb} onClick={() => !modoSeleccion && setSelectedImage(p.imagen_url)} onError={(e) => { e.target.style.display = 'none' }} />
                        ) : (
                          <div className={styles.mobileThumb}><Package className="w-6 h-6" /></div>
                        )}
                        <CheckOverlay id={p.id} />
                      </div>
                      <div className={styles.mobileInfo}>
                        <p className={styles.mobileName}>{p.nombre}</p>
                        <p className={styles.mobileMeta}>{p.categoria || 'Sin categoría'} · {p.talle || '-'}</p>
                        <p className={styles.mobilePrice}>{fmt(p.precio)}</p>
                      </div>
                      <span className={`stock-badge ${p.stock <= 5 ? 'stock-low' : 'stock-ok'}`}>{p.stock}</span>
                      {!modoSeleccion && (
                        <>
                          <button onClick={() => setMenuAbiertoId(menuAbiertoId === p.id ? null : p.id)} className={`${styles.kebab} ${menuAbiertoId === p.id ? styles.kebabOpen : ''}`}>
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {menuAbiertoId === p.id && (
                            <div className={styles.kebabMenu}>
                              <button className={styles.kebabItem} onClick={() => { setMenuAbiertoId(null); vender(p) }}>
                                <ShoppingCart className="w-4 h-4" /> Vender
                              </button>
                              <button className={styles.kebabItem} onClick={() => { setMenuAbiertoId(null); handleWebToggle(p) }}>
                                <Globe className="w-4 h-4" /> {p.web_estado === 'publicado' ? 'Quitar de la web' : 'Enviar a la web'}
                              </button>
                              <button className={styles.kebabItem} onClick={() => { setMenuAbiertoId(null); setShowForm(true); setEditId(p.id) }}>
                                <Edit2 className="w-4 h-4" /> Editar
                              </button>
                              <button className={`${styles.kebabItem} ${styles.kebabItemDanger}`} onClick={() => { setMenuAbiertoId(null); handleDelete(p.id) }}>
                                <Trash2 className="w-4 h-4" /> Desactivar
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))
                )
              }
            </div>

            {/* TABLA DESKTOP */}
            <div className={styles.tableWrap}>
              <div className={styles.tableCard}>
                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Imagen</th>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Web</th>
                        <th className={styles.stickyHead}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="7"><div className="loading-state">Cargando productos...</div></td></tr>
                      ) : filteredProductos.length === 0 ? (
                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>No se encontraron productos.</td></tr>
                      ) : (
                        productosMostrados.map((p) => (
                          <tr key={p.id} onClick={() => modoSeleccion && toggleSeleccion(p.id)} style={modoSeleccion ? { cursor: 'pointer' } : undefined}>
                            <td>
                              <div className={styles.thumbWrap}>
                                {p.imagen_url ? (
                                  <img src={p.imagen_url} alt={p.nombre} className={styles.thumbCell} onClick={() => !modoSeleccion && setSelectedImage(p.imagen_url)} onError={(e) => { e.target.style.display = 'none' }} />
                                ) : (
                                  <div className={styles.thumbCell}><Package className="w-6 h-6" /></div>
                                )}
                                <CheckOverlay id={p.id} />
                              </div>
                            </td>
                            <td>
                              <p className={styles.nameCell}>{p.nombre}</p>
                              <p className={styles.nameMeta}>{p.talle || '-'} · {p.color || '-'}</p>
                            </td>
                            <td>{p.categoria || '-'}</td>
                            <td className={styles.priceCell}>{fmt(p.precio)}</td>
                            <td><span className={`stock-badge ${p.stock <= 5 ? 'stock-low' : 'stock-ok'}`}>{p.stock}</span></td>
                            <td>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleWebToggle(p) }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition ${getWebButtonStyle(p.web_estado || 'no_enviado').cls}`}
                                title={getWebButtonStyle(p.web_estado || 'no_enviado').title}
                              >
                                <Globe className="w-4 h-4" />
                              </button>
                            </td>
                            <td className={styles.stickyCell}>
                              <div className={styles.actionCell}>
                                <button onClick={(e) => { e.stopPropagation(); vender(p) }} className="btn btn-success touch-target" disabled={p.stock <= 0} title="Vender">
                                  <ShoppingCart className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setShowForm(true); setEditId(p.id); }} className="btn btn-secondary touch-target" title="Editar">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }} className="btn btn-danger touch-target" title="Desactivar">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {!loading && filteredProductos.length > 0 && (
              <div className={styles.paginationCard}>
                <p className={styles.paginationText}>Mostrando {Math.min(cantidadVisible, filteredProductos.length)} de {filteredProductos.length} productos</p>
                {filteredProductos.length > cantidadVisible && (
                  <button onClick={() => setCantidadVisible(c => c + PASO)} className={styles.paginationBtn}>
                    Ver más ({filteredProductos.length - cantidadVisible} restantes)
                  </button>
                )}
              </div>
            )}

            <div className="text-center mt-8">
              <button onClick={() => { setShowInactive(!showInactive); if (!showInactive) fetchProductosInactivos(); }} className="btn btn-secondary">
                {showInactive ? 'Ocultar productos desactivados' : 'Ver productos desactivados'}
              </button>
            </div>

            {showInactive && (
              <div className={styles.inactiveWrap}>
                <div className={styles.inactiveHeader}>
                  <h3 className={styles.inactiveTitle}><RotateCcw className="w-5 h-5" /> Productos Desactivados</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-600 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-600 uppercase">Categoría</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-600 uppercase">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                      {productosInactivos.map((p) => (
                        <tr key={p.id} className="bg-gray-50">
                          <td className="px-6 py-3 text-gray-500 text-base">{p.nombre}</td>
                          <td className="px-6 py-3 text-gray-500 text-base">{p.categoria || '-'}</td>
                          <td className="px-6 py-3 text-right">
                            <button onClick={() => handleReactivar(p.id)} className="btn btn-success touch-target" style={{ minWidth: 'auto', padding: '0 12px' }}>
                              <RotateCcw className="w-4 h-4" /> Reactivar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : null}

              {/* ============ OTRAS VISTAS ============ */}
        {currentView === 'sales' ? (
          <SalesForm onSaleRecorded={fetchProductos} productos={productos} cart={cart} setCart={setCart} />
        ) : currentView === 'history' ? (
          <SalesHistory />
        ) : currentView === 'clientes' ? (
          <ClientesView />
        ) : currentView === 'metrics' ? (
          <MetricsView onNavigate={(v) => (v === 'stockbajo' ? irAStockBajo() : irA(v))} />
        ) : currentView === 'gastos' ? (
          <GastosView />
        ) : currentView === 'pedidos' ? (
          <PedidosWebView onCambios={fetchPedidosCount} />
        ) : currentView === 'profile' ? (
          <ProfileView />
        ) : currentView === 'importar' ? (
          <ImportProductsView onBack={() => irA('home')} onDone={() => { fetchProductos(); irA('inventario') }} />
        ) : null}
      </main>

      {/* ============ BARRA DE SELECCIÓN (solo con 1+) ============ */}
      {modoSeleccion && seleccion.length > 0 && (
        <div className={styles.selectionBar}>
          <span className={styles.selectionCount}>{seleccion.length}</span>
          <button onClick={enviarSeleccion} className={styles.selectionSend}>
            <Globe className="w-4 h-4" /> <span className="hidden sm:inline">Enviar a la web</span><span className="sm:hidden">Enviar</span>
          </button>
          <button onClick={desactivarSeleccion} className={styles.selectionDanger} title="Desactivar seleccionados">
            <Trash2 className="w-5 h-5" />
          </button>
          <button onClick={salirDeSeleccion} className={styles.selectionCancel} aria-label="Cancelar selección">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ============ BOTTOM NAV MOBILE ============ */}
      <nav id="bottom-nav" className="bottom-nav">
        <button onClick={() => irA('home')} className={`nav-item ${currentView === 'home' ? 'active' : ''}`}>
          <Home className="w-6 h-6" /> <span>Inicio</span>
        </button>
        <button onClick={() => irA('inventario')} className={`nav-item ${currentView === 'inventario' ? 'active' : ''}`}>
          <Package className="w-6 h-6" /> <span>Inventario</span>
        </button>
        <button onClick={() => irA('sales')} className={`nav-item ${currentView === 'sales' ? 'active' : ''}`}>
          <div className="flex items-center gap-1">
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{cart.length}</span>}
          </div>
          <span>Ventas</span>
        </button>
        <button onClick={() => setDrawerOpen(true)} className={`nav-item ${drawerOpen ? 'active' : ''}`}>
          <MoreVertical className="w-6 h-6" /> <span>Más</span>
        </button>
      </nav>

      {/* ============ DRAWER DERECHO ============ */}
      {drawerOpen && (
        <>
          <div className={styles.drawerOverlay} onClick={() => setDrawerOpen(false)} />
          <aside className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>Menú</span>
              <button onClick={() => setDrawerOpen(false)} className={styles.hamburgerBtn}><X className="w-5 h-5" /></button>
            </div>
            <div className={styles.drawerBody}>
              <button onClick={() => irA('history')} className={styles.drawerItem}>
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <div><p className={styles.drawerItemTitle}>Historial</p><p className={styles.drawerItemHint}>Ventas registradas</p></div>
              </button>
              <button onClick={() => irA('pedidos')} className={styles.drawerItem}>
                <ShoppingBag className="w-6 h-6 text-red-600" />
                <div><p className={styles.drawerItemTitle}>Pedidos web {pedidosCount > 0 && `(${pedidosCount})`}</p><p className={styles.drawerItemHint}>Compras de tu vidriera</p></div>
              </button>
              <button onClick={() => irA('clientes')} className={styles.drawerItem}>
                <User className="w-6 h-6 text-blue-600" />
                <div><p className={styles.drawerItemTitle}>Clientes</p><p className={styles.drawerItemHint}>Deudas y pagos</p></div>
              </button>
              <button onClick={() => irA('metrics')} className={styles.drawerItem}>
                <BarChart3 className="w-6 h-6 text-green-600" />
                <div><p className={styles.drawerItemTitle}>Métricas</p><p className={styles.drawerItemHint}>Estadísticas y reportes</p></div>
              </button>
              <button onClick={() => irA('gastos')} className={styles.drawerItem}>
                <DollarSign className="w-6 h-6 text-red-600" />
                <div><p className={styles.drawerItemTitle}>Gastos</p><p className={styles.drawerItemHint}>Egresos del local</p></div>
              </button>
              <button onClick={() => irA('profile')} className={styles.drawerItem}>
                <User className="w-6 h-6 text-blue-600" />
                <div><p className={styles.drawerItemTitle}>Mi cuenta</p><p className={styles.drawerItemHint}>Perfil, web y contraseña</p></div>
              </button>
              <button onClick={() => irA('importar')} className={styles.drawerItem}>
                <Upload className="w-6 h-6 text-blue-600" />
                <div><p className={styles.drawerItemTitle}>Importar stock</p><p className={styles.drawerItemHint}>Carga masiva desde CSV</p></div>
              </button>
              <button onClick={onLogout} className={styles.drawerItem}>
                <LogOut className="w-6 h-6 text-red-600" />
                <div><p className={`${styles.drawerItemTitle} text-red-600`}>Salir</p><p className={styles.drawerItemHint}>Cerrar sesión</p></div>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ============ MODALES Y FLOTANTES ============ */}
      {showForm && <ProductForm onClose={() => setShowForm(false)} editId={editId} onSave={fetchProductos} />}
      {showTutorial && <Tutorial onComplete={() => setShowTutorial(false)} />}

      {showScrollTop && (
        <button onClick={scrollToTop} className={styles.scrollTopBtn} title="Subir arriba">
          <ChevronUp className="w-6 h-6" />
        </button>
      )}

      {selectedImage && (
        <div className={styles.imageModal} onClick={() => setSelectedImage(null)}>
          <button onClick={() => setSelectedImage(null)} className={styles.imageModalClose}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img src={selectedImage} alt="Producto" className={styles.imageModalImg} onClick={(e) => e.stopPropagation()} />
          <p className={styles.imageModalHint}>Tocá fuera para cerrar</p>
        </div>
      )}
    </div>
  )
}

export default Dashboard