import { useState, useEffect } from 'react'
import { Plus, Trash2, DollarSign, Calendar, Tag } from 'lucide-react'
import { getGastos, addGasto, deleteGasto } from '../services/api'
import Swal from 'sweetalert2'

const CATEGORIAS = [
  { value: 'alquiler', label: '🏠 Alquiler' },
  { value: 'servicios', label: '💡 Servicios (luz, agua, gas, internet)' },
  { value: 'sueldos', label: '👥 Sueldos' },
  { value: 'impuestos', label: '📋 Impuestos' },
  { value: 'insumos', label: '🧾 Insumos / Mercadería' },
  { value: 'otros', label: '📦 Otros' }
]

function GastosView() {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [mesSeleccionado, setMesSeleccionado] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  )

  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    concepto: '',
    categoria: 'otros',
    monto: '',
    nota: ''
  })

  const fetchGastos = async () => {
    setLoading(true)
    try {
      const { data } = await getGastos()
      setGastos(data || [])
    } catch (err) {
      console.error('Error cargando gastos:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchGastos()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.concepto.trim()) {
      Swal.fire('Falta el concepto', 'Describí brevemente el gasto', 'warning')
      return
    }
    if (!form.monto || parseFloat(form.monto) <= 0) {
      Swal.fire('Monto inválido', 'Ingresá un monto mayor a 0', 'warning')
      return
    }

    try {
      await addGasto({
        fecha: form.fecha,
        concepto: form.concepto.trim(),
        categoria: form.categoria,
        monto: parseFloat(form.monto),
        nota: form.nota.trim() || null
      })
      Swal.fire({
        title: '¡Gasto registrado!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      })
      setForm({
        fecha: new Date().toISOString().slice(0, 10),
        concepto: '',
        categoria: 'otros',
        monto: '',
        nota: ''
      })
      setShowForm(false)
      fetchGastos()
    } catch (err) {
      Swal.fire('Error', err.message, 'error')
    }
  }

  const handleDelete = async (id, concepto) => {
    const result = await Swal.fire({
      title: '¿Eliminar gasto?',
      text: `"${concepto}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626'
    })

    if (result.isConfirmed) {
      try {
        await deleteGasto(id)
        Swal.fire({ title: 'Eliminado', icon: 'success', timer: 1500, showConfirmButton: false })
        fetchGastos()
      } catch (err) {
        Swal.fire('Error', err.message, 'error')
      }
    }
  }

  // Filtrar gastos del mes seleccionado
  const gastosDelMes = gastos.filter(g => g.fecha?.startsWith(mesSeleccionado))
  const totalMes = gastosDelMes.reduce((sum, g) => sum + Number(g.monto), 0)

  // Agrupar por categoría para el resumen
  const porCategoria = CATEGORIAS.map(c => ({
    ...c,
    total: gastosDelMes
      .filter(g => g.categoria === c.value)
      .reduce((sum, g) => sum + Number(g.monto), 0)
  })).filter(c => c.total > 0)

  return (
    <div className="bg-white p-4 sm:p-8 rounded-xl shadow-sm border border-gray-200 max-w-5xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Gastos del Local</h2>
          <p className="text-sm text-gray-500 mt-1">Controlá tus egresos mensuales</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {showForm ? 'Cancelar' : 'Nuevo gasto'}
        </button>
      </div>

      {/* Selector de mes */}
      <div className="mb-6 flex items-center gap-3">
        <Calendar className="w-5 h-5 text-gray-500" />
        <input
          type="month"
          value={mesSeleccionado}
          onChange={(e) => setMesSeleccionado(e.target.value)}
          className="input-lg"
          style={{ maxWidth: '200px' }}
        />
      </div>

      {/* Total del mes */}
      <div className="mb-6 p-5 rounded-xl bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200">
        <p className="text-sm text-red-700 font-medium">Total gastado en {mesSeleccionado}</p>
        <p className="text-4xl font-bold text-red-800 mt-1">${totalMes.toFixed(2)}</p>
        <p className="text-xs text-red-600 mt-1">{gastosDelMes.length} gasto(s) registrado(s)</p>
      </div>

      {/* Resumen por categoría */}
      {porCategoria.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Desglose por categoría</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {porCategoria.map(c => (
              <div key={c.value} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-xs text-gray-600">{c.label}</p>
                <p className="text-lg font-bold text-gray-800">${c.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario (condicional) */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-5 rounded-xl border-2 border-blue-200 bg-blue-50">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Registrar nuevo gasto</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Fecha *</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className="input-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Monto *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  className="input-lg"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Categoría *</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="input-lg"
              >
                {CATEGORIAS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Concepto *</label>
              <input
                type="text"
                value={form.concepto}
                onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                className="input-lg"
                placeholder="Ej: Alquiler de marzo, Factura Edenor..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nota (opcional)</label>
              <input
                type="text"
                value={form.nota}
                onChange={(e) => setForm({ ...form, nota: e.target.value })}
                className="input-lg"
                placeholder="Detalle adicional..."
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Guardar gasto
            </button>
          </div>
        </form>
      )}

      {/* Lista de gastos del mes */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">Gastos del mes</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : gastosDelMes.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl">
            <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No hay gastos registrados en {mesSeleccionado}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {gastosDelMes.map(g => {
              const cat = CATEGORIAS.find(c => c.value === g.categoria) || CATEGORIAS[CATEGORIAS.length - 1]
              return (
                <div key={g.id} className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xl">
                    {cat.label.split(' ')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{g.concepto}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(g.fecha).toLocaleDateString('es-AR')} · {cat.label.split(' ').slice(1).join(' ')}
                    </p>
                    {g.nota && <p className="text-xs text-gray-400 italic mt-0.5 truncate">{g.nota}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg text-red-700">${Number(g.monto).toFixed(2)}</p>
                    <button
                      onClick={() => handleDelete(g.id, g.concepto)}
                      className="text-red-500 hover:text-red-700 p-1 transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default GastosView