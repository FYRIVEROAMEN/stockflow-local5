import { useState, useEffect } from 'react'
import { Download, TrendingUp, Package, AlertTriangle, ArrowRight, ChevronDown, ShoppingCart } from 'lucide-react'
import { getVentas, getProductosActivos, getClientesConDeuda, getGastos } from '../services/api'
import Swal from 'sweetalert2'
import styles from './MetricsView.module.css'

function MetricsView({ onNavigate }) {
  const ahora0 = new Date()
  const [loading, setLoading] = useState(true)
  const [showDetalle, setShowDetalle] = useState(false)

  // 🪗 colapsables: abiertas en desktop, cerradas en mobile
  const [abiertas, setAbiertas] = useState(() => {
    const mobile = typeof window !== 'undefined' && window.innerWidth < 768
    return { productos: !mobile, clientes: !mobile, stock: !mobile }
  })
  const toggle = (k) => setAbiertas(a => ({ ...a, [k]: !a[k] }))

  const [mesSeleccionado, setMesSeleccionado] = useState(
    `${ahora0.getFullYear()}-${String(ahora0.getMonth() + 1).padStart(2, '0')}`
  )
  const [metrics, setMetrics] = useState({
    ventasMes: 0, totalVentas: 0, totalDescuentos: 0, ticketPromedio: 0,
    cmv: 0, gastosMes: 0, gananciaBruta: 0, gananciaNeta: 0, unidadesSinCosto: 0,
    valorInventarioCosto: 0, valorInventarioVenta: 0, totalUnidades: 0, deudaTotal: 0,
    topProductos: [], topClientes: [], stockBajo: [],
    ventasLista: [], productosLista: []
  })

  const [anio, mes] = mesSeleccionado.split('-').map(Number)
  const nombreMesRaw = new Date(anio, mes - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const nombreMes = nombreMesRaw.charAt(0).toUpperCase() + nombreMesRaw.slice(1)

  const money = (n) => {
    const num = Number(n || 0)
    const abs = Math.abs(num).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return num < 0 ? `-$${abs}` : `$${abs}`
  }

  const moneyShort = (n) => {
    const num = Number(n || 0)
    const abs = Math.abs(num)
    const sign = num < 0 ? '-' : ''
    if (abs >= 1000000) return `${sign}$${(abs / 1000000).toLocaleString('es-AR', { maximumFractionDigits: 2 })} M`
    return money(n)
  }

  useEffect(() => { fetchMetrics() }, [mesSeleccionado])

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const { data: ventasData } = await getVentas()
      const ventas = ventasData || []
      const { data: productosData } = await getProductosActivos()
      const productos = productosData || []
      const { data: deudaData } = await getClientesConDeuda()
      const deudaTotal = (deudaData || []).reduce((s, c) => s + Number(c.deuda_total || 0), 0)
      const { data: gastosData } = await getGastos()

      const primerDia = new Date(anio, mes - 1, 1)
      const ultimoDia = new Date(anio, mes, 1)

      const ventasDelMes = ventas.filter(v => {
        const f = new Date(v.fecha)
        return f >= primerDia && f < ultimoDia
      })

      const totalVentasMes = ventasDelMes.reduce((s, v) => s + Number(v.total_neto || v.total_bruto || 0), 0)
      const totalDescuentos = ventasDelMes.reduce((s, v) => s + Number(v.descuento_monto || 0), 0)
      const ticketPromedio = ventasDelMes.length > 0 ? totalVentasMes / ventasDelMes.length : 0

      let cmv = 0
      let unidadesSinCosto = 0
      ventasDelMes.forEach(v => {
        (v.detalle_ventas || []).forEach(d => {
          const costoUnit = Number(d.productos?.costo || 0)
          if (costoUnit <= 0) unidadesSinCosto += d.cantidad
          cmv += d.cantidad * costoUnit
        })
      })

      const gastosMes = (gastosData || [])
        .filter(g => (g.fecha || '').startsWith(mesSeleccionado))
        .reduce((s, g) => s + Number(g.monto || 0), 0)

      const gananciaBruta = totalVentasMes - cmv
      const gananciaNeta = gananciaBruta - gastosMes

      const valorInventarioCosto = productos.reduce((s, p) => s + Number(p.costo || 0) * Number(p.stock || 0), 0)
      const valorInventarioVenta = productos.reduce((s, p) => s + Number(p.precio || 0) * Number(p.stock || 0), 0)
      const totalUnidades = productos.reduce((s, p) => s + Number(p.stock || 0), 0)

      const porProducto = {}
      ventasDelMes.forEach(v => {
        (v.detalle_ventas || []).forEach(d => {
          const nombre = d.productos?.nombre || 'Producto eliminado'
          const costoUnit = Number(d.productos?.costo || 0)
          if (!porProducto[nombre]) porProducto[nombre] = { cantidad: 0, total: 0, ganancia: 0 }
          porProducto[nombre].cantidad += d.cantidad
          porProducto[nombre].total += Number(d.precio_unitario) * d.cantidad
          porProducto[nombre].ganancia += (Number(d.precio_unitario) - costoUnit) * d.cantidad
        })
      })
      const topProductos = Object.entries(porProducto)
        .map(([nombre, d]) => ({ nombre, ...d }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)

      const porCliente = {}
      ventasDelMes.forEach(v => {
        if (v.cliente_id) {
          const nombre = v.clientes?.nombre || `Cliente ${v.clientes?.telefono || 'Anónimo'}`
          if (!porCliente[nombre]) porCliente[nombre] = { cantidad: 0, total: 0 }
          porCliente[nombre].cantidad += 1
          porCliente[nombre].total += Number(v.total_neto || v.total_bruto || 0)
        }
      })
      const topClientes = Object.entries(porCliente)
        .map(([nombre, d]) => ({ nombre, ...d }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)

      const stockBajo = productos.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 6)

      setMetrics({
        ventasMes: totalVentasMes, totalVentas: ventasDelMes.length, totalDescuentos, ticketPromedio,
        cmv, gastosMes, gananciaBruta, gananciaNeta, unidadesSinCosto,
        valorInventarioCosto, valorInventarioVenta, totalUnidades, deudaTotal,
        topProductos, topClientes, stockBajo,
        ventasLista: ventasDelMes, productosLista: productos
      })
    } catch (err) {
      console.error('Error al cargar métricas:', err)
    }
    setLoading(false)
  }

  const margenNeto = metrics.ventasMes > 0 ? (metrics.gananciaNeta / metrics.ventasMes) * 100 : 0
  const margenBruto = metrics.ventasMes > 0 ? (metrics.gananciaBruta / metrics.ventasMes) * 100 : 0

  const descargarCSV = (nombre, headers, rows) => {
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = nombre
    link.click()
  }

  const exportarVentasCSV = () => {
    if (metrics.ventasLista.length === 0) {
      Swal.fire({ title: 'Sin ventas', text: 'No hay ventas en el mes seleccionado', icon: 'info', timer: 1500, showConfirmButton: false })
      return
    }
    descargarCSV(
      `ventas_${mesSeleccionado}.csv`,
      ['Fecha', 'Total Bruto', 'Descuento', 'Total Neto', 'Estado Pago', 'Cliente'],
      metrics.ventasLista.map(v => [
        new Date(v.fecha).toLocaleDateString('es-AR'),
        Number(v.total_bruto || 0).toFixed(2),
        Number(v.descuento_monto || 0).toFixed(2),
        Number(v.total_neto || 0).toFixed(2),
        v.estado_pago,
        `"${(v.clientes?.nombre || v.clientes?.telefono || 'Consumidor final').replace(/"/g, "'")}"`
      ])
    )
  }

  const exportarInventarioCSV = () => {
    descargarCSV(
      `inventario_${mesSeleccionado}.csv`,
      ['Nombre', 'Categoría', 'Talle', 'Color', 'Stock', 'Costo', 'Precio', 'Valor Stock (costo)'],
      metrics.productosLista.map(p => [
        `"${(p.nombre || '').replace(/"/g, "'")}"`,
        `"${(p.categoria || '').replace(/"/g, "'")}"`,
        `"${(p.talle || '').replace(/"/g, "'")}"`,
        `"${(p.color || '').replace(/"/g, "'")}"`,
        p.stock,
        Number(p.costo || 0).toFixed(2),
        Number(p.precio || 0).toFixed(2),
        (Number(p.costo || 0) * Number(p.stock || 0)).toFixed(2)
      ])
    )
  }

  // resúmenes de las cabeceras colapsables (el dato clave SIN abrir)
  const resumenProductos = metrics.topProductos.length
    ? `#1 ${metrics.topProductos[0].nombre} · ${moneyShort(metrics.topProductos[0].total)}`
    : 'sin ventas este mes'
  const resumenClientes = metrics.topClientes.length
    ? `#1 ${metrics.topClientes[0].nombre} · ${moneyShort(metrics.topClientes[0].total)}`
    : 'sin clientes este mes'
  const resumenStock = metrics.stockBajo.length
    ? `${metrics.stockBajo.length} producto(s) · mín ${metrics.stockBajo[0]?.stock ?? 0} uds`
    : 'todo en orden'

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.loadingInner}>
          <div className={`${styles.loadingBar} ${styles.loadingTitle}`} />
          <div className={`${styles.loadingBar} ${styles.loadingHero}`} />
          <div className={`${styles.loadingBar} ${styles.loadingCard}`} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      {/* ============ HEADER ============ */}
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Métricas</h2>
          <p className={styles.subtitle}>{nombreMes}</p>
        </div>
        <input
          type="month"
          value={mesSeleccionado}
          onChange={(e) => setMesSeleccionado(e.target.value)}
          className={styles.monthInput}
        />
      </div>

      {/* ============ HERO GANANCIA NETA ============ */}
      <div className={`${styles.hero} ${metrics.gananciaNeta >= 0 ? styles.heroOk : styles.heroBad}`}>
        <div className={styles.heroTop}>
          <p className={styles.heroLabel}>GANANCIA NETA</p>
          <button onClick={() => onNavigate('gastos')} className={styles.heroLink}>
            Ver gastos <ArrowRight size={14} />
          </button>
        </div>
        <p className={styles.heroValue}>{money(metrics.gananciaNeta)}</p>
        <p className={styles.heroMargin}>margen {margenNeto.toFixed(0)}% sobre ventas</p>

        <button onClick={() => setShowDetalle(!showDetalle)} className={styles.heroDetailBtn}>
          {showDetalle ? 'Ocultar detalle' : 'Ver detalle'}
          <ChevronDown size={16} className={showDetalle ? styles.chevOpen : ''} />
        </button>

        {showDetalle && (
          <div className={styles.heroDetail}>
            <div className={styles.dRow}>
              <span className={styles.dLabel}>Ventas (neto)</span>
              <span className={styles.dValue}>{money(metrics.ventasMes)}</span>
            </div>
            <div className={styles.dRow}>
              <span className={styles.dLabel}>(−) Mercadería vendida</span>
              <span className={`${styles.dValue} ${styles.dNeg}`}>−{money(metrics.cmv)}</span>
            </div>
            <div className={`${styles.dRow} ${styles.dDiv}`}>
              <span className={`${styles.dLabel} ${styles.dLabelBold}`}>= Ganancia bruta</span>
              <span className={`${styles.dValue} ${metrics.gananciaBruta >= 0 ? styles.dPos : styles.dNeg}`}>
                {money(metrics.gananciaBruta)} <span className={styles.dSmall}>({margenBruto.toFixed(0)}%)</span>
              </span>
            </div>
            <div className={styles.dRow}>
              <span className={styles.dLabel}>(−) Gastos del mes</span>
              <span className={`${styles.dValue} ${styles.dNeg}`}>−{money(metrics.gastosMes)}</span>
            </div>
            <div className={styles.dRow}>
              <span className={styles.dLabel}>📦 Ganancia potencial del stock</span>
              <span className={`${styles.dValue} ${styles.dPurple}`} title={`Costo: ${money(metrics.valorInventarioCosto)}`}>
                {money(metrics.valorInventarioVenta - metrics.valorInventarioCosto)}
              </span>
            </div>
            {metrics.totalDescuentos > 0 && (
              <p className={styles.dSmall}>🏷️ Descuentos otorgados: {money(metrics.totalDescuentos)} (ya descontados de las ventas)</p>
            )}
          </div>
        )}

        {metrics.unidadesSinCosto > 0 && (
          <p className={styles.heroWarn}>
            <AlertTriangle size={14} />
            {metrics.unidadesSinCosto} uds vendidas sin costo cargado — la ganancia puede estar inflada.
          </p>
        )}
      </div>

      {/* ============ KPIs (grilla, todos visibles) ============ */}
      <div className={styles.kpiGrid}>
        <button onClick={() => onNavigate('history')} className={`${styles.kpiCard} ${styles.kpiBlue}`}>
          <p className={styles.kpiLabel}><ShoppingCart size={14} /> Ventas</p>
          <p className={styles.kpiValue} title={money(metrics.ventasMes)}>{moneyShort(metrics.ventasMes)}</p>
          <p className={styles.kpiHint}>{metrics.totalVentas} transacciones</p>
        </button>
        <button onClick={() => onNavigate('history')} className={`${styles.kpiCard} ${styles.kpiGreen}`}>
          <p className={styles.kpiLabel}><TrendingUp size={14} /> Ticket promedio</p>
          <p className={styles.kpiValue} title={money(metrics.ticketPromedio)}>{moneyShort(metrics.ticketPromedio)}</p>
          <p className={styles.kpiHint}>por venta</p>
        </button>
        <button onClick={() => onNavigate('clientes')} className={`${styles.kpiCard} ${metrics.deudaTotal > 0 ? styles.kpiRed : styles.kpiGray}`}>
          <p className={styles.kpiLabel}><AlertTriangle size={14} /> Deuda pendiente</p>
          <p className={styles.kpiValue} title={money(metrics.deudaTotal)}>{moneyShort(metrics.deudaTotal)}</p>
          <p className={styles.kpiHint}>{metrics.deudaTotal > 0 ? 'por cobrar' : 'todo al día'}</p>
        </button>
        <div className={`${styles.kpiCard} ${styles.kpiCardStatic} ${styles.kpiAmber}`}>
          <p className={styles.kpiLabel}><Package size={14} /> Unidades en stock</p>
          <p className={styles.kpiValue}>{metrics.totalUnidades}</p>
          <p className={styles.kpiHint}>en {metrics.productosLista.length} productos</p>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardStatic} ${styles.kpiPurple}`}>
          <p className={styles.kpiLabel}>Inventario (costo)</p>
          <p className={styles.kpiValue}>{moneyShort(metrics.valorInventarioCosto)}</p>
          <p className={styles.kpiHint}>lo que pagaste</p>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardStatic} ${styles.kpiIndigo}`}>
          <p className={styles.kpiLabel}>Valor de venta</p>
          <p className={styles.kpiValue}>{moneyShort(metrics.valorInventarioVenta)}</p>
          <p className={styles.kpiHint}>potencial si vendés todo</p>
        </div>
      </div>

      {/* ============ TOP PRODUCTOS (colapsable) ============ */}
      <section className={styles.secCard}>
        <div className={styles.secHeader}>
          <button onClick={() => toggle('productos')} className={styles.secToggle}>
            <span className={styles.secTitle}>Top productos del mes</span>
            <span className={styles.secSummary}>{resumenProductos}</span>
            <ChevronDown size={18} className={`${styles.secChevron} ${abiertas.productos ? styles.secChevronOpen : ''}`} />
          </button>
        </div>
        {abiertas.productos && (
          <div className={styles.secBody}>
            {metrics.topProductos.length > 0 ? metrics.topProductos.map((prod, idx) => (
              <div key={idx} className={styles.topRow}>
                <div className={styles.topLeft}>
                  <span className={styles.topRank}>#{idx + 1}</span>
                  <div className={styles.topInfo}>
                    <p className={styles.topName}>{prod.nombre}</p>
                    <p className={styles.topMeta}>
                      {prod.cantidad} uds · ganancia <span className={styles.topMetaGain}>{moneyShort(prod.ganancia)}</span>
                    </p>
                  </div>
                </div>
                <p className={`${styles.topValue} ${styles.topValueGreen}`}>{moneyShort(prod.total)}</p>
              </div>
            )) : (
              <p className={styles.topEmpty}>Sin ventas este mes</p>
            )}
          </div>
        )}
      </section>

      {/* ============ TOP CLIENTES (colapsable) ============ */}
      <section className={styles.secCard}>
        <div className={styles.secHeader}>
          <button onClick={() => toggle('clientes')} className={styles.secToggle}>
            <span className={styles.secTitle}>Top clientes del mes</span>
            <span className={styles.secSummary}>{resumenClientes}</span>
            <ChevronDown size={18} className={`${styles.secChevron} ${abiertas.clientes ? styles.secChevronOpen : ''}`} />
          </button>
        </div>
        {abiertas.clientes && (
          <div className={styles.secBody}>
            {metrics.topClientes.length > 0 ? metrics.topClientes.map((cliente, idx) => (
              <div key={idx} className={styles.topRow}>
                <div className={styles.topLeft}>
                  <div className={styles.topAvatar}>{cliente.nombre.charAt(0).toUpperCase()}</div>
                  <div className={styles.topInfo}>
                    <p className={styles.topName}>{cliente.nombre}</p>
                    <p className={styles.topMeta}>{cliente.cantidad} compras</p>
                  </div>
                </div>
                <p className={`${styles.topValue} ${styles.topValueBlue}`}>{moneyShort(cliente.total)}</p>
              </div>
            )) : (
              <p className={styles.topEmpty}>Sin clientes este mes</p>
            )}
          </div>
        )}
      </section>

      {/* ============ STOCK BAJO (colapsable + Ver todo) ============ */}
      <section className={styles.secCard}>
        <div className={styles.secHeader}>
          <button onClick={() => toggle('stock')} className={styles.secToggle}>
            <span className={styles.secTitle}>Stock bajo</span>
            <span className={styles.secSummary}>{resumenStock}</span>
            <ChevronDown size={18} className={`${styles.secChevron} ${abiertas.stock ? styles.secChevronOpen : ''}`} />
          </button>
          <button onClick={() => onNavigate('stockbajo')} className={styles.secLink}>
            Ver todo <ArrowRight size={14} />
          </button>
        </div>
        {abiertas.stock && (
          <div className={styles.secBody}>
            {metrics.stockBajo.length > 0 ? (
              <div className={styles.stockGrid}>
                {metrics.stockBajo.map((prod, idx) => (
                  <div key={idx} className={styles.stockChip}>
                    <p className={styles.stockChipName}>{prod.nombre}</p>
                    <span className={`${styles.stockBadge} ${prod.stock === 0 ? styles.stockBadgeOut : styles.stockBadgeLow}`}>
                      {prod.stock === 0 ? 'Agotado' : `${prod.stock} uds`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.stockOk}>Todo el stock en orden</p>
            )}
          </div>
        )}
      </section>

      {/* ============ EXPORTS ============ */}
      <div className={styles.exportRow}>
        <button onClick={exportarVentasCSV} className="btn btn-success flex items-center gap-2">
          <Download size={16} /> Ventas del mes
        </button>
        <button onClick={exportarInventarioCSV} className="btn btn-primary flex items-center gap-2">
          <Download size={16} /> Inventario
        </button>
      </div>
    </div>
  )
}

export default MetricsView