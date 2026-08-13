import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const LOCAL_ID = import.meta.env.VITE_LOCAL_ID || 1

const api = axios.create({
  baseURL: `${SUPABASE_URL}/rest/v1`,
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
})

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ==========================================
// PRODUCTOS
// ==========================================
export const getProductos = () => api.get(`/productos?local_id=eq.${LOCAL_ID}&order=created_at.desc`)
export const getProductoById = (id) => api.get(`/productos?id=eq.${id}&local_id=eq.${LOCAL_ID}`)
export const createProducto = (data) => api.post('/productos', { ...data, local_id: LOCAL_ID })
export const updateProducto = (id, data) => api.patch(`/productos?id=eq.${id}&local_id=eq.${LOCAL_ID}`, data)
export const deleteProducto = (id) => api.delete(`/productos?id=eq.${id}&local_id=eq.${LOCAL_ID}`)
export const getProductosActivos = () => api.get(`/productos?local_id=eq.${LOCAL_ID}&activo=eq.true&order=created_at.desc`)
export const getProductosInactivos = () => api.get(`/productos?local_id=eq.${LOCAL_ID}&activo=eq.false&order=created_at.desc`)
export const deactivateProducto = (id) => api.patch(`/productos?id=eq.${id}&local_id=eq.${LOCAL_ID}`, { activo: false })
export const reactivateProducto = (id) => api.patch(`/productos?id=eq.${id}&local_id=eq.${LOCAL_ID}`, { activo: true })

// ==========================================
// VARIANTES (talle × color con stock propio)
// ==========================================
export const getVariantes = async (productoId) => {
  const { data, error } = await supabase
    .from('variantes')
    .select('*')
    .eq('producto_id', productoId)
    .eq('activo', true)
    .order('color', { ascending: true })
    .order('talle', { ascending: true })
  if (error) throw error
  return { data }
}

// INSERT sin id (el id lo genera la base)
export const addVariante = async (variante) => {
  const { data, error } = await supabase
    .from('variantes')
    .insert(variante)
    .select()
  if (error) throw error
  return { data }
}

// UPDATE por id (para stock, precio, etc.)
export const updateVariante = async (id, cambios) => {
  const { data, error } = await supabase
    .from('variantes')
    .update({ ...cambios, actualizado_en: new Date().toISOString() })
    .eq('id', id)
    .select()
  if (error) throw error
  return { data }
}

export const deleteVariante = async (id) => {
  const { data, error } = await supabase
    .from('variantes')
    .update({ activo: false, stock: 0 })
    .eq('id', id)
  if (error) throw error
  return { data }
}

export const descontarStockVariante = async (varianteId, cantidad) => {
  const { data, error } = await supabase
    .rpc('descontar_stock_variante', { p_variante_id: varianteId, p_cantidad: cantidad })
  if (error) throw error
  return { data }
}

// ==========================================
// VENTAS (ACTUALIZADO CON DESCUENTOS)
// ==========================================
export const createVenta = (data) => api.post('/ventas', { 
  ...data, 
  local_id: LOCAL_ID,
  total_neto: data.total_neto !== undefined ? data.total_neto : (data.total_bruto || 0) - (data.descuento_monto || 0)
})

export const createDetalleVenta = (data) => api.post('/detalle_ventas', { ...data, local_id: LOCAL_ID })

export const getVentas = () => api.get(`/ventas?local_id=eq.${LOCAL_ID}&select=id,fecha,total_bruto,descuento_monto,descuento_motivo,total_neto,estado_pago,cliente_id,clientes(id,nombre,telefono),detalle_ventas(cantidad,precio_unitario,productos(nombre,talle,color,costo)),pagos(monto)&order=fecha.desc`)
export const deleteDetalleVenta = (ventaId) => api.delete(`/detalle_ventas?venta_id=eq.${ventaId}&local_id=eq.${LOCAL_ID}`)
export const deleteVenta = (id) => api.delete(`/ventas?id=eq.${id}&local_id=eq.${LOCAL_ID}`)

// ==========================================
// FUNCIONES PARA CLIENTES Y PAGOS
// ==========================================

export const crearOActualizarCliente = async (telefono, nombre, localId, montoVenta) => {
  const { data, error } = await supabase
    .rpc('crear_o_actualizar_cliente', {
      p_telefono: telefono,
      p_nombre: nombre || null,
      p_local_id: localId,
      p_monto_venta: montoVenta
    })
  
  if (error) throw error
  return data
}

export const registrarPago = async (ventaId, clienteId, monto, localId, nota = null) => {
  const { data, error } = await supabase
    .from('pagos')
    .insert([{
      venta_id: ventaId,
      cliente_id: clienteId,
      monto: monto,
      local_id: localId,
      nota: nota
    }])
    .select()
  
  if (error) throw error
  return data
}

export const actualizarEstadoPagoVenta = async (ventaId, estadoPago) => {
  const { error } = await supabase
    .from('ventas')
    .update({ estado_pago: estadoPago })
    .eq('id', ventaId)
    .eq('local_id', LOCAL_ID)
  
  if (error) throw error
}

export const getClientesConDeuda = async () => {
  const { data, error } = await supabase
    .from('clientes_con_deuda')
    .select('*')
    .eq('local_id', LOCAL_ID)
    .order('deuda_total', { ascending: false })
  
  if (error) throw error
  return { data }
}

export const getPagosPorCliente = async (clienteId) => {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('fecha', { ascending: false })
  
  if (error) throw error
  return { data }
}

export const registrarPagoDeuda = async (clienteId, monto, localId, nota = null) => {
  const { data: ventasPendientes, error: errorVentas } = await supabase
    .from('ventas')
    .select('id, total_neto, estado_pago')
    .eq('cliente_id', clienteId)
    .in('estado_pago', ['parcial', 'pendiente'])
    .order('fecha', { ascending: true })
  
  if (errorVentas) throw errorVentas
  
  let montoRestante = monto
  let pagosCreados = []
  
  for (const venta of ventasPendientes) {
    if (montoRestante <= 0) break
    
    const { data: pagosExistentes } = await supabase
      .from('pagos')
      .select('monto')
      .eq('venta_id', venta.id)
    
    const totalPagado = pagosExistentes.reduce((sum, p) => sum + Number(p.monto), 0)
    const deudaVenta = Number(venta.total_neto) - totalPagado
    
    const montoAPagar = Math.min(montoRestante, deudaVenta)
    
    const { data: pagoData, error: errorPago } = await supabase
      .from('pagos')
      .insert([{
        venta_id: venta.id,
        cliente_id: clienteId,
        monto: montoAPagar,
        local_id: localId,
        nota: nota
      }])
      .select()
    
    if (errorPago) throw errorPago
    pagosCreados.push(pagoData[0])
    
    montoRestante -= montoAPagar
    
    const nuevoTotalPagado = totalPagado + montoAPagar
    if (nuevoTotalPagado >= Number(venta.total_neto)) {
      await supabase
        .from('ventas')
        .update({ estado_pago: 'pagado' })
        .eq('id', venta.id)
    } else {
      await supabase
        .from('ventas')
        .update({ estado_pago: 'parcial' })
        .eq('id', venta.id)
    }
  }
  
  const { data: todosLosPagos } = await supabase
    .from('pagos')
    .select('monto')
    .eq('cliente_id', clienteId)
  
  const totalPagadoActualizado = (todosLosPagos || []).reduce((sum, p) => sum + Number(p.monto), 0)
  
  const { data: clienteData } = await supabase
    .from('clientes')
    .select('total_compras')
    .eq('id', clienteId)
    .single()
  
  const totalCompras = Number(clienteData?.total_compras || 0)
  const deudaActualizada = totalCompras - totalPagadoActualizado
  
  const { error: errorUpdateCliente } = await supabase
    .from('clientes')
    .update({
      total_pagado: totalPagadoActualizado,
      deuda_total: deudaActualizada
    })
    .eq('id', clienteId)
  
  if (errorUpdateCliente) throw errorUpdateCliente
  
  return pagosCreados
}

export const getClientes = async () => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('local_id', LOCAL_ID)
    .order('ultima_compra', { ascending: false })
  
  if (error) throw error
  return { data }
}

export const getVentasPendientesCliente = async (clienteId) => {
  const { data: ventas, error: errorVentas } = await supabase
    .from('ventas')
    .select('id, fecha, total_neto, estado_pago')
    .eq('cliente_id', clienteId)
    .in('estado_pago', ['parcial', 'pendiente'])
    .order('fecha', { ascending: false })
  
  if (errorVentas) throw errorVentas
  
  const ventasConDetalles = await Promise.all(
    (ventas || []).map(async (venta) => {
      const { data: pagos } = await supabase
        .from('pagos')
        .select('monto, fecha, nota')
        .eq('venta_id', venta.id)
        .order('fecha', { ascending: true })
      
      const { data: detalleVentas } = await supabase
        .from('detalle_ventas')
        .select('cantidad, precio_unitario, productos(nombre, talle, color)')
        .eq('venta_id', venta.id)
      
      const totalPagado = (pagos || []).reduce((sum, p) => sum + Number(p.monto), 0)
      const pendiente = Number(venta.total_neto) - totalPagado
      
      return {
        ...venta,
        pagos: pagos || [],
        productos: detalleVentas || [],
        total_pagado: totalPagado,
        pendiente: pendiente
      }
    })
  )
  
  return { data: ventasConDetalles }
}

export const eliminarDeudaCliente = async (clienteId) => {
  const { error } = await supabase
    .from('clientes')
    .update({
      total_compras: 0,
      total_pagado: 0,
      deuda_total: 0
    })
    .eq('id', clienteId)
  
  if (error) throw error
}

export const eliminarCliente = async (clienteId) => {
  try {
    await supabase
      .from('pagos')
      .delete()
      .eq('cliente_id', clienteId)
    
    await supabase
      .from('ventas')
      .update({ cliente_id: null })
      .eq('cliente_id', clienteId)
    
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', clienteId)
    
    if (error) throw error
  } catch (err) {
    console.error('Error al eliminar cliente:', err)
    throw err
  }
}

export const updateVentaCliente = async (ventaId, clienteId) => {
  const { error } = await supabase
    .from('ventas')
    .update({ cliente_id: clienteId })
    .eq('id', ventaId)
  
  if (error) throw error
}

export const updateCliente = async (clienteId, data) => {
  const { error } = await supabase
    .from('clientes')
    .update(data)
    .eq('id', clienteId)
  
  if (error) throw error
}

// ==========================================
// CAPA WEB (e-commerce)
// ==========================================
export const enviarAWeb = async (productoId) => {
  const { data, error } = await supabase
    .from('productos')
    .update({
      web_estado: 'pendiente',
      web_nota_rechazo: null,
      web_enviado_en: new Date().toISOString()
    })
    .eq('id', productoId)
    .eq('local_id', LOCAL_ID)

  if (error) throw error
  return { data }
}

export const quitarDeWeb = async (productoId) => {
  const { data, error } = await supabase
    .from('productos')
    .update({
      web_estado: 'no_enviado',
      web_destacado: false
    })
    .eq('id', productoId)
    .eq('local_id', LOCAL_ID)

  if (error) throw error
  return { data }
}

export const aprobarProductoWeb = async (productoId, { descripcion, fotos, destacado, precioWeb }) => {
  const { data, error } = await supabase
    .from('productos')
    .update({
      web_estado: 'publicado',
      web_descripcion: descripcion || null,
      web_fotos: fotos || [],
      web_destacado: destacado || false,
      web_precio: precioWeb ?? null,
      web_nota_rechazo: null,
      web_aprobado_en: new Date().toISOString()
    })
    .eq('id', productoId)
    .eq('local_id', LOCAL_ID)

  if (error) throw error
  return { data }
}

export const rechazarProductoWeb = async (productoId, nota) => {
  const { data, error } = await supabase
    .from('productos')
    .update({
      web_estado: 'rechazado',
      web_nota_rechazo: nota
    })
    .eq('id', productoId)
    .eq('local_id', LOCAL_ID)

  if (error) throw error
  return { data }
}

export const getPendientesWeb = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('local_id', LOCAL_ID)
    .eq('web_estado', 'pendiente')

  if (error) throw error
  return { data }
}

export const getPublicadosWeb = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('local_id', LOCAL_ID)
    .eq('web_estado', 'publicado')
    .eq('activo', true)

  if (error) throw error
  return { data }
}

// ==========================================
// GASTOS
// ==========================================
export const getGastos = async () => {
  const { data, error } = await supabase
    .from('gastos')
    .select('*')
    .eq('local_id', LOCAL_ID)
    .order('fecha', { ascending: false })

  if (error) throw error
  return { data }
}

export const addGasto = async (gasto) => {
  const { data, error } = await supabase
    .from('gastos')
    .insert([{ ...gasto, local_id: LOCAL_ID }])

  if (error) throw error
  return { data }
}

export const updateGasto = async (id, gasto) => {
  const { data, error } = await supabase
    .from('gastos')
    .update(gasto)
    .eq('id', id)
    .eq('local_id', LOCAL_ID)

  if (error) throw error
  return { data }
}

export const deleteGasto = async (id) => {
  const { data, error } = await supabase
    .from('gastos')
    .delete()
    .eq('id', id)
    .eq('local_id', LOCAL_ID)

  if (error) throw error
  return { data }
}

export default api