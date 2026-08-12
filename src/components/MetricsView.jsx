import { useState, useEffect } from 'react'
import { Download, TrendingUp, Package, AlertTriangle, ArrowRight, ChevronDown, Users, ShoppingCart } from 'lucide-react'
import { getVentas, getProductosActivos, getClientesConDeuda, getGastos } from '../services/api'
import Swal from 'sweetalert2'

function MetricsView({ onNavigate }) {
  const ahora0 = new Date()
  const [loading, setLoading] = useState(true)
  const [showDetalle, setShowDetalle] = useState(false)
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

  // Formato completo con separador de miles
  const money = (n) => {
    const num = Number(n || 0)
    const abs = Math.abs(num).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return num < 0 ? `-$${abs}` : `$${abs}`
  }

  // Formato compacto para cards chicas (mobile): $2,95 M
  const moneyShort = (n) => {
    const num = Number(n || 0)
    const abs = Math.abs(num)
    const sign = num < 0 ? '-' : ''
    if (abs >= 1000000) return `${sign}$${(abs / 1000000).toLocaleString('es-AR', { maximumFractionDigits: 2 })} M`
    return money(n)
  }

  useEffect(() => {
    fetchMetrics()
  }, [mesSeleccionado])

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

  if (loading) {
    return (
      <div className="p-8 text-center min-h-[50vh] flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-md mx-auto">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div className="h-40 bg-gray-200 rounded w-full"></div>
          <div className="h-24 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-5">

      {/* HEADER: apilado en mobile, el input NUNCA se sale */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Métricas</h2>
          <p className="text-sm text-gray-500">{nombreMes}</p>
        </div>
        <input
          type="month"
          value={mesSeleccionado}
          onChange={(e) => setMesSeleccionado(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border-2 border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* HERO: GANANCIA NETA */}
      <div className={`rounded-2xl border-2 p-4 sm:p-6 ${metrics.gananciaNeta >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-bold whitespace-nowrap ${metrics.gananciaNeta >= 0 ? 'text-green-800' : 'text-red-800'}`}>
             GANANCIA NETA
          </p>
          <button
            onClick={() => onNavigate('gastos')}
            className="text-xs text-blue-600 font-semibold flex items-center gap-1 whitespace-nowrap"
          >
            Ver gastos <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className={`text-3xl sm:text-4xl font-bold mt-1 whitespace-nowrap ${metrics.gananciaNeta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          {money(metrics.gananciaNeta)}
        </p>
        <p className={`text-xs mt-1 ${metrics.gananciaNeta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          margen {margenNeto.toFixed(0)}% sobre ventas
        </p>

        <button
          onClick={() => setShowDetalle(!showDetalle)}
          className="mt-3 w-full py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 flex items-center justify-center gap-1 active:scale-95 transition"
        >
          {showDetalle ? 'Ocultar detalle' : 'Ver detalle'}
          <ChevronDown className={`w-4 h-4 transition-transform ${showDetalle ? 'rotate-180' : ''}`} />
        </button>

        {showDetalle && (
          <div className="mt-3 bg-white rounded-xl border border-gray-200 p-3 space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 text-sm">
              <span className="text-gray-600">Ventas (neto)</span>
              <span className="font-bold text-gray-900 whitespace-nowrap">{money(metrics.ventasMes)}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 text-sm">
              <span className="text-gray-600">(−) Mercadería vendida</span>
              <span className="font-bold text-red-700 whitespace-nowrap">−{money(metrics.cmv)}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 text-sm pt-2 border-t border-dashed border-gray-200">
              <span className="font-bold text-gray-800">= Ganancia bruta</span>
              <span className={`font-bold whitespace-nowrap ${metrics.gananciaBruta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {money(metrics.gananciaBruta)} <span className="text-xs text-gray-500 font-normal">({margenBruto.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 text-sm">
              <span className="text-gray-600">(−) Gastos del mes</span>
              <span className="font-bold text-red-700 whitespace-nowrap">−{money(metrics.gastosMes)}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-600">📦 Ganancia potencial del stock</span>
              <span className="font-bold text-purple-700 whitespace-nowrap" title={`Costo: ${money(metrics.valorInventarioCosto)}`}>
                {money(metrics.valorInventarioVenta - metrics.valorInventarioCosto)}
              </span>
            </div>
            {metrics.totalDescuentos > 0 && (
              <p className="text-xs text-pink-600 pt-1 border-t border-gray-100">
                🏷️ Descuentos otorgados: {money(metrics.totalDescuentos)} (ya descontados de las ventas)
              </p>
            )}
          </div>
        )}

        {metrics.unidadesSinCosto > 0 && (
          <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {metrics.unidadesSinCosto} uds vendidas sin costo cargado — la ganancia puede estar inflada.
          </p>
        )}
      </div>

      {/* KPIs COMPACTOS */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onNavigate('history')} className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-left hover:shadow-md transition active:scale-95 min-w-0">
          <p className="text-xs text-blue-700 font-medium flex items-center gap-1"><ShoppingCart className="w-3.5 h-3.5" /> Ventas</p>
          <p className="text-base sm:text-xl font-bold text-blue-900 whitespace-nowrap" title={money(metrics.ventasMes)}>{moneyShort(metrics.ventasMes)}</p>
          <p className="text-[11px] text-blue-600">{metrics.totalVentas} transacciones</p>
        </button>

        <button onClick={() => onNavigate('history')} className="bg-green-50 border border-green-200 rounded-2xl p-3 text-left hover:shadow-md transition active:scale-95 min-w-0">
          <p className="text-xs text-green-700 font-medium flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Ticket promedio</p>
          <p className="text-base sm:text-xl font-bold text-green-900 whitespace-nowrap" title={money(metrics.ticketPromedio)}>{moneyShort(metrics.ticketPromedio)}</p>
          <p className="text-[11px] text-green-600">por venta</p>
        </button>

        <button onClick={() => onNavigate('clientes')} className={`rounded-2xl p-3 text-left border hover:shadow-md transition active:scale-95 min-w-0 ${metrics.deudaTotal > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-xs font-medium flex items-center gap-1 ${metrics.deudaTotal > 0 ? 'text-red-700' : 'text-gray-600'}`}>
            <AlertTriangle className="w-3.5 h-3.5" /> Deuda pendiente
          </p>
          <p className={`text-base sm:text-xl font-bold whitespace-nowrap ${metrics.deudaTotal > 0 ? 'text-red-900' : 'text-gray-700'}`} title={money(metrics.deudaTotal)}>{moneyShort(metrics.deudaTotal)}</p>
          <p className={`text-[11px] ${metrics.deudaTotal > 0 ? 'text-red-600' : 'text-gray-500'}`}>{metrics.deudaTotal > 0 ? 'por cobrar' : 'todo al día'}</p>
        </button>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 min-w-0">
  <p className="text-xs text-amber-700 font-medium flex items-center gap-1"><Package className="w-3.5 h-3.5" /> Unidades en stock</p>
  <p className="text-base sm:text-xl font-bold text-amber-900 whitespace-nowrap">{metrics.totalUnidades}</p>
  <p className="text-[11px] text-amber-600">en {metrics.productosLista.length} productos</p>
</div>

<div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 min-w-0">
  <p className="text-xs text-purple-700 font-medium">Inventario (costo)</p>
  <p className="text-base sm:text-xl font-bold text-purple-900 whitespace-nowrap">{moneyShort(metrics.valorInventarioCosto)}</p>
  <p className="text-[11px] text-purple-600">lo que pagaste</p>
</div>

<div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 min-w-0">
  <p className="text-xs text-indigo-700 font-medium">Valor de venta</p>
  <p className="text-base sm:text-xl font-bold text-indigo-900 whitespace-nowrap">{moneyShort(metrics.valorInventarioVenta)}</p>
  <p className="text-[11px] text-indigo-600">potencial si vendés todo</p>
</div>
      </div>

      {/* TOPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section>
          <h3 className="text-base font-bold text-gray-800 mb-2">Top productos del mes</h3>
          <div className="space-y-2">
            {metrics.topProductos.length > 0 ? metrics.topProductos.map((prod, idx) => (
              <div key={idx} className="flex justify-between items-center gap-2 p-3 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg font-bold text-gray-300">#{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{prod.nombre}</p>
                    <p className="text-[11px] text-gray-500">
                      {prod.cantidad} uds · ganancia <span className="text-green-600 font-semibold">{moneyShort(prod.ganancia)}</span>
                    </p>
                  </div>
                </div>
                <p className="font-bold text-green-700 text-sm whitespace-nowrap">{moneyShort(prod.total)}</p>
              </div>
            )) : (
              <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-xl text-sm">Sin ventas este mes</p>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-base font-bold text-gray-800 mb-2">Top clientes del mes</h3>
          <div className="space-y-2">
            {metrics.topClientes.length > 0 ? metrics.topClientes.map((cliente, idx) => (
              <div key={idx} className="flex justify-between items-center gap-2 p-3 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                    {cliente.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{cliente.nombre}</p>
                    <p className="text-[11px] text-gray-500">{cliente.cantidad} compras</p>
                  </div>
                </div>
                <p className="font-bold text-blue-700 text-sm whitespace-nowrap">{moneyShort(cliente.total)}</p>
              </div>
            )) : (
              <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-xl text-sm">Sin clientes este mes</p>
            )}
          </div>
        </section>
      </div>

      {/* STOCK BAJO */}
      <section>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-bold text-gray-800">Stock bajo</h3>
          <button onClick={() => onNavigate('dashboard')} className="text-xs text-blue-600 font-semibold flex items-center gap-1 whitespace-nowrap">
            Ver todo <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {metrics.stockBajo.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {metrics.stockBajo.map((prod, idx) => (
              <div key={idx} className="bg-white p-2.5 rounded-xl border border-red-200 flex justify-between items-center gap-1 min-w-0">
                <p className="font-semibold text-gray-800 text-xs truncate">{prod.nombre}</p>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${prod.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                  {prod.stock === 0 ? 'Agotado' : `${prod.stock} uds`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-green-700 py-4 bg-green-50 rounded-xl border border-green-200 text-sm font-medium">Todo el stock en orden</p>
        )}
      </section>

      {/* EXPORTS REALES */}
      <div className="flex flex-wrap gap-3 pb-8">
        <button onClick={exportarVentasCSV} className="btn btn-success flex items-center gap-2">
          <Download className="w-4 h-4" /> Ventas del mes
        </button>
        <button onClick={exportarInventarioCSV} className="btn btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" /> Inventario
        </button>
      </div>
    </div>
  )
}

export default MetricsView