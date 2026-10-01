import { useState, useEffect } from 'react'
import { Plus, Trash2, DollarSign, Calendar, Download, X, MoreVertical, TrendingDown, TrendingUp } from 'lucide-react'
import { getGastos, addGasto, deleteGasto } from '../services/api'
import Swal from 'sweetalert2'
import styles from './GastosView.module.css'

const CATEGORIAS = [
  { value: 'alquiler', label: 'Alquiler', emoji: '🏠' },
  { value: 'servicios', label: 'Servicios', emoji: '💡' },
  { value: 'sueldos', label: 'Sueldos', emoji: '👥' },
  { value: 'impuestos', label: 'Impuestos', emoji: '📋' },
  { value: 'insumos', label: 'Insumos', emoji: '🧾' },
  { value: 'otros', label: 'Otros', emoji: '📦' }
]

const money = (n) => '$ ' + Math.round(Number(n || 0)).toLocaleString('es-AR')

function GastosView() {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [mesSeleccionado, setMesSeleccionado] = useState(
    new Date().toISOString().slice(0, 7)
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

  useEffect(() => { fetchGastos() }, [])

  // cerrar sheet con ESC y cerrar menú con click fuera
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setSheetOpen(false); setMenuOpenId(null) } }
    const onClick = () => setMenuOpenId(null)
    window.addEventListener('keydown', onKey)
    window.addEventListener('click', onClick)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('click', onClick) }
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
      Swal.fire({ title: '¡Gasto registrado!', icon: 'success', timer: 1500, showConfirmButton: false })
      setForm({
        fecha: new Date().toISOString().slice(0, 10),
        concepto: '', categoria: 'otros', monto: '', nota: ''
      })
      setSheetOpen(false)
      fetchGastos()
    } catch (err) {
      Swal.fire('Error', err.message, 'error')
    }
  }

  const handleDelete = async (id, concepto) => {
    setMenuOpenId(null)
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

  // ============ DERIVACIONES ============
  const [anio, mes] = mesSeleccionado.split('-').map(Number)
  const nombreMesRaw = new Date(anio, mes - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const nombreMes = nombreMesRaw.charAt(0).toUpperCase() + nombreMesRaw.slice(1)

  // mes anterior para el delta
  const prevDate = new Date(anio, mes - 2, 1)
  const mesAnteriorStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  const gastosDelMes = gastos.filter(g => g.fecha?.startsWith(mesSeleccionado))
  const gastosMesAnterior = gastos.filter(g => g.fecha?.startsWith(mesAnteriorStr))
  const totalMes = gastosDelMes.reduce((sum, g) => sum + Number(g.monto), 0)
  const totalMesAnterior = gastosMesAnterior.reduce((sum, g) => sum + Number(g.monto), 0)

  let delta = null
  let deltaCls = styles.deltaFlat
  if (totalMesAnterior > 0) {
    const pct = ((totalMes - totalMesAnterior) / totalMesAnterior) * 100
    delta = pct
    deltaCls = pct > 0 ? styles.deltaUp : pct < 0 ? styles.deltaDown : styles.deltaFlat
  }

  // desglose por categoría con % (ordenado por monto)
  const porCategoria = CATEGORIAS.map(c => ({
    ...c,
    total: gastosDelMes.filter(g => g.categoria === c.value).reduce((s, g) => s + Number(g.monto), 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  // lista ordenada por fecha descendente
  const gastosOrdenados = [...gastosDelMes].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))

  const getCategoria = (val) => CATEGORIAS.find(c => c.value === val) || CATEGORIAS[CATEGORIAS.length - 1]

  const exportarCSV = () => {
    if (gastosDelMes.length === 0) {
      Swal.fire({ title: 'Sin gastos', text: 'No hay gastos en el mes seleccionado', icon: 'info', timer: 1500, showConfirmButton: false })
      return
    }
    const headers = ['Fecha', 'Categoría', 'Concepto', 'Monto', 'Nota']
    const rows = gastosOrdenados.map(g => {
      const cat = getCategoria(g.categoria)
      return [
        new Date(g.fecha).toLocaleDateString('es-AR'),
        `"${cat.label}"`,
        `"${(g.concepto || '').replace(/"/g, "'")}"`,
        Number(g.monto).toFixed(2),
        `"${(g.nota || '').replace(/"/g, "'")}"`
      ]
    })
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `gastos_${mesSeleccionado}.csv`
    link.click()
  }

  return (
    <div className={styles.wrap}>
      {/* ============ HEADER ============ */}
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Gastos del Local</h2>
          <p className={styles.subtitle}>Controlá tus egresos mensuales</p>
        </div>
        <label className={styles.monthChip}>
          <Calendar size={16} />
          <input
            type="month"
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            className={styles.monthInput}
          />
        </label>
      </div>

      {/* ============ HERO TOTAL ============ */}
      <div className={styles.hero}>
        <p className={styles.heroLabel}>Total gastado en {nombreMes}</p>
        <p className={styles.heroValue}>{money(totalMes)}</p>
        <div className={styles.heroMeta}>
          <span>{gastosDelMes.length} gasto(s) registrado(s)</span>
          {delta !== null && (
            <span className={`${styles.delta} ${deltaCls}`}>
              {delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {delta > 0 ? '+' : ''}{delta.toFixed(0)}% vs mes anterior
            </span>
          )}
        </div>
      </div>

      {/* ============ DESGLOSE POR CATEGORÍA ============ */}
      <div className={styles.breakdownCard}>
        <h3 className={styles.breakdownTitle}>¿En qué se fue?</h3>
        {porCategoria.length > 0 ? (
          <div className={styles.breakdownList}>
            {porCategoria.map(c => {
              const pct = totalMes > 0 ? (c.total / totalMes) * 100 : 0
              return (
                <div key={c.value} className={styles.catRow}>
                  <div className={styles.catTop}>
                    <div className={styles.catLabel}>
                      <span className={styles.catEmoji}>{c.emoji}</span>
                      <span className={styles.catName}>{c.label}</span>
                      <span className={styles.catPct}>{pct.toFixed(0)}%</span>
                    </div>
                    <span className={styles.catAmount}>{money(c.total)}</span>
                  </div>
                  <div className={styles.catBar}>
                    <div className={styles.catBarFill} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className={styles.breakdownEmpty}>Sin gastos para desglosar</p>
        )}
      </div>

      {/* ============ MOVIMIENTOS ============ */}
      <section>
        <div className={styles.movHeader}>
          <h3 className={styles.movTitle}>Movimientos del mes</h3>
          <button onClick={exportarCSV} disabled={gastosDelMes.length === 0} className={styles.exportBtn}>
            <Download size={14} /> CSV
          </button>
        </div>

        {loading ? (
          <p className={styles.loading}>Cargando...</p>
        ) : gastosOrdenados.length === 0 ? (
          <div className={styles.emptyState}>
            <DollarSign size={40} className={styles.emptyIcon} />
            <p>No hay gastos registrados en {nombreMes}</p>
            <button onClick={() => setSheetOpen(true)} className={styles.emptyCta}>
              <Plus size={16} /> Cargar mi primer gasto
            </button>
          </div>
        ) : (
          <div className={styles.movList}>
            {gastosOrdenados.map(g => {
              const cat = getCategoria(g.categoria)
              return (
                <div key={g.id} className={styles.movRow}>
                  <div className={styles.movIcon}>{cat.emoji}</div>
                  <div className={styles.movInfo}>
                    <p className={styles.movName}>{g.concepto}</p>
                    <div className={styles.movLine}>
                      <p className={styles.movSub}>
                        {new Date(g.fecha).toLocaleDateString('es-AR')} · {cat.label}
                      </p>
                      <p className={styles.movAmount}>−{money(g.monto)}</p>
                    </div>
                    {g.nota && <p className={styles.movNote}>{g.nota}</p>}
                  </div>
                  <div className={styles.kebabWrap}>
                    <button
                      className={styles.kebabBtn}
                      onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === g.id ? null : g.id) }}
                      aria-label="Más opciones"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {menuOpenId === g.id && (
                      <div className={styles.kebabMenu} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.kebabItem} onClick={() => handleDelete(g.id, g.concepto)}>
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ============ FAB EXTENDIDO ============ */}
      <button onClick={() => setSheetOpen(true)} className={styles.fab} aria-label="Nuevo gasto">
        <Plus size={20} /> Nuevo gasto
      </button>

      {/* ============ BOTTOM SHEET (formulario) ============ */}
      {sheetOpen && (
        <>
          <div className={styles.sheetOverlay} onClick={() => setSheetOpen(false)} />
          <aside className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <div className={styles.sheetGrabber} />
              <h3 className={styles.sheetTitle}>Nuevo gasto</h3>
              <button onClick={() => setSheetOpen(false)} className={styles.sheetClose} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.sheetBody}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Fecha *</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Monto *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.monto}
                    onChange={(e) => setForm({ ...form, monto: e.target.value })}
                    className={styles.input}
                    placeholder="0"
                    required
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Categoría *</label>
                <div className={styles.chipsGrid}>
                  {CATEGORIAS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm({ ...form, categoria: c.value })}
                      className={`${styles.chip} ${form.categoria === c.value ? styles.chipActive : ''}`}
                    >
                      <span className={styles.chipEmoji}>{c.emoji}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Concepto *</label>
                <input
                  type="text"
                  value={form.concepto}
                  onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                  className={styles.input}
                  placeholder="Ej: Alquiler de octubre, Factura Edenor..."
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Nota (opcional)</label>
                <input
                  type="text"
                  value={form.nota}
                  onChange={(e) => setForm({ ...form, nota: e.target.value })}
                  className={styles.input}
                  placeholder="Detalle adicional..."
                />
              </div>

              <button type="submit" className={styles.submitBtn}>
                Guardar gasto
              </button>
            </form>
          </aside>
        </>
      )}
    </div>
  )
}

export default GastosView