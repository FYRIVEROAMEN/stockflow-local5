import { useState, useEffect } from 'react'
import { Plus, Trash2, Minus } from 'lucide-react'
import { getVariantes, addVariante, updateVariante, deleteVariante, updateProducto } from '../services/api'
import Swal from 'sweetalert2'

const TALLES_SUGERIDOS = ['S', 'M', 'L', 'XL', 'XXL']

// ✅ Normaliza: "negro" → "Negro", " GRIS " → "Gris"
const normalizar = (str) => {
  if (!str) return null
  const limpio = str.trim()
  if (!limpio) return null
  return limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase()
}

function VariantManager({ productoId, onDraftChange }) {
  const [variantes, setVariantes] = useState([])
  const [loading, setLoading] = useState(!!productoId)
  const [form, setForm] = useState({ talle: '', color: '', stock: '', precio: '' })

  const fetchVariantes = async () => {
    setLoading(true)
    try {
      const { data } = await getVariantes(productoId)
      setVariantes(data || [])
    } catch (err) {
      console.error('Error cargando variantes:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (productoId) fetchVariantes()
  }, [productoId])

  // Sincroniza los campos legacy del producto (normalizado también)
  const syncLegacy = (lista) => {
    if (!productoId) return
    const legacy = {
      talle: [...new Set(lista.map(v => v.talle).filter(Boolean))].sort().join(', '),
      color: [...new Set(lista.map(v => v.color).filter(Boolean))].sort().join(', '),
      stock: lista.reduce((s, v) => s + (Number(v.stock) || 0), 0)
    }
    updateProducto(productoId, legacy).catch(() => {})
  }

  const aplicar = (nuevaLista) => {
    setVariantes(nuevaLista)
    if (onDraftChange) onDraftChange(nuevaLista)
    syncLegacy(nuevaLista)
  }

  const handleAdd = async () => {
    // ✅ Normalización al guardar (raíz)
    const talle = form.talle ? form.talle.trim().toUpperCase() : null
    const color = normalizar(form.color)
    
    if (!talle && !color) {
      Swal.fire('Faltan datos', 'Ingresá al menos un talle o un color', 'warning')
      return
    }
    const nueva = {
      talle,
      color,
      stock: parseInt(form.stock) || 0,
      precio: form.precio ? parseFloat(form.precio) : null
    }

    if (productoId) {
      try {
        await addVariante({ ...nueva, producto_id: productoId })
        const { data } = await getVariantes(productoId)
        aplicar(data || [])
      } catch (err) {
        Swal.fire('Variante duplicada', 'Ya existe una variante con ese talle y color', 'error')
        return
      }
    } else {
      // ✅ Verificación de duplicado case-insensitive
      const existe = variantes.some(v =>
        (v.talle || '').toUpperCase() === (talle || '').toUpperCase() &&
        (v.color || '').toLowerCase() === (color || '').toLowerCase()
      )
      if (existe) {
        Swal.fire('Variante duplicada', 'Ese talle y color ya están en la lista', 'warning')
        return
      }
      aplicar([...variantes, { ...nueva, id: `tmp-${Date.now()}` }])
    }
    setForm({ talle: '', color: '', stock: '', precio: '' })
  }

  const handleStock = async (v, delta) => {
    const nuevo = Math.max(0, v.stock + delta)
    if (productoId) {
      try {
        await updateVariante(v.id, { stock: nuevo })
        const { data } = await getVariantes(productoId)
        aplicar(data || [])
      } catch (err) {
        Swal.fire('Error', 'No se pudo actualizar el stock', 'error')
      }
    } else {
      aplicar(variantes.map(x => x.id === v.id ? { ...x, stock: nuevo } : x))
    }
  }

  const handleDelete = async (v) => {
    const r = await Swal.fire({
      title: `¿Eliminar ${v.talle || 'sin talle'} / ${v.color || 'sin color'}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626'
    })
    if (!r.isConfirmed) return
    if (productoId) {
      await deleteVariante(v.id)
      const { data } = await getVariantes(productoId)
      aplicar(data || [])
    } else {
      aplicar(variantes.filter(x => x.id !== v.id))
    }
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
      <h3 className="font-bold text-gray-800 mb-1">Variantes (talle × color)</h3>
      <p className="text-xs text-gray-500 mb-3">
        {productoId
          ? 'El stock del producto es la suma de sus variantes.'
          : 'Agregá las combinaciones de talle y color con su stock.'}
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando variantes...</p>
      ) : variantes.length === 0 ? (
        <p className="text-sm text-gray-500 mb-3">Sin variantes todavía.</p>
      ) : (
        <div className="space-y-2 mb-4">
                {variantes.map(v => (
                    <div key={v.id} className="bg-white rounded-lg p-2.5 border border-blue-200">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-700 flex-shrink-0">{v.talle || '—'}</span>
                        <span className="px-2 py-1 bg-purple-100 rounded text-xs font-bold text-purple-700 truncate">{v.color || '—'}</span>
                        <span className="text-xs text-gray-500 flex-shrink-0">{v.precio ? `$${v.precio}` : 'hereda'}</span>
                        </div>
                        <button type="button" onClick={() => handleDelete(v)} className="text-red-500 p-1 flex-shrink-0"><Trash2 size={16} /></button>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        <button type="button" onClick={() => handleStock(v, -1)} className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center flex-shrink-0"><Minus size={14} /></button>
                        <span className="flex-1 text-center font-bold text-gray-800">{v.stock}</span>
                        <button type="button" onClick={() => handleStock(v, +1)} className="w-8 h-8 rounded bg-green-200 flex items-center justify-center flex-shrink-0"><Plus size={14} /></button>
                    </div>
                    </div>
                ))}
                </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-gray-600">Talle</label>
          <input value={form.talle} onChange={e => setForm({...form, talle: e.target.value})} className="input-lg" placeholder="M" list="talles-sugeridos" />
          <datalist id="talles-sugeridos">
            {TALLES_SUGERIDOS.map(t => <option key={t} value={t} />)}
          </datalist>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600">Color</label>
          <input value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="input-lg" placeholder="Negro" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600">Stock</label>
          <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="input-lg" placeholder="0" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600">Precio (opcional)</label>
          <input type="number" step="0.01" value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} className="input-lg" placeholder="hereda" />
        </div>
        <button type="button" onClick={handleAdd} className="col-span-2 btn btn-primary">
          <Plus size={16} /> Agregar variante
        </button>
      </div>
    </div>
  )
}

export default VariantManager