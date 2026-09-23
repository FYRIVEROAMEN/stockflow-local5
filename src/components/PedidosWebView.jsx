import { useState, useEffect, useCallback } from 'react'
import { ShoppingBag, MessageCircle } from 'lucide-react'
import { getPedidosWeb, actualizarEstadoPedidoWeb } from '../services/api'
import Swal from 'sweetalert2'

const BADGE = {
  recibido: 'bg-amber-100 text-amber-800',
  confirmado: 'bg-blue-100 text-blue-800',
  enviado: 'bg-indigo-100 text-indigo-800',
  entregado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-700'
}
const LABEL = {
  recibido: '🕐 Recibido',
  confirmado: '✔ Confirmado',
  enviado: '🚚 Enviado',
  entregado: '📦 Entregado',
  cancelado: '❌ Cancelado'
}

export default function PedidosWebView({ onCambios }) {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('recibido')
  const [procesando, setProcesando] = useState(null)

  const fetchPedidos = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getPedidosWeb()
      setPedidos(data || [])
    } catch (err) {
      console.error('Error cargando pedidos web:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPedidos() }, [fetchPedidos])

  const cambiarEstado = async (pedido, estado) => {
    const textos = {
      confirmado: 'Al confirmar se descuenta el stock del local (pago coordinado con el cliente).',
      enviado: 'El cliente verá su pedido como "En camino".',
      entregado: 'Marcás el pedido como entregado.',
      cancelado: pedido.estado === 'confirmado'
        ? 'Este pedido ya descontó stock: se DEVUELVE al cancelar.'
        : 'Este pedido todavía no descontó stock.'
    }
    const result = await Swal.fire({
      title: `Pedido #${pedido.id} → ${LABEL[estado]}`,
      text: textos[estado],
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'No',
      confirmButtonColor: estado === 'cancelado' ? '#dc2626' : '#2563eb'
    })
    if (!result.isConfirmed) return

    setProcesando(pedido.id)
    try {
      await actualizarEstadoPedidoWeb(pedido.id, estado)
      await fetchPedidos()
      if (onCambios) onCambios()
      Swal.fire({ title: 'Listo ✔', icon: 'success', timer: 1200, showConfirmButton: false })
    } catch (err) {
      Swal.fire({ title: 'Error', text: err.message, icon: 'error' })
    }
    setProcesando(null)
  }

  const whatsapp = (pedido) => {
    const tel = (pedido.telefono_contacto || '').replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Hola ${pedido.cliente_nombre || ''}! Te escribo por tu pedido #${pedido.id} (${LABEL[pedido.estado]}). Total: $${Number(pedido.total).toLocaleString('es-AR')}. Cualquier duda respondé por acá!`
    )
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank')
  }

  const count = (e) => pedidos.filter(p => p.estado === e).length
  const visibles = filtro === 'todos' ? pedidos : pedidos.filter(p => p.estado === filtro)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-blue-600" /> Pedidos de tu vidriera
        </h2>
      </div>


            {/* 🔔 Banner de pedidos esperando aprobación */}
      {count('recibido') > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 p-3 rounded-lg mb-4 flex items-center gap-3 animate-pulse">
          <ShoppingBag className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-amber-800 font-semibold text-sm">
            {count('recibido')} pedido(s) esperando tu aprobación
          </p>
          <button
            onClick={() => setFiltro('recibido')}
            className="ml-auto text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-full transition"
          >
            Ver ahora →
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-5">
        {['recibido', 'confirmado', 'enviado', 'entregado', 'cancelado', 'todos'].map(e => (
          <button
            key={e}
            onClick={() => setFiltro(e)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
              filtro === e
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {e === 'todos' ? 'Todos' : LABEL[e]} ({e === 'todos' ? pedidos.length : count(e)})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">Cargando pedidos...</div>
      ) : visibles.length === 0 ? (
        <div className="empty-state">No hay pedidos en este estado. 🎉</div>
      ) : (
        visibles.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-800">Pedido #{p.id}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${BADGE[p.estado]}`}>
                  {LABEL[p.estado]}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(p.creado_en).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>

            <p className="text-sm text-gray-700 mb-1">
              👤 <b>{p.cliente_nombre || 'Cliente'}</b> · 📞 {p.telefono_contacto}
            </p>
            <p className="text-sm text-gray-600 mb-2">📍 {p.direccion_envio}</p>
            {p.nota_cliente && (
              <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-1 mb-2">
                📝 {p.nota_cliente}
              </p>
            )}

            <ul className="text-sm text-gray-700 mb-2 border-t border-gray-100 pt-2">
              {(p.items || []).map(i => (
                <li key={i.id} className="flex justify-between py-0.5">
                  <span>
                    {i.cantidad}x {i.nombre_snapshot}
                    {i.talle ? ` · Talle ${i.talle}` : ''}
                    {i.color ? ` · ${i.color}` : ''}
                  </span>
                  <span>${(Number(i.precio_unitario) * i.cantidad).toLocaleString('es-AR')}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
              <span className="font-bold text-gray-900">
                Total: ${Number(p.total).toLocaleString('es-AR')}
              </span>
              <div className="flex flex-wrap gap-2">
                {p.estado === 'recibido' && (
                  <>
                    <button onClick={() => cambiarEstado(p, 'confirmado')} disabled={procesando === p.id}
                      className="btn btn-success touch-target">✔ Confirmar (pago ok)</button>
                    <button onClick={() => cambiarEstado(p, 'cancelado')} disabled={procesando === p.id}
                      className="btn btn-danger touch-target">Cancelar</button>
                  </>
                )}
                {p.estado === 'confirmado' && (
                  <button onClick={() => cambiarEstado(p, 'enviado')} disabled={procesando === p.id}
                    className="btn btn-primary touch-target">🚚 Marcar enviado</button>
                )}
                {p.estado === 'enviado' && (
                  <button onClick={() => cambiarEstado(p, 'entregado')} disabled={procesando === p.id}
                    className="btn btn-primary touch-target">📦 Marcar entregado</button>
                )}
                <button onClick={() => whatsapp(p)} className="btn btn-secondary touch-target">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}