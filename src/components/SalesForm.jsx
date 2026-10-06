import { useState, useEffect, useRef, useCallback } from 'react'
import html2canvas from 'html2canvas'
import { Search, Plus, Trash2, ShoppingCart, Minus, X, Barcode, User, Phone, DollarSign, Tag, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { 
  updateProducto, createVenta, createDetalleVenta, crearOActualizarCliente, 
  registrarPago, actualizarEstadoPagoVenta, updateVentaCliente, getVariantes,
  descontarStockVariante, getStockReservado, getLocalConfig
} from '../services/api'
import { LOCAL_ID } from '../services/authService'
import Swal from 'sweetalert2'
import { BrowserMultiFormatReader } from '@zxing/library'
import styles from './SalesForm.module.css'

const formatWhatsAppNumber = (phone) => {
  if (!phone) return ''
  let clean = phone.replace(/\D/g, '')
  if (clean.startsWith('549')) return clean
  if (clean.startsWith('0')) clean = clean.slice(1)
  if (clean.startsWith('9')) clean = clean.slice(1)
  if (clean.startsWith('15')) clean = '11' + clean
  clean = clean.replace(/^(11|2\d{2}|3\d{2})15/, '$1')
  return `549${clean}`
}

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

const Tooltip = ({ text, show, onClose }) => {
  if (!show) return null
  return (
    <div className={styles.tooltip}>
      {text}
      <button onClick={onClose} className={styles.tooltipClose}>×</button>
      <div className={styles.tooltipArrow} />
    </div>
  )
}

function SalesForm({ onSaleRecorded, productos, cart, setCart }) {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [filteredProducts, setFilteredProducts] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [clienteNombre, setClienteNombre] = useState('')
  const [montoPagado, setMontoPagado] = useState('')
  
  const [aplicarDescuento, setAplicarDescuento] = useState(false)
  const [tipoDescuento, setTipoDescuento] = useState('porcentaje')
  const [valorDescuento, setValorDescuento] = useState(0)
  const [motivoDescuento, setMotivoDescuento] = useState('Promoción')
  
  const [showClientData, setShowClientData] = useState(false)
  const [showDiscount, setShowDiscount] = useState(false)
  
  const [firstUse, setFirstUse] = useState(() => JSON.parse(localStorage.getItem('stockShop_first_use') || 'true'))
  const [showScanTooltip, setShowScanTooltip] = useState(false)
  const [showDiscountTooltip, setShowDiscountTooltip] = useState(false)
  
  const [variantesProducto, setVariantesProducto] = useState(null)
  const [variantes, setVariantes] = useState([])
  const [asignandoItem, setAsignandoItem] = useState(null)
  const [tallePanel, setTallePanel] = useState(null)

  // ============ CONFIG MULTI-TENANT DEL LOCAL ============
  const [localConfig, setLocalConfig] = useState(null)

  // ============ MODAL DE ÉXITO (canales de entrega) ============
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const [telefonoSuccess, setTelefonoSuccess] = useState('')
  
  const codeReaderRef = useRef(null)
  const isCancelledRef = useRef(false)
  const montoInputRef = useRef(null)
  const ticketRef = useRef(null)

  // ============ PERSISTENCIA DE CARRITO ============
  useEffect(() => {
    const saved = localStorage.getItem('stockShop_cart')
    if (saved && cart.length === 0) {
      try { setCart(JSON.parse(saved)) } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('stockShop_cart', JSON.stringify(cart))
  }, [cart])

  // ============ CARGAR CONFIG DEL LOCAL (multi-tenant) ============
  useEffect(() => {
    if (LOCAL_ID) getLocalConfig(LOCAL_ID).then(setLocalConfig).catch(() => {})
  }, [])

  useEffect(() => {
    localStorage.setItem('stockShop_first_use', JSON.stringify(firstUse))
    if (firstUse) {
      setTimeout(() => setShowScanTooltip(true), 2000)
      setTimeout(() => setShowDiscountTooltip(true), 5000)
    }
  }, [firstUse])

  useEffect(() => {
    if (debouncedSearchTerm.trim() === '') { setFilteredProducts([]); return }
    const term = debouncedSearchTerm.toLowerCase()
    const results = productos.filter(p => 
      p.nombre?.toLowerCase().includes(term) || p.categoria?.toLowerCase().includes(term) ||
      p.color?.toLowerCase().includes(term) || p.talle?.toLowerCase().includes(term) ||
      p.barcode?.includes(term) || p.codigo_barras?.includes(term)
    ).slice(0, 10)
    setFilteredProducts(results)
  }, [debouncedSearchTerm, productos])

  const triggerHaptic = useCallback((pattern = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
  }, [])

  // ⚠️ Chequea stock comprometido por pedidos web sin confirmar
  const chequearReservado = async (variante, cantidadPedida) => {
    if (!variante) return true
    const { data: map } = await getStockReservado([variante.id])
    const reservados = map[variante.id] || 0
    const disponible = variante.stock - reservados

    if (cantidadPedida > disponible) {
      await Swal.fire({
        icon: 'warning',
        title: '⚠️ Stock reservado por la web',
        html: `Hay <b>${reservados} u</b> de <b>${variante.talle || ''} ${variante.color || ''}</b> reservadas en pedidos web sin confirmar.<br/>Disponibles reales: <b>${disponible}</b>.<br/><br/>Revisá la tab Pedidos para confirmar o cancelar esos pedidos.`,
        confirmButtonColor: '#f59e0b'
      })
      return false
    }

    if (reservados > 0) {
      const r = await Swal.fire({
        icon: 'warning',
        title: 'Ojo: stock comprometido',
        html: `Quedan <b>${disponible}</b> disponibles reales (${reservados} u reservadas por pedidos web).<br/>¿Vender igual?`,
        showCancelButton: true,
        confirmButtonText: 'Vender igual',
        cancelButtonText: 'Mejor no',
        confirmButtonColor: '#f59e0b'
      })
      return r.isConfirmed
    }

    return true
  }

  // Flujo 1: desde el buscador / escáner
  const addToCart = useCallback(async (product) => {
    triggerHaptic(20)
    
    let variantesData = []
    try {
      const { data } = await getVariantes(product.id)
      variantesData = data || []
    } catch (err) {
      console.error('Error cargando variantes:', err)
    }

    if (variantesData.length <= 1) {
      const variante = variantesData[0]
      const existingItem = cart.find(item => item.id === product.id && item.variante_id === variante?.id)
      
      if (existingItem) {
        const stockDisponible = variante ? variante.stock : product.stock
        
        if (!(await chequearReservado(variante, existingItem.quantity + 1))) return
        
        if (existingItem.quantity + 1 > stockDisponible) {
          Swal.fire({ title: 'Stock insuficiente', text: `Solo quedan ${stockDisponible}.`, icon: 'warning', confirmButtonColor: '#dc2626' })
          return
        }
        setCart(cart.map(item => 
          item.id === product.id && item.variante_id === variante?.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        ))
      } else {
        const stockDisponible = variante ? variante.stock : product.stock
        
        if (!(await chequearReservado(variante, 1))) return
        
        if (stockDisponible <= 0) {
          Swal.fire({ title: 'Sin stock', text: 'Este producto no tiene stock disponible.', icon: 'warning', confirmButtonColor: '#dc2626' })
          return
        }
        setCart([...cart, { 
          ...product, 
          variante_id: variante?.id || null,
          talle: variante?.talle || product.talle,
          color: variante?.color || product.color,
          stock: stockDisponible,
          quantity: 1 
        }])
        if (cart.length === 0) setMontoPagado(product.precio.toString())
      }
    } else {
      setTallePanel(null)
      setVariantesProducto(product)
      setVariantes(variantesData)
    }
    
    setSearchTerm('')
    setFilteredProducts([])
  }, [cart, triggerHaptic, productos])

  // Flujo 2: desde el carrito (ítem sin variante, viene del Dashboard)
  const abrirSelectorParaItem = async (item) => {
    try {
      const { data } = await getVariantes(item.id)
      const vars = data || []
      if (vars.length === 0) {
        Swal.fire({ 
          title: 'Sin variantes', 
          text: 'Este producto no tiene variantes cargadas. Editá el producto y agregale talles.', 
          icon: 'info', 
          confirmButtonColor: '#2563eb' 
        })
        return
      }
      const base = productos.find(p => p.id === item.id) || item
      setTallePanel(null)
      setAsignandoItem(item)
      setVariantesProducto(base)
      setVariantes(vars)
    } catch (err) {
      Swal.fire({ title: 'Error', text: err.message, icon: 'error', confirmButtonColor: '#dc2626' })
    }
  }

  // Agregar variante: maneja ambos modos (nuevo y asignar)
  const agregarConVariante = async (variante) => {
    if (asignandoItem) {
      if (!(await chequearReservado(variante, 1))) return
      
      const nuevo = {
        ...asignandoItem,
        variante_id: variante.id,
        talle: variante.talle,
        color: variante.color,
        stock: variante.stock,
        precio: variante.precio || asignandoItem.precio,
        quantity: 1
      }
      setCart(
        cart.filter(i => !(i.id === asignandoItem.id && !i.variante_id)).concat([nuevo])
      )
      setAsignandoItem(null)
    } else {
      const existingItem = cart.find(item => item.id === variantesProducto.id && item.variante_id === variante.id)
      if (existingItem) {
        if (!(await chequearReservado(variante, existingItem.quantity + 1))) return
        
        if (existingItem.quantity + 1 > variante.stock) {
          Swal.fire({ title: 'Stock insuficiente', text: `Solo quedan ${variante.stock} de esta variante.`, icon: 'warning', confirmButtonColor: '#dc2626' })
          return
        }
        setCart(cart.map(item => 
          item.id === variantesProducto.id && item.variante_id === variante.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        ))
      } else {
        if (!(await chequearReservado(variante, 1))) return
        
        setCart([...cart, { 
          ...variantesProducto, 
          variante_id: variante.id,
          talle: variante.talle,
          color: variante.color,
          stock: variante.stock,
          precio: variante.precio || variantesProducto.precio,
          quantity: 1 
        }])
        if (cart.length === 0) setMontoPagado((variante.precio || variantesProducto.precio).toString())
      }
    }
    setVariantesProducto(null)
    setVariantes([])
    setTallePanel(null)
  }

  const updateQuantity = useCallback((id, varianteId, newQuantity) => {
    if (newQuantity < 1) return
    triggerHaptic(10)
    const item = cart.find(i => i.id === id && i.variante_id === varianteId)
    if (!item) return
    if (newQuantity > item.stock) {
      Swal.fire({ title: 'Stock insuficiente', text: `Máximo: ${item.stock}`, icon: 'warning', confirmButtonColor: '#dc2626' })
      return
    }
    setCart(cart.map(i => 
      i.id === id && i.variante_id === varianteId 
        ? { ...i, quantity: newQuantity } 
        : i
    ))
  }, [cart, triggerHaptic])

  const removeFromCart = useCallback((id, varianteId) => {
    triggerHaptic([10, 50, 10])
    const newCart = cart.filter(item => !(item.id === id && item.variante_id === varianteId))
    setCart(newCart)
    if (newCart.length === 0) setMontoPagado('')
  }, [cart, triggerHaptic])

  const totalBruto = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0)
  const descuentoMonto = aplicarDescuento ? (tipoDescuento === 'porcentaje' ? totalBruto * (valorDescuento / 100) : valorDescuento) : 0
  const totalNeto = totalBruto - descuentoMonto
  const montoPagadoNum = Number(montoPagado) || 0
  const vuelto = Math.max(0, montoPagadoNum - totalNeto)
  const resta = totalNeto - montoPagadoNum

  const pagoStatus = montoPagadoNum === 0 ? 'empty' 
    : montoPagadoNum > totalNeto ? 'excess'
    : montoPagadoNum === totalNeto ? 'exact'
    : 'partial'

  // ============ GENERAR TICKET VISUAL ============
  const generarTicketImagen = async () => {
    if (!ticketRef.current) return null
    try {
      const canvas = await html2canvas(ticketRef.current, { 
        scale: 2, 
        backgroundColor: '#ffffff',
        useCORS: true 
      })
      return canvas.toDataURL('image/png')
    } catch (err) {
      console.error('Error generando ticket:', err)
      return null
    }
  }

  // ============ CANALES DE ENTREGA DEL COMPROBANTE ============
   const imprimirTicket = () => {
    const itemsHtml = cart.map(item => `
      <div style="margin-bottom:6px;">
        <div style="font-weight:700;">${item.quantity}x ${item.nombre}</div>
        ${(item.talle || item.color) ? `<div style="font-size:10px;color:#444;">${[item.talle, item.color].filter(Boolean).join(' ')}</div>` : ''}
        <div style="text-align:right;font-weight:700;">$${(item.precio * item.quantity).toLocaleString('es-AR')}</div>
      </div>
    `).join('')

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Ticket #${successData?.ventaId || ''}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { box-sizing: border-box; }
          body {
            width: 76mm; margin: 0 auto; padding: 3mm 2mm;
            font-family: 'Courier New', monospace; font-size: 12px; color: #000;
          }
          .c { text-align: center; }
          .b { font-weight: 700; }
          .row { display: flex; justify-content: space-between; }
          hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
        </style>
      </head>
      <body>
        <div class="c b" style="font-size:15px;letter-spacing:2px;">${(localConfig?.nombre || 'COMPROBANTE').toUpperCase()}</div>
        <div class="c" style="font-size:10px;">${new Date().toLocaleString('es-AR')}</div>
        <div class="c" style="font-size:10px;">Ticket #${successData?.ventaId || ''}</div>
        <hr/>
        ${itemsHtml}
        <hr/>
        <div class="row"><span>Subtotal:</span><span>$${totalBruto.toLocaleString('es-AR')}</span></div>
        ${aplicarDescuento && descuentoMonto > 0 ? `<div class="row"><span>Descuento (${motivoDescuento}):</span><span>-$${descuentoMonto.toLocaleString('es-AR')}</span></div>` : ''}
        <div class="row b" style="font-size:14px;margin-top:4px;"><span>TOTAL:</span><span>$${totalNeto.toLocaleString('es-AR')}</span></div>
        ${vuelto > 0 ? `
          <div class="row"><span>Pagado:</span><span>$${montoPagadoNum.toLocaleString('es-AR')}</span></div>
          <div class="row"><span>Vuelto:</span><span>$${vuelto.toLocaleString('es-AR')}</span></div>
        ` : ''}
        <hr/>
        ${localConfig?.ticket_footer
          ? `<div class="c" style="font-size:10px;">${localConfig.ticket_footer.replace(/\n/g, '<br/>')}</div>`
          : `<div class="c" style="font-size:10px;">¡Gracias por tu compra!</div>`}
        ${localConfig?.instagram ? `<div class="c" style="font-size:10px;">@${localConfig.instagram}</div>` : ''}
      </body>
      </html>
    `

    const w = window.open('', '_blank', 'width=420,height=640')
    if (!w) return Swal.fire('Ventana bloqueada', 'Habilitá las ventanas emergentes para poder imprimir.', 'warning')
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 300)
  }

  const compartirImagen = async () => {
    try {
      const img = successData?.ticketImg
      if (!img) return Swal.fire('No se pudo generar el ticket', 'Probá con imprimir o texto.', 'warning')
      const blob = await (await fetch(img)).blob()
      const file = new File([blob], `comprobante-${successData.ventaId}.png`, { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        // menú nativo del celu → WhatsApp con la imagen ADJUNTA
        await navigator.share({ files: [file], title: `Comprobante #${successData.ventaId}` })
      } else {
        const link = document.createElement('a')
        link.download = `comprobante-${successData.ventaId}.png`
        link.href = img
        link.click()
        Swal.fire('Imagen descargada', 'Adjuntala en el chat de WhatsApp manualmente.', 'info')
      }
    } catch (err) {
      if (err.name !== 'AbortError') Swal.fire('Error al compartir', err.message, 'error')
    }
  }

  const enviarTextoWhatsApp = () => {
    const tel = telefonoSuccess.trim()
    if (!tel) return Swal.fire('Ingresá un teléfono', 'Lo necesito para abrir el chat de WhatsApp.', 'warning')
    window.open(`https://wa.me/${formatWhatsAppNumber(tel)}?text=${encodeURIComponent(successData.mensaje)}`, '_blank')
  }

  const cerrarSuccess = () => {
    setShowSuccess(false)
    setSuccessData(null)
    setCart([]); setClienteTelefono(''); setClienteNombre(''); setMontoPagado('')
    setAplicarDescuento(false); setValorDescuento(0); setMotivoDescuento('Promoción')
    localStorage.removeItem('stockShop_cart')
    triggerHaptic([50, 100, 50])
    onSaleRecorded()
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return Swal.fire({ title: 'Carrito vacío', icon: 'warning', confirmButtonColor: '#dc2626' })
    if (!clienteTelefono.trim()) return Swal.fire({ title: 'Teléfono requerido', text: 'Necesario para registrar la venta y el sorteo.', icon: 'warning', confirmButtonColor: '#dc2626' })
    if (montoPagadoNum < 0) return Swal.fire({ title: 'Monto inválido', text: 'No puede ser negativo.', icon: 'warning', confirmButtonColor: '#dc2626' })

    const sinVariante = cart.find(i => !i.variante_id)
    if (sinVariante) {
      Swal.fire({ 
        title: 'Falta elegir variante', 
        text: `${sinVariante.nombre} necesita que elijas talle/color antes de confirmar la venta.`,
        icon: 'warning', 
        confirmButtonColor: '#2563eb' 
      })
      return
    }

    setIsProcessing(true)
    triggerHaptic(50)
    
    try {
      const { data: ventaData, error: ventaError } = await createVenta({ 
        total_bruto: totalBruto, descuento_monto: descuentoMonto, 
        descuento_motivo: aplicarDescuento ? motivoDescuento : 'Sin descuento', 
        total_neto: totalNeto, local_id: LOCAL_ID, 
        origen: 'mostrador' 
      })
      if (ventaError) throw new Error(ventaError.message)
      const ventaId = ventaData[0].id

      for (const item of cart) {
        await createDetalleVenta({ 
          venta_id: ventaId, 
          producto_id: item.id, 
          variante_id: item.variante_id,
          cantidad: item.quantity, 
          precio_unitario: item.precio, 
          local_id: LOCAL_ID 
        })
        
        if (item.variante_id) {
          await descontarStockVariante(item.variante_id, item.quantity)
        } else {
          await updateProducto(item.id, { stock: item.stock - item.quantity })
        }
      }

      const clienteId = await crearOActualizarCliente(clienteTelefono.trim(), clienteNombre.trim() || null, LOCAL_ID, totalNeto)
      await updateVentaCliente(ventaId, clienteId)
      if (montoPagadoNum > 0) await registrarPago(ventaId, clienteId, montoPagadoNum, LOCAL_ID)

      let estadoPago = 'pagado'
      if (montoPagadoNum === 0) estadoPago = 'pendiente'
      else if (montoPagadoNum < totalNeto) estadoPago = 'parcial'
      await actualizarEstadoPagoVenta(ventaId, estadoPago)

      const fecha = new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      const ticketImg = await generarTicketImagen()

      // texto mejorado: sin emojis raros, con identidad del local
      let mensajeWhatsApp = `*${(localConfig?.nombre || 'COMPROBANTE DE VENTA').toUpperCase()}*\n`
      mensajeWhatsApp += `Venta #${ventaId} · ${fecha}\n──────────────────\n`
      cart.forEach(item => {
        mensajeWhatsApp += `${item.quantity}x ${item.nombre}`
        if (item.talle || item.color) mensajeWhatsApp += ` (${[item.talle, item.color].filter(Boolean).join(' ')})`
        mensajeWhatsApp += `\n   $${(item.precio * item.quantity).toLocaleString('es-AR')}\n`
      })
      mensajeWhatsApp += `──────────────────\n`
      if (aplicarDescuento && descuentoMonto > 0) mensajeWhatsApp += `Descuento (${motivoDescuento}): -$${descuentoMonto.toLocaleString('es-AR')}\n`
      mensajeWhatsApp += `*TOTAL: $${totalNeto.toLocaleString('es-AR')}*\n`
      if (montoPagadoNum > totalNeto) mensajeWhatsApp += `Pagado: $${montoPagadoNum.toLocaleString('es-AR')} · Vuelto: $${vuelto.toLocaleString('es-AR')}\n`
      else if (montoPagadoNum < totalNeto) mensajeWhatsApp += `Pagado: $${montoPagadoNum.toLocaleString('es-AR')} · Resta: $${resta.toLocaleString('es-AR')}\n`
      mensajeWhatsApp += `──────────────────\n`
      if (localConfig?.ticket_footer) mensajeWhatsApp += localConfig.ticket_footer
      else {
        mensajeWhatsApp += `¡Gracias por tu compra!`
        if (localConfig?.instagram) mensajeWhatsApp += `\n@${localConfig.instagram}`
      }

      setSuccessData({ ventaId, total: totalNeto, vuelto, ticketImg, mensaje: mensajeWhatsApp })
      setTelefonoSuccess(clienteTelefono)
      setShowSuccess(true)
    } catch (err) {
      Swal.fire({ title: 'Error', text: err.message, icon: 'error', confirmButtonColor: '#dc2626' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleScan = async () => {
    setIsScanning(true)
    isCancelledRef.current = false
    triggerHaptic(30)
    try {
      const codeReader = new BrowserMultiFormatReader()
      codeReaderRef.current = codeReader
      const scannedCode = await new Promise((resolve, reject) => {
        let timeoutId = setTimeout(() => { if (!isCancelledRef.current) reject(new Error('Tiempo agotado')) }, 30000)
        codeReader.decodeFromVideoDevice(undefined, 'video', (result, err) => {
          if (isCancelledRef.current) { clearTimeout(timeoutId); reject(new Error('Cancelado')); return }
          if (result) { clearTimeout(timeoutId); resolve(result.getText()) }
        })
      })
      if (scannedCode) {
        const product = productos.find(p => p.barcode === scannedCode || p.codigo_barras === scannedCode)
        if (product) { addToCart(product); Swal.fire({ title: '¡Agregado!', text: product.nombre, icon: 'success', timer: 1500, showConfirmButton: false }) }
        else Swal.fire({ title: 'No encontrado', text: `Código: ${scannedCode}`, icon: 'warning', confirmButtonColor: '#dc2626' })
      }
    } catch (err) {
      if (!isCancelledRef.current) Swal.fire({ title: 'Error al escanear', text: err.message || 'Intentá de nuevo', icon: 'error', confirmButtonColor: '#dc2626' })
    } finally {
      setIsScanning(false)
      if (codeReaderRef.current) { codeReaderRef.current.reset(); codeReaderRef.current = null }
    }
  }

  const handleCloseScan = () => {
    isCancelledRef.current = true
    setIsScanning(false)
    if (codeReaderRef.current) { codeReaderRef.current.reset(); codeReaderRef.current = null }
  }

  const getInputColorClasses = () => {
    switch(pagoStatus) {
      case 'excess': return styles.inputExcess
      case 'exact': return styles.inputExact
      case 'partial': return styles.inputPartial
      default: return styles.inputDefault
    }
  }

  const getMontoHelpText = () => {
    switch(pagoStatus) {
      case 'excess': return `✅ Vuelto: $${vuelto.toLocaleString('es-AR')}`
      case 'exact': return '✅ Pago exacto'
      case 'partial': return `⚠️ Falta: $${resta.toLocaleString('es-AR')}`
      default: return 'Ingresá el monto recibido'
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        <h2 className={styles.title}>
          <ShoppingCart className="w-8 h-8 text-green-600" /> Nueva Venta
        </h2>

        <div className={styles.grid}>
          <div className={styles.leftColumn}>
            <div className={styles.searchRow}>
              <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} />
                <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput} aria-label="Buscar producto" />
              </div>
              <div className={styles.scanWrapper}>
                <Tooltip text="Tocá para escanear códigos de barra" show={showScanTooltip && firstUse} onClose={() => setShowScanTooltip(false)} />
                <button onClick={handleScan} className={styles.scanButton} title="Escanear código de barras" aria-label="Escanear código de barras">
                  <Barcode className="w-6 h-6" />
                </button>
              </div>
            </div>

            {variantesProducto && (
              <div className={styles.variantesPanel}>
                <div className={styles.variantesHeader}>
                  <p className={styles.variantesTitle}>
                    {variantesProducto.nombre}
                    {asignandoItem && <span className={styles.asignandoLabel}>(asignando variante)</span>}
                  </p>
                  <button onClick={() => { setVariantesProducto(null); setVariantes([]); setAsignandoItem(null); setTallePanel(null) }} className={styles.closeButton}>
                    <X size={18} />
                  </button>
                </div>

                {[...new Set(variantes.map(v => v.talle).filter(Boolean))].length === 0 ? (
                  <>
                    <p className={styles.variantesHint}>Tocá el color que llevás:</p>
                    <div className={styles.colorGrid}>
                      {variantes.map(v => (
                        <button key={v.id} disabled={v.stock <= 0} onClick={() => agregarConVariante(v)}
                          className={`${styles.variantButton} ${v.stock > 0 ? styles.variantActive : styles.variantDisabled}`}>
                          <p className={styles.variantName}>{v.color || '—'}</p>
                          <p className={v.stock > 0 ? styles.stockGreen : styles.stockRed}>{v.stock > 0 ? `${v.stock} uds` : 'agotado'}</p>
                        </button>
                      ))}
                    </div>
                  </>
                ) : !tallePanel ? (
                  <>
                    <p className={styles.variantesHint}>Paso 1 de 2 — tocá el talle:</p>
                    <div className={styles.talleGrid}>
                      {[...new Set(variantes.map(v => v.talle).filter(Boolean))].map(t => {
                        const stockTalle = variantes.filter(v => v.talle === t).reduce((s, v) => s + v.stock, 0)
                        return (
                          <button key={t} disabled={stockTalle <= 0} onClick={() => setTallePanel(t)}
                            className={`${styles.variantButton} ${stockTalle > 0 ? styles.variantActive : styles.variantDisabled}`}>
                            <p className={styles.variantName}>{t}</p>
                            <p className={stockTalle > 0 ? styles.stockGreen : styles.stockRed}>{stockTalle} uds</p>
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.talleSelector}>
                      <button onClick={() => setTallePanel(null)} className={styles.backButton}>← Cambiar talle</button>
                      <p className={styles.variantesHint}>Paso 2 de 2 — color del talle <strong>{tallePanel}</strong>:</p>
                    </div>
                    <div className={styles.colorGrid}>
                      {variantes.filter(v => v.talle === tallePanel).map(v => (
                        <button key={v.id} disabled={v.stock <= 0} onClick={() => agregarConVariante(v)}
                          className={`${styles.variantButton} ${v.stock > 0 ? styles.variantActive : styles.variantDisabled}`}>
                          <p className={styles.variantName}>{v.color || '—'}</p>
                          <p className={v.stock > 0 ? styles.stockGreen : styles.stockRed}>{v.stock > 0 ? `${v.stock} uds` : 'agotado'}</p>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {!variantesProducto && filteredProducts.length > 0 && (
              <div className={styles.resultsList}>
                {filteredProducts.map(product => (
                  <div key={product.id} onClick={() => product.stock > 0 && addToCart(product)}
                    className={`${styles.resultItem} ${product.stock <= 0 ? styles.resultDisabled : styles.resultActive}`}
                    role="button" aria-label={`Agregar ${product.nombre} al carrito`}>
                    <div className={styles.resultInfo}>
                      <p className={styles.resultName} title={product.nombre}>{product.nombre}</p>
                      <p className={styles.resultMeta}>{product.categoria} | T: {product.talle || 'N/A'} | C: {product.color || 'N/A'}</p>
                      <p className={styles.resultPrice}>Stock: {product.stock} | ${Number(product.precio).toLocaleString('es-AR')}</p>
                    </div>
                    {product.stock > 0 && <div className={styles.addIcon}><Plus className="w-5 h-5" /></div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.rightColumn}>
            {cart.length === 0 ? (
              <div className={styles.emptyCart}>
                <ShoppingCart className={styles.emptyCartIcon} />
                <p className={styles.emptyCartTitle}>Carrito vacío</p>
                <p className={styles.emptyCartHint}>Buscá productos o escaneá un código</p>
                <button onClick={() => document.querySelector('input[type="text"]')?.focus()} className={styles.searchButton}>Buscar producto</button>
              </div>
            ) : (
              <>
                <div className={styles.cartCard}>
                  <h3 className={styles.cartTitle}>
                    <ShoppingCart className="w-5 h-5" /> Carrito ({cart.length})
                  </h3>
                  <div className={styles.cartItems}>
                    {cart.map(item => (
                      <div key={`${item.id}-${item.variante_id || 'legacy'}`} className={styles.cartItem}>
                        <div className={styles.itemInfo}>
                          <p className={styles.itemName} title={item.nombre}>{item.nombre}</p>
                          {(item.talle || item.color) && (
                            <p className={styles.itemVariant}>
                              {item.talle && <span className={styles.variantTag}>Talle: {item.talle}</span>}
                              {item.color && <span>Color: {item.color}</span>}
                            </p>
                          )}
                          <p className={styles.itemPrice}>${Number(item.precio).toLocaleString('es-AR')} c/u</p>
                          {!item.variante_id && (
                            <button onClick={() => abrirSelectorParaItem(item)} className={styles.assignButton}>
                              🎯 Elegir talle / color
                            </button>
                          )}
                        </div>
                        
                        <div className={styles.quantityControls}>
                          <span className={styles.quantityLabel}>Cantidad:</span>
                          <div className={styles.quantityButtons}>
                            <button onClick={() => updateQuantity(item.id, item.variante_id, item.quantity - 1)} 
                              className={styles.qtyButton} aria-label={`Restar uno a ${item.nombre}`}>
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className={styles.quantityValue}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.variante_id, item.quantity + 1)} 
                              className={styles.qtyButton} aria-label={`Sumar uno a ${item.nombre}`}>
                              <Plus className="w-3 h-3" />
                            </button>
                            <button onClick={() => removeFromCart(item.id, item.variante_id)} 
                              className={styles.deleteButton} aria-label={`Eliminar ${item.nombre}`}>
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.sectionCard}>
                  <button onClick={() => setShowClientData(!showClientData)} className={styles.sectionToggle} aria-expanded={showClientData} aria-label="Datos del cliente">
                    <h4 className={styles.sectionTitle}><User className="w-5 h-5" /> Cliente</h4>
                    {showClientData ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>
                  {showClientData && (
                    <div className={styles.sectionContent}>
                      <div className={styles.inputWrapper}>
                        <Phone className={styles.inputIcon} />
                        <input type="tel" placeholder="Teléfono (Ej: 11 1234 5678)" value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} className={styles.input} aria-label="Teléfono del cliente" />
                      </div>
                      <div className={styles.inputWrapper}>
                        <User className={styles.inputIcon} />
                        <input type="text" placeholder="Nombre (Opcional)" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} className={styles.input} aria-label="Nombre del cliente" />
                      </div>
                    </div>
                  )}
                  {!showClientData && !clienteTelefono && <p className={styles.sectionHint}>Tocá para agregar datos del cliente</p>}
                </div>

                <div className={styles.sectionCard}>
                  <div className={styles.discountWrapper}>
                    
                    <button onClick={() => setShowDiscount(!showDiscount)} className={styles.sectionToggle} aria-expanded={showDiscount} aria-label="Descuentos">
                      <h4 className={styles.sectionTitle}><Tag className="w-5 h-5" /> Descuentos</h4>
                      {showDiscount ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </button>
                  </div>
                  {showDiscount && (
                    <div className={styles.sectionContent}>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" checked={aplicarDescuento} onChange={(e) => setAplicarDescuento(e.target.checked)} className={styles.checkbox} aria-label="Aplicar descuento" />
                        <span className={styles.checkboxText}>Aplicar descuento</span>
                      </label>
                      {aplicarDescuento && (
                        <>
                          <div className={styles.discountTypeRow}>
                            <button onClick={() => setTipoDescuento('porcentaje')} className={`${styles.discountTypeButton} ${tipoDescuento === 'porcentaje' ? styles.discountTypeActive : ''}`}>%</button>
                            <button onClick={() => setTipoDescuento('monto')} className={`${styles.discountTypeButton} ${tipoDescuento === 'monto' ? styles.discountTypeActive : ''}`}>$ Fijo</button>
                          </div>
                          <div className={styles.discountInputWrapper}>
                            <span className={styles.discountPrefix}>{tipoDescuento === 'porcentaje' ? '%' : '$'}</span>
                            <input type="number" placeholder="0" value={valorDescuento} onChange={(e) => setValorDescuento(Number(e.target.value))} className={styles.input} min="0" aria-label="Valor del descuento" />
                          </div>
                          <select value={motivoDescuento} onChange={(e) => setMotivoDescuento(e.target.value)} className={styles.select} aria-label="Motivo del descuento">
                            <option value="Promoción">Promoción</option>
                            <option value="Cliente VIP">Cliente VIP</option>
                            <option value="Pequeño defecto">Pequeño defecto</option>
                            <option value="Cierre de caja">Cierre de caja</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.checkoutMobile}>
                  <div className={styles.checkoutInfo}>
                    <div className={styles.totalRow}>
                      <p className={styles.totalLabel}>Total a Pagar</p>
                      <p className={styles.totalValue}>${totalNeto.toLocaleString('es-AR')}</p>
                    </div>
                    <div className={styles.montoWrapper}>
                      <label className={styles.montoLabel}>Monto pagado</label>
                      <div className={styles.montoInputWrapper}>
                        <span className={styles.montoPrefix}>$</span>
                        <input ref={montoInputRef} type="number" placeholder="0.00" value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)}
                          className={`${styles.montoInput} ${getInputColorClasses()}`}
                          min="0" step="0.01" aria-label="Monto pagado" />
                      </div>
                      <p className={`${styles.montoHelp} ${pagoStatus === 'excess' ? styles.helpBlue : pagoStatus === 'exact' ? styles.helpGreen : pagoStatus === 'partial' ? styles.helpYellow : styles.helpGray}`}>
                        {getMontoHelpText()}
                      </p>
                    </div>
                    {vuelto > 0 && <p className={styles.vueltoText}>💵 Vuelto a entregar: ${vuelto.toLocaleString('es-AR')}</p>}
                    {resta > 0 && pagoStatus === 'partial' && <p className={styles.restaText}>Resta: ${resta.toLocaleString('es-AR')}</p>}
                  </div>
                  <button onClick={handleCheckout} disabled={isProcessing}
                    className={`${styles.checkoutButton} ${isProcessing ? styles.checkoutDisabled : ''}`}
                    aria-label="Confirmar">
                    {isProcessing ? 'Procesando...' : <><DollarSign className="w-6 h-6" /> Confirmar</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {cart.length > 0 && (
          <div className={styles.checkoutDesktop}>
            <div className={styles.checkoutDesktopContent}>
              <div>
                <p className={styles.totalLabel}>Total a Pagar</p>
                <p className={styles.totalValueLarge}>${totalNeto.toLocaleString('es-AR')}</p>
                {vuelto > 0 && <p className={styles.vueltoText}>💵 Vuelto: ${vuelto.toLocaleString('es-AR')}</p>}
                {resta > 0 && <p className={styles.restaText}>Resta: ${resta.toLocaleString('es-AR')}</p>}
              </div>
              <div className={styles.montoDesktopWrapper}>
                <label className={styles.montoLabel}>Monto pagado</label>
                <div className={styles.montoInputWrapper}>
                  <span className={styles.montoPrefix}>$</span>
                  <input type="number" placeholder="0" value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)}
                    className={`${styles.montoInput} ${getInputColorClasses()}`}
                    min="0" step="0.01" />
                </div>
                <p className={`${styles.montoHelp} ${pagoStatus === 'excess' ? styles.helpBlue : pagoStatus === 'exact' ? styles.helpGreen : styles.helpGray}`}>{getMontoHelpText()}</p>
              </div>
              <button onClick={handleCheckout} disabled={isProcessing}
                className={`${styles.checkoutButtonDesktop} ${isProcessing ? styles.checkoutDisabled : ''}`}>
                {isProcessing ? 'Procesando...' : <><DollarSign className="w-6 h-6" /> Confirmar</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============ TICKET VISUAL (oculto: lo usan html2canvas y la impresión) ============ */}
      <div ref={ticketRef} className={styles.ticketContainer}>
        <div className={styles.ticketHeader}>
          <h3>{localConfig?.nombre?.toUpperCase() || 'COMPROBANTE DE VENTA'}</h3>
          <p>{new Date().toLocaleString('es-AR')}</p>
        </div>
        <div className={styles.ticketBody}>
          {cart.map((item, i) => (
            <div key={i} className={styles.ticketItem}>
              <p className={styles.ticketItemName}>{item.quantity}x {item.nombre}</p>
              {(item.talle || item.color) && <p className={styles.ticketItemVariant}>{item.talle} {item.color}</p>}
              <p className={styles.ticketItemPrice}>${(item.precio * item.quantity).toLocaleString('es-AR')}</p>
            </div>
          ))}
        </div>
        <div className={styles.ticketFooter}>
          <div className={styles.ticketTotalRow}>
            <span>Subtotal:</span>
            <span>${totalBruto.toLocaleString('es-AR')}</span>
          </div>
          {aplicarDescuento && descuentoMonto > 0 && (
            <div className={styles.ticketTotalRow}>
              <span>Descuento ({motivoDescuento}):</span>
              <span>-${descuentoMonto.toLocaleString('es-AR')}</span>
            </div>
          )}
          <div className={styles.ticketTotalRowLarge}>
            <span>TOTAL:</span>
            <span>${totalNeto.toLocaleString('es-AR')}</span>
          </div>
          {vuelto > 0 && (
            <>
              <div className={styles.ticketTotalRow}>
                <span>Pagado:</span>
                <span>${montoPagadoNum.toLocaleString('es-AR')}</span>
              </div>
              <div className={styles.ticketTotalRow}>
                <span>Vuelto:</span>
                <span>${vuelto.toLocaleString('es-AR')}</span>
              </div>
            </>
          )}
          {localConfig?.instagram && (
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#6b7280', marginTop: '0.75rem' }}>
              @{localConfig.instagram}
            </p>
          )}
        </div>
      </div>

      {/* ============ MODAL DE ÉXITO CON CANALES DE ENTREGA ============ */}
      {showSuccess && successData && (
        <div className={styles.successOverlay}>
          <div className={styles.successModal}>
            <CheckCircle2 size={48} className={styles.successIcon} />
            <h3 className={styles.successTitle}>¡Venta registrada!</h3>
            <p className={styles.successTotal}>Total: <strong>${successData.total.toLocaleString('es-AR')}</strong></p>
            {successData.vuelto > 0 && (
              <p className={styles.successVuelto}>💵 Vuelto a entregar: ${successData.vuelto.toLocaleString('es-AR')}</p>
            )}

            <div className={styles.successActions}>
              <button onClick={imprimirTicket} className={`${styles.actionBtn} ${styles.actionBtnPrint}`}>
                🖨️ Imprimir ticket / PDF
              </button>
              <button onClick={compartirImagen} className={`${styles.actionBtn} ${styles.actionBtnShare}`}>
                📤 WhatsApp con imagen
              </button>
              <div className={styles.successPhoneRow}>
                <input
                  type="tel"
                  placeholder="Teléfono del cliente"
                  value={telefonoSuccess}
                  onChange={(e) => setTelefonoSuccess(e.target.value)}
                  className={styles.successPhoneInput}
                />
                <button onClick={enviarTextoWhatsApp} className={`${styles.actionBtn} ${styles.actionBtnText}`}>
                  📝 Texto
                </button>
              </div>
              <button onClick={cerrarSuccess} className={`${styles.actionBtn} ${styles.actionBtnClose}`}>
                ✅ Nueva venta
              </button>
            </div>
          </div>
        </div>
      )}

      {isScanning && (
        <div className={styles.scanOverlay}>
          <div className={styles.scanContainer}>
            <div className={styles.scanVideo}>
              <video id="video" className={styles.videoElement} autoPlay playsInline />
              <div className={styles.scanLine} />
            </div>
            <div className={styles.scanFooter}>
              <h3 className={styles.scanTitle}>Escaneá el código</h3>
              <button onClick={handleCloseScan} className={styles.cancelScanButton}>
                <X className="w-5 h-5 inline mr-2" /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesForm