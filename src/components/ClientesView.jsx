import { useState, useEffect } from 'react'
import { getClientesConDeuda, getClientes, registrarPagoDeuda, getVentasPendientesCliente, eliminarDeudaCliente, eliminarCliente, updateCliente } from '../services/api'
import { Search, Trash2, Download, MoreVertical, Phone, Copy, Eye, UserX, ChevronUp, Wallet, MessageCircle, Edit2, Calendar } from 'lucide-react'
import Swal from 'sweetalert2'
import styles from './ClientesView.module.css'

const getVarianteInfo = (item) => {
  const talle = item.variantes?.talle || item.productos?.talle
  const color = item.variantes?.color || item.productos?.color
  return { talle, color }
}

// plata con centavos (en deuda los centavos importan)
const moneyFull = (n) => '$ ' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function ClientesView() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedClient, setExpandedClient] = useState(null)
  const [ventasPorCliente, setVentasPorCliente] = useState({})
  const [filtro, setFiltro] = useState('todos')
  const [openMenu, setOpenMenu] = useState(null)

  useEffect(() => { fetchClientes() }, [filtro])

  const fetchClientes = async () => {
    setLoading(true)
    try {
      if (filtro === 'deudores') {
        const { data } = await getClientesConDeuda()
        setClientes(data || [])
      } else {
        const { data } = await getClientes()
        setClientes(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
    }
    setLoading(false)
  }

  const fetchVentasDetalle = async (clienteId) => {
    try {
      const { data } = await getVentasPendientesCliente(clienteId)
      setVentasPorCliente(prev => ({ ...prev, [clienteId]: data || [] }))
    } catch (err) {
      console.error('Error al cargar ventas:', err)
    }
  }

  const toggleExpand = async (clienteId) => {
    if (expandedClient === clienteId) {
      setExpandedClient(null)
    } else {
      setExpandedClient(clienteId)
      await fetchVentasDetalle(clienteId)
    }
  }

  const filteredClientes = clientes.filter(c => {
    const matchesSearch = c.nombre?.toLowerCase().includes(search.toLowerCase()) || c.telefono?.includes(search)
    if (filtro === 'deudores') return matchesSearch && Number(c.deuda_total || 0) > 0
    return matchesSearch
  })

  const totalDeuda = filteredClientes.reduce((sum, c) => sum + Number(c.deuda_total || 0), 0)

  const exportarClientesCSV = () => {
    const headers = ['Nombre', 'Teléfono', 'Total Comprado', 'Total Pagado', 'Deuda Actual', 'Estado', 'Última Compra']
    const rows = filteredClientes.map(c => {
      const estado = Number(c.deuda_total || 0) > 0 ? 'Con Deuda' : 'Al Día'
      const fecha = c.ultima_compra ? new Date(c.ultima_compra).toLocaleDateString('es-AR') : 'Nunca'
      return [
        c.nombre || 'Sin nombre', c.telefono,
        Number(c.total_compras || 0).toFixed(2), Number(c.total_pagado || 0).toFixed(2),
        Number(c.deuda_total || 0).toFixed(2), estado, fecha
      ].map(cell => `"${cell}"`).join(',')
    })
    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `clientes_${filtro}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleRegistrarPago = (cliente) => {
    setOpenMenu(null)
    Swal.fire({
      title: `Registrar Pago - ${cliente.nombre || cliente.telefono}`,
      html: `
        <p style="margin-bottom: 10px;">Deuda actual: <strong style="color: #dc2626; font-size: 1.2rem;">${moneyFull(cliente.deuda_total)}</strong></p>
        <input id="monto-pago" type="number" placeholder="Monto a pagar" style="width: 100%; padding: 12px; border: 2px solid #d1d5db; border-radius: 8px; margin-bottom: 10px;" />
        <input id="nota-pago" type="text" placeholder="Nota (opcional)" style="width: 100%; padding: 12px; border: 2px solid #d1d5db; border-radius: 8px;" />
      `,
      showCancelButton: true,
      confirmButtonText: 'Registrar Pago',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      preConfirm: () => {
        const monto = document.getElementById('monto-pago').value
        const nota = document.getElementById('nota-pago').value
        if (!monto || monto <= 0) { Swal.showValidationMessage('Ingresá un monto válido'); return false }
        if (monto > cliente.deuda_total) { Swal.showValidationMessage('El monto no puede superar la deuda'); return false }
        return { monto: Number(monto), nota }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const LOCAL_ID = import.meta.env.VITE_LOCAL_ID || 1
          await registrarPagoDeuda(cliente.id, result.value.monto, LOCAL_ID, result.value.nota)
          Swal.fire({ title: '¡Pago registrado!', text: `Se registró un pago de ${moneyFull(result.value.monto)}`, icon: 'success', timer: 2000 })
          fetchClientes()
          if (expandedClient === cliente.id) fetchVentasDetalle(cliente.id)
        } catch (err) { Swal.fire('Error', err.message, 'error') }
      }
    })
  }

  const handleWhatsApp = (cliente) => {
    const mensaje = `Hola ${cliente.nombre || ''}, te recordamos que tenés una deuda pendiente de ${moneyFull(cliente.deuda_total)}. ¿Podrías acercarte a saldarla? ¡Gracias!`
    const url = `https://wa.me/549${cliente.telefono}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  const handleEliminarDeuda = (cliente) => {
    setOpenMenu(null)
    Swal.fire({
      title: '¿Perdonar deuda?',
      html: `
        <p style="margin-bottom: 10px;">Se eliminará <strong>TODA</strong> la deuda de <strong>${cliente.nombre || cliente.telefono}</strong></p>
        <p style="color: #dc2626; font-size: 1.1rem; font-weight: bold;">${moneyFull(cliente.deuda_total)}</p>
        <p style="color: #6b7280; font-size: 0.9rem; margin-top: 15px;">Esta acción no se puede deshacer. Usá esto solo para deudas huérfanas o condonadas.</p>
      `,
      showCancelButton: true, confirmButtonText: 'Sí, perdonar', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', icon: 'warning'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await eliminarDeudaCliente(cliente.id)
          Swal.fire({ title: 'Deuda eliminada', text: `Se eliminó la deuda de ${moneyFull(cliente.deuda_total)}`, icon: 'success', timer: 2000 })
          fetchClientes(); setExpandedClient(null)
        } catch (err) { Swal.fire('Error', err.message, 'error') }
      }
    })
  }

  const handleEliminarCliente = (cliente) => {
    setOpenMenu(null)
    Swal.fire({
      title: '¿Eliminar cliente?',
      html: `
        <p style="margin-bottom: 10px;">Se eliminará <strong>COMPLETAMENTE</strong> a <strong>${cliente.nombre || cliente.telefono}</strong> de la base de datos.</p>
        <p style="color: #dc2626; font-size: 0.9rem; font-weight: bold;">Se desvincularán sus ventas y se borrarán sus pagos.</p>
        <p style="color: #6b7280; font-size: 0.9rem; margin-top: 15px;">Esta acción NO se puede deshacer.</p>
        <input id="confirmar-eliminar" type="text" placeholder='Escribí "ELIMINAR" para confirmar' style="width: 100%; padding: 12px; border: 2px solid #d1d5db; border-radius: 8px; margin-top: 15px;" />
      `,
      showCancelButton: true, confirmButtonText: 'Sí, eliminar definitivamente', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', icon: 'warning',
      preConfirm: () => {
        const confirmacion = document.getElementById('confirmar-eliminar').value
        if (confirmacion !== 'ELIMINAR') { Swal.showValidationMessage('Debés escribir "ELIMINAR" para confirmar'); return false }
        return true
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await eliminarCliente(cliente.id)
          Swal.fire({ title: 'Cliente eliminado', text: 'Se eliminó el cliente y todos sus datos asociados', icon: 'success', timer: 2000 })
          fetchClientes(); setExpandedClient(null)
        } catch (err) { Swal.fire('Error', err.message, 'error') }
      }
    })
  }

  const handleCopiarTelefono = (cliente) => {
    navigator.clipboard.writeText(cliente.telefono)
    setOpenMenu(null)
    Swal.fire({ title: 'Teléfono copiado', text: cliente.telefono, icon: 'success', timer: 1500, showConfirmButton: false })
  }

  const handleEditarCliente = (cliente) => {
    setOpenMenu(null)
    Swal.fire({
      title: 'Editar Datos del Cliente',
      html: `
        <div style="text-align: left;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem;">Nombre</label>
          <input id="edit-nombre" class="swal2-input" style="width: 100%; margin: 0;" value="${cliente.nombre || ''}" placeholder="Nombre y Apellido">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem; margin-top: 15px;">Teléfono</label>
          <input id="edit-telefono" class="swal2-input" style="width: 100%; margin: 0;" value="${cliente.telefono || ''}" placeholder="Ej: 11 1234 5678">
        </div>
      `,
      showCancelButton: true, confirmButtonText: 'Guardar Cambios', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb', cancelButtonColor: '#6b7280', focusConfirm: false,
      preConfirm: () => {
        const nombre = document.getElementById('edit-nombre').value.trim()
        const telefono = document.getElementById('edit-telefono').value.trim()
        if (!telefono) { Swal.showValidationMessage('El teléfono es obligatorio'); return false }
        return { nombre, telefono }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await updateCliente(cliente.id, { nombre: result.value.nombre || null, telefono: result.value.telefono })
          Swal.fire({ title: '¡Actualizado!', text: 'Los datos del cliente se guardaron correctamente', icon: 'success', timer: 1500, showConfirmButton: false })
          fetchClientes()
          if (expandedClient === cliente.id) fetchVentasDetalle(cliente.id)
        } catch (err) { Swal.fire({ title: 'Error', text: err.message, icon: 'error' }) }
      }
    })
  }

  return (
    <div className={styles.wrap}>
      {/* HEADER */}
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Gestión de Clientes</h2>
        <button onClick={exportarClientesCSV} className={styles.exportBtn}>
          <Download size={14} /> CSV
        </button>
      </div>

      {/* TABS: Todos primero, Deudores segundo */}
      <div className={styles.segmented}>
        <button onClick={() => setFiltro('todos')} className={`${styles.segBtn} ${filtro === 'todos' ? styles.segBtnActiveTodos : ''}`}>
          <span className="hidden sm:inline">Todos los Clientes</span>
          <span className="sm:hidden">Todos</span>
        </button>
        <button onClick={() => setFiltro('deudores')} className={`${styles.segBtn} ${filtro === 'deudores' ? styles.segBtnActiveDeudores : ''}`}>
          <span className="hidden sm:inline">Clientes Deudores</span>
          <span className="sm:hidden">Deudores</span>
        </button>
      </div>

      {/* SEARCH */}
      <div className={styles.searchWrap}>
        <Search className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* RESUMEN */}
      <div className={`${styles.summary} ${filtro === 'deudores' ? styles.summaryRed : styles.summaryBlue}`}>
        <p className={styles.summaryLabel}>
          {filtro === 'deudores' ? 'Deuda total pendiente:' : 'Total de clientes registrados:'}
        </p>
        <p className={styles.summaryValue}>
          {filtro === 'deudores' ? moneyFull(totalDeuda) : filteredClientes.length}
        </p>
        <p className={styles.summaryHint}>{filteredClientes.length} cliente(s) en esta vista</p>
      </div>

      {/* LISTA */}
      {loading ? (
        <p className={styles.loading}>Cargando...</p>
      ) : filteredClientes.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>
            {filtro === 'deudores' ? ' No hay clientes con deuda' : 'No hay clientes registrados'}
          </p>
          <p>{filtro === 'deudores' ? 'Todo el mundo al día' : 'Los clientes aparecen al registrar ventas con cliente.'}</p>
          {filtro === 'deudores' && (
            <button onClick={() => setFiltro('todos')} className={styles.emptyCta}>Ver todos los clientes</button>
          )}
        </div>
      ) : (
        <div className={styles.list}>
          {filteredClientes.map(cliente => {
            const tieneDeuda = Number(cliente.deuda_total || 0) > 0
            const inicial = (cliente.nombre || cliente.telefono || '?').charAt(0).toUpperCase()
            return (
              <div key={cliente.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={`${styles.avatar} ${tieneDeuda ? styles.avatarDebt : ''}`}>{inicial}</div>
                  <div className={styles.cardInfo}>
                    <p className={styles.cardName}>{cliente.nombre || 'Sin nombre'}</p>
                    <p className={styles.cardMeta}>
                      <Phone size={11} style={{ display: 'inline', marginRight: 4 }} />
                      {cliente.telefono}
                    </p>
                  </div>
                  <div className={styles.kebabWrap}>
                    <button onClick={() => setOpenMenu(openMenu === cliente.id ? null : cliente.id)} className={styles.kebabBtn} aria-label="Opciones">
                      <MoreVertical size={18} />
                    </button>
                    {openMenu === cliente.id && (
                      <>
                        <div className={styles.kebabOverlay} onClick={() => setOpenMenu(null)} />
                        <div className={styles.kebabMenu}>
                          <button className={styles.menuItem} onClick={() => { toggleExpand(cliente.id); setOpenMenu(null) }}>
                            <Eye size={16} className="text-blue-600" />
                            <div><p className={styles.menuItemTitle}>Ver detalle</p><p className={styles.menuItemHint}>Historial de compras</p></div>
                          </button>
                          <button className={styles.menuItem} onClick={() => handleCopiarTelefono(cliente)}>
                            <Copy size={16} />
                            <div><p className={styles.menuItemTitle}>Copiar teléfono</p><p className={styles.menuItemHint}>{cliente.telefono}</p></div>
                          </button>
                          <button className={styles.menuItem} onClick={() => handleEditarCliente(cliente)}>
                            <Edit2 size={16} className="text-blue-600" />
                            <div><p className={styles.menuItemTitle}>Editar datos</p><p className={styles.menuItemHint}>Nombre o teléfono</p></div>
                          </button>
                          {tieneDeuda && (
                            <button className={`${styles.menuItem} ${styles.menuItemOrange}`} onClick={() => handleEliminarDeuda(cliente)}>
                              <Trash2 size={16} />
                              <div><p className={styles.menuItemTitle}>Perdonar deuda</p><p className={styles.menuItemHint}>Eliminar {moneyFull(cliente.deuda_total)}</p></div>
                            </button>
                          )}
                          <button className={`${styles.menuItem} ${styles.menuItemRed}`} onClick={() => handleEliminarCliente(cliente)}>
                            <UserX size={16} />
                            <div><p className={styles.menuItemTitle}>Eliminar cliente</p><p className={styles.menuItemHint}>Borrar de la base</p></div>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className={styles.chipRow}>
                  {tieneDeuda ? (
                    <span className={styles.debtChip}>Debe {moneyFull(cliente.deuda_total)}</span>
                  ) : (
                    <span className={styles.okChip}>Al día</span>
                  )}
                  <span className={styles.lastChip}>
                    <Calendar size={11} style={{ display: 'inline', marginRight: 3 }} />
                    {cliente.ultima_compra ? new Date(cliente.ultima_compra).toLocaleDateString('es-AR') : 'Nunca'}
                  </span>
                </div>

                <div className={`${styles.cardActions} ${!tieneDeuda ? styles.cardActionsOne : ''}`}>
                  {tieneDeuda && (
                    <button onClick={() => handleRegistrarPago(cliente)} className={`${styles.actionBtn} ${styles.actionGreen}`}>
                      <Wallet size={16} /> Cobrar
                    </button>
                  )}
                  <button onClick={() => handleWhatsApp(cliente)} className={`${styles.actionBtn} ${styles.actionBlue}`}>
                    <MessageCircle size={16} /> {tieneDeuda ? 'WhatsApp' : 'Contactar'}
                  </button>
                </div>

                {expandedClient === cliente.id && (
                  <div className={styles.detail}>
                    <div className={styles.detailHead}>
                      <h4 className={styles.detailTitle}>Historial de compras pendientes</h4>
                      <button onClick={() => setExpandedClient(null)} className={styles.detailClose} title="Cerrar detalle">
                        <ChevronUp size={18} />
                      </button>
                    </div>
                    {ventasPorCliente[cliente.id]?.length > 0 ? (
                      ventasPorCliente[cliente.id].map((venta) => (
                        <div key={venta.id} className={styles.ventaCard}>
                          <div className={styles.ventaHead}>
                            <div>
                              <p className={styles.ventaId}>Venta #{venta.id}</p>
                              <p className={styles.ventaFecha}>{new Date(venta.fecha).toLocaleString('es-AR')}</p>
                            </div>
                            <p className={styles.ventaTotal}>{moneyFull(venta.total_neto || 0)}</p>
                          </div>
                          {venta.productos?.length > 0 && (
                            <div className={styles.ventaProds}>
                              {venta.productos.map((prod, idx) => {
                                const { talle, color } = getVarianteInfo(prod)
                                return (
                                  <div key={idx} className={styles.prodRow}>
                                    <div style={{ minWidth: 0 }}>
                                      <p className={styles.prodName}>{prod.cantidad}x {prod.productos?.nombre || 'Producto eliminado'}</p>
                                      {(talle || color) && (
                                        <div className={styles.prodTags}>
                                          {talle && <span className={styles.tagTalle}>Talle {talle}</span>}
                                          {color && <span className={styles.tagColor}>{color}</span>}
                                        </div>
                                      )}
                                    </div>
                                    <span>{moneyFull(prod.precio_unitario * prod.cantidad)}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          {venta.pagos?.length > 0 && (
                            <div className={styles.ventaPagos}>
                              {venta.pagos.map((pago, idx) => (
                                <div key={idx} className={styles.pagoRow}>
                                  <span>
                                    {new Date(pago.fecha).toLocaleDateString('es-AR')}
                                    {pago.nota && ` - ${pago.nota}`}
                                  </span>
                                  <span style={{ fontWeight: 700 }}>{moneyFull(pago.monto)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className={styles.ventaPendiente}>
                            <div>
                              <p className={styles.pendienteLabel}>Pendiente</p>
                              <p className={styles.pendienteHint}>Resta pagar de {moneyFull(venta.total_neto || 0)}</p>
                            </div>
                            <span className={styles.pendienteValor}>{moneyFull(venta.pendiente)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className={styles.detailEmpty}>Este cliente no tiene compras pendientes</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ClientesView