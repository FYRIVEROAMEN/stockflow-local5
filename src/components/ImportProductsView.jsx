import { useState, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import Swal from 'sweetalert2'
import { Upload, Download, FileText, CheckCircle2, AlertTriangle, ChevronRight, RotateCcw, Package, HelpCircle, X, Info, ArrowLeft, Undo2, Pencil } from 'lucide-react'
import { getCategoriasApp } from '../services/api'
import {
  descargarTemplate, autoMapeo, normalizarFilas, importarProductos,
  saveMapping, revertirImportacion, MAX_BYTES, MAX_FILAS,
  esListaLibre, parsearListaLibre
} from '../services/importService'
import styles from './ImportProducts.module.css'

const CAMPOS = [
  { key: 'nombre', label: 'Nombre *', requerido: true },
  { key: 'categoria', label: 'Categoría' },
  { key: 'talle', label: 'Talle' },
  { key: 'color', label: 'Color' },
  { key: 'stock', label: 'Stock' },
  { key: 'precio', label: 'Precio' },
  { key: 'costo', label: 'Costo' },
  { key: 'barcode', label: 'Código barras' }
]

function ImportProductsView({ onDone, onBack }) {
  const [paso, setPaso] = useState('upload')
  const [headers, setHeaders] = useState([])
  const [filas, setFilas] = useState([])
  const [mapeo, setMapeo] = useState({})
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [progreso, setProgreso] = useState(0)
  const [resumen, setResumen] = useState(null)
  const [dedupeCount, setDedupeCount] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [recordarMapping, setRecordarMapping] = useState(true)
  const [modo, setModo] = useState('reemplazar')
  const [verTodas, setVerTodas] = useState(false)
  const [revirtiendo, setRevirtiendo] = useState(false)
  const [modoLista, setModoLista] = useState(false)
  const [filasLista, setFilasLista] = useState([])
  const [categoriasExistentes, setCategoriasExistentes] = useState([])
  // edición de filas (anti-mono): correcciones en memoria, no tocan la DB
  const [ediciones, setEdiciones] = useState({})
  const [editIndex, setEditIndex] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    getCategoriasApp().then(({ data }) => setCategoriasExistentes(data || [])).catch(() => {})
  }, [])

  const procesarArchivo = (file) => {
    if (!file) return
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      Swal.fire('PDF todavía no', 'Por ahora el importador lee CSV, TSV y TXT. Desde tu PDF: exportalo a CSV, o copiá las líneas a un TXT como lista.', 'info')
      return
    }
    if (file.size > MAX_BYTES) {
      Swal.fire('Archivo demasiado grande', `El límite es 10 MB y este archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. Dividilo en partes.`, 'warning')
      return
    }
    setNombreArchivo(file.name)
    setEdiciones({})
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data || []
        if (data.length < 1) {
          Swal.fire('Archivo vacío', 'El archivo no tiene filas de datos.', 'warning')
          return
        }
        const heads = data[0].map(h => String(h || '').trim())

        // LISTA LIBRE: sin headers reconocibles → parser de texto
        if (esListaLibre(heads)) {
          const lineas = data.map(f => f.join(' ').trim()).filter(Boolean)
          if (lineas.length > MAX_FILAS) {
            Swal.fire('Demasiadas filas', `El límite es ${MAX_FILAS.toLocaleString('es-AR')} filas.`, 'warning')
            return
          }
          setModoLista(true)
          setFilasLista(lineas)
          setFilas([])
          setPaso('preview')
          return
        }

        // CSV CON HEADERS
        const body = data.slice(1)
        if (body.length > MAX_FILAS) {
          Swal.fire('Demasiadas filas', `El archivo tiene ${body.length.toLocaleString('es-AR')} filas y el límite es ${MAX_FILAS.toLocaleString('es-AR')}. Dividilo en partes.`, 'warning')
          return
        }
        setModoLista(false)
        setHeaders(heads)
        setFilas(body)
        setMapeo(autoMapeo(heads))
        setDedupeCount(normalizarFilas(body, autoMapeo(heads)).dedupeCount)
        setPaso('preview')
      }
    })
  }

  const normResult = paso !== 'upload'
    ? (modoLista ? parsearListaLibre(filasLista) : normalizarFilas(filas, mapeo))
    : { filas: [], dedupeCount: 0 }

  // las correcciones del dueño van ENCIMA del parse (no lo rompen)
  const filasNorm = normResult.filas.map((f, i) =>
    ediciones[i] ? { ...f, ...ediciones[i], editada: true } : f
  )
  const warningsTotales = filasNorm.reduce((s, f) => s + (f.warnings?.length || 0), 0)
  const filasVisibles = verTodas ? filasNorm : filasNorm.slice(0, 5)
  const sinPrecio = filasNorm.filter(f => f.precio === 0).length

  const abrirEdicion = (i) => {
    const f = filasNorm[i]
    setEditIndex(i)
    setEditForm({
      nombre: f.nombre, categoria: f.categoria, talle: f.talle,
      color: f.color || '', stock: f.stock, precio: f.precio,
      costo: f.costo ?? ''
    })
  }

  const guardarEdicion = () => {
    if (!editForm.nombre || !editForm.nombre.trim()) {
      Swal.fire('El nombre es obligatorio', 'Un producto sin nombre no se puede importar.', 'warning')
      return
    }
    setEdiciones({
      ...ediciones,
      [editIndex]: {
        nombre: editForm.nombre.trim(),
        categoria: (editForm.categoria || '').trim() || 'Sin categoría',
        talle: (editForm.talle || '').trim() || 'Único',
        color: (editForm.color || '').trim() || null,
        stock: Math.max(0, Number(editForm.stock) || 0),
        precio: Math.max(0, Number(editForm.precio) || 0),
        costo: editForm.costo === '' ? null : Math.max(0, Number(editForm.costo) || 0)
      }
    })
    setEditIndex(null)
    setEditForm(null)
  }

  const confirmar = async () => {
    setPaso('progreso')
    setProgreso(0)
    if (recordarMapping && !modoLista) saveMapping({ headers, mapeo })
    const res = await importarProductos(filasNorm, setProgreso, modo)
    setResumen(res)
    setPaso('resultado')
  }

  const deshacer = async () => {
    const r = await Swal.fire({
      title: '¿Deshacer esta importación?',
      text: 'Se eliminarán los productos creados y se restaurará el stock anterior.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, deshacer',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626'
    })
    if (!r.isConfirmed) return
    setRevirtiendo(true)
    await revertirImportacion(resumen.snapshot)
    setRevirtiendo(false)
    Swal.fire({ title: 'Importación deshecha', icon: 'success', timer: 1500, showConfirmButton: false })
    onDone()
  }

  const reset = () => {
    setPaso('upload'); setHeaders([]); setFilas([]); setMapeo({})
    setNombreArchivo(''); setProgreso(0); setResumen(null)
    setVerTodas(false); setDedupeCount(0)
    setModoLista(false); setFilasLista([])
    setEdiciones({}); setEditIndex(null); setEditForm(null)
  }

  return (
    <div className={styles.wrap}>
      {/* ============ TOP BAR CON VOLVER ============ */}
      <div className={styles.topBar}>
        <button onClick={() => (onBack ? onBack() : reset())} className={styles.backBtn} aria-label="Volver al inicio">
          <ArrowLeft size={20} />
        </button>
        <h2 className={styles.title}>Importar stock</h2>
      </div>
      <p className={styles.subtitle}>Cargá tu catálogo desde un CSV en minutos</p>

      <div className={styles.headerActions}>
        <button onClick={() => setShowHelp(true)} className={styles.helpBtn}>
          <HelpCircle size={14} />
          <span className="hidden sm:inline">¿Cómo funciona?</span>
          <span className="sm:hidden">Ayuda</span>
        </button>
        <button onClick={descargarTemplate} className={styles.templateBtn}>
          <Download size={14} /> Plantilla
        </button>
      </div>

      {/* ============ UPLOAD ============ */}
      {paso === 'upload' && (
        <div
          className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); procesarArchivo(e.dataTransfer.files[0]) }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.tsv,.txt"
            style={{ display: 'none' }}
            onChange={(e) => procesarArchivo(e.target.files[0])}
          />
          <Upload size={40} className={styles.dropIcon} />
          <p className={styles.dropTitle}>
            <span className="hidden sm:inline">Arrastrá tu archivo acá</span>
            <span className="sm:hidden">Tocá para elegir tu archivo</span>
          </p>
          <p className={styles.dropHint}>
            <span className="hidden sm:inline">o tocá para elegir · CSV, TSV o TXT · hasta {MAX_FILAS.toLocaleString('es-AR')} filas</span>
            <span className="sm:hidden">CSV, TSV o TXT · hasta {MAX_FILAS.toLocaleString('es-AR')} filas</span>
          </p>
        </div>
      )}

      {/* ============ PREVIEW + MAPEO ============ */}
      {paso === 'preview' && (
        <>
          <div className={styles.fileChip}>
            <FileText size={16} style={{ flexShrink: 0 }} />
            <span className={styles.chipName}>{nombreArchivo}</span>
            <span className={styles.chipMeta}>· {modoLista ? filasLista.length : filas.length} filas</span>
          </div>

          {!modoLista && dedupeCount > 0 && (
            <div className={styles.dedupeChip}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              {dedupeCount} fila(s) duplicada(s) fusionadas: mismo producto+talle+color → el stock se sumó
            </div>
          )}

          {modoLista ? (
            <div className={styles.listaBanner}>
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Lista libre detectada:</strong> {filasNorm.length} producto(s) · talles y stock ✔ ·{' '}
                {sinPrecio > 0
                  ? `${sinPrecio} sin precio ✘ (completalos en inventario)`
                  : 'precios ✔'}
              </span>
            </div>
          ) : (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>1 · Confirmá las columnas</h3>
              <p className={styles.cardHint}>Detectamos el mapeo automático. Ajustalo si hace falta.</p>
              <div className={styles.mapGrid}>
                {CAMPOS.map(c => (
                  <div key={c.key} className={styles.mapField}>
                    <label className={styles.mapLabel}>
                      {c.label}
                      {c.requerido && mapeo[c.key] === -1 && <AlertTriangle size={12} className={styles.mapWarn} />}
                    </label>
                    <select
                      className={styles.mapSelect}
                      value={mapeo[c.key]}
                      onChange={(e) => setMapeo({ ...mapeo, [c.key]: Number(e.target.value) })}
                    >
                      <option value={-1}>No importar</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.card}>
            <div className={styles.modoRow}>
              <button type="button" onClick={() => setModo('reemplazar')} className={`${styles.modoOpt} ${modo === 'reemplazar' ? styles.modoOptActive : ''}`}>
                <span className={styles.modoTitle}>Reemplazar stock</span>
                <span className={styles.modoHint}>
                  <span className="hidden sm:inline">El stock queda como dice el archivo · para actualizar el catálogo</span>
                  <span className="sm:hidden">Queda como dice el archivo</span>
                </span>
              </button>
              <button type="button" onClick={() => setModo('sumar')} className={`${styles.modoOpt} ${modo === 'sumar' ? styles.modoOptActive : ''}`}>
                <span className={styles.modoTitle}>Sumar al stock</span>
                <span className={styles.modoHint}>
                  <span className="hidden sm:inline">Suma las unidades del archivo al stock actual · para reposición</span>
                  <span className="sm:hidden">Suma al stock actual</span>
                </span>
              </button>
            </div>
            {!modoLista && (
              <label className={styles.checkbox}>
                <input type="checkbox" checked={recordarMapping} onChange={(e) => setRecordarMapping(e.target.checked)} />
                <span>Recordar este mapeo para la próxima importación</span>
              </label>
            )}
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>{modoLista ? 'Interpretación automática' : '2 · Revisá la preview'}</h3>
            <div className={styles.prevList}>
              {filasVisibles.map((f, i) => (
                <div key={i} className={styles.prevRow} onClick={() => abrirEdicion(i)} role="button" tabIndex={0}>
                  <div className={styles.prevTop}>
                    <p className={styles.prevName}>{f.nombre}</p>
                    <span className={styles.prevBadges}>
                      {f.editada && (
                        <span className={styles.editBadge}><Pencil size={10} /> editada</span>
                      )}
                      {f.warnings?.length > 0 ? (
                        <span className={styles.warnBadge} title={f.warnings.join(' · ')}>
                          <AlertTriangle size={10} /> {f.warnings.length}
                        </span>
                      ) : (
                        <span className={styles.okBadge}><CheckCircle2 size={10} /> OK</span>
                      )}
                    </span>
                  </div>
                  <p className={styles.prevMeta}>
                    {f.talle}{f.color ? ` / ${f.color}` : ''} · {f.stock} uds · {f.precio.toLocaleString('es-AR')}
                  </p>
                  {f.warnings?.length > 0 && (
                    <p className={styles.prevWarn}>{f.warnings[0]}</p>
                  )}
                </div>
              ))}
            </div>
            <p className={styles.tapHint}><Pencil size={12} /> Tocá una fila para corregirla antes de importar</p>
            {filasNorm.length > 5 && (
              <button onClick={() => setVerTodas(!verTodas)} className={styles.verTodasBtn}>
                {verTodas ? 'Ver menos' : `Ver las ${filasNorm.length} filas`}
              </button>
            )}
            {warningsTotales > 0 && (
              <p className={styles.previewHint}>
                {filasNorm.length} filas válidas · {warningsTotales} aviso(s)
              </p>
            )}
          </div>

          <div className={styles.actions}>
            <button onClick={reset} className={styles.btnGhost}>Cancelar</button>
            <button onClick={confirmar} disabled={filasNorm.length === 0 || (!modoLista && mapeo.nombre === -1)} className={styles.btnPrimary}>
              <Package size={16} /> Importar {filasNorm.length} productos
            </button>
          </div>
        </>
      )}

      {/* ============ PROGRESO ============ */}
      {paso === 'progreso' && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Importando catálogo...</h3>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progreso}%` }} />
          </div>
          <p className={styles.progressText}>{progreso}% · {filasNorm.length} productos</p>
        </div>
      )}

      {/* ============ RESULTADO ============ */}
      {paso === 'resultado' && resumen && (
        <div className={styles.card}>
          <div className={styles.resultHead}>
            <CheckCircle2 size={28} className={styles.resultIcon} />
            <div>
              <h3 className={styles.cardTitle}>Importación completada</h3>
              <p className={styles.resultSubtitle}>{resumen.productCount} productos cargados</p>
            </div>
          </div>
          <div className={styles.resultGrid}>
            <div className={styles.resultCell}>
              <p className={styles.resultValue}>{resumen.created}</p>
              <p className={styles.resultHint}>creados</p>
            </div>
            <div className={styles.resultCell}>
              <p className={styles.resultValue}>{resumen.updated}</p>
              <p className={styles.resultHint}>actualizados</p>
            </div>
            <div className={styles.resultCell}>
              <p className={styles.resultValue}>{resumen.warnings}</p>
              <p className={styles.resultHint}>con avisos</p>
            </div>
            <div className={styles.resultCell}>
              <p className={styles.resultValue}>{resumen.skipped}</p>
              <p className={styles.resultHint}>descartados</p>
            </div>
          </div>
          {resumen.errors.length > 0 && (
            <div className={styles.errorBox}>
              <p className={styles.errorTitle}><AlertTriangle size={14} /> Grupos revertidos por error:</p>
              {resumen.errors.slice(0, 5).map((e, i) => (
                <p key={i} className={styles.errorLine}>· {e.producto}: {e.error}</p>
              ))}
            </div>
          )}
          <div className={styles.actions}>
            <button onClick={deshacer} disabled={revirtiendo} className={styles.btnDanger}>
              <Undo2 size={16} /> {revirtiendo ? 'Revirtiendo...' : 'Deshacer importación'}
            </button>
            <button onClick={onDone} className={styles.btnPrimary}>
              Ver inventario <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ============ MODAL EDITAR FILA (liviano: sin scanner ni fotos) ============ */}
      {editIndex !== null && editForm && (
        <div className={styles.modalOverlay} onClick={() => setEditIndex(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Editar producto</h3>
              <button onClick={() => setEditIndex(null)} className={styles.modalClose}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.editGrid}>
                <div className={styles.editFieldFull}>
                  <label>Nombre *</label>
                  <input className={styles.editInput} value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} />
                </div>
                {!modoLista && (
                  <div className={styles.editFieldFull}>
                    <label>Categoría</label>
                    <input className={styles.editInput} value={editForm.categoria} onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })} list="categorias-import" />
                    <datalist id="categorias-import">
                      {categoriasExistentes.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                )}
                <div className={styles.editField}>
                  <label>Talle</label>
                  <input className={styles.editInput} value={editForm.talle} onChange={(e) => setEditForm({ ...editForm, talle: e.target.value })} />
                </div>
                <div className={styles.editField}>
                  <label>Color</label>
                  <input className={styles.editInput} value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} />
                </div>
                <div className={styles.editField}>
                  <label>Stock</label>
                  <input type="number" min="0" className={styles.editInput} value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} />
                </div>
                <div className={styles.editField}>
                  <label>Precio ($)</label>
                  <input type="number" min="0" className={styles.editInput} value={editForm.precio} onChange={(e) => setEditForm({ ...editForm, precio: e.target.value })} />
                </div>
                <div className={styles.editFieldFull}>
                  <label>Costo ($)</label>
                  <input type="number" min="0" className={styles.editInput} value={editForm.costo} onChange={(e) => setEditForm({ ...editForm, costo: e.target.value })} />
                </div>
                {Number(editForm.precio) > 0 && Number(editForm.costo) > 0 && (
                  <p className={styles.gananciaHint}>
                    Ganancia por unidad: <strong>${(Number(editForm.precio) - Number(editForm.costo)).toLocaleString('es-AR')}</strong>
                    {' '}({(((Number(editForm.precio) - Number(editForm.costo)) / Number(editForm.precio)) * 100).toFixed(0)}%)
                  </p>
                )}
              </div>
              <div className={styles.actions}>
                <button onClick={() => setEditIndex(null)} className={styles.btnGhost}>Cancelar</button>
                <button onClick={guardarEdicion} className={styles.btnPrimary}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL ¿CÓMO FUNCIONA? ============ */}
      {showHelp && (
        <div className={styles.modalOverlay} onClick={() => setShowHelp(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>¿Cómo funciona?</h3>
              <button onClick={() => setShowHelp(false)} className={styles.modalClose}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.helpStep}>
                <div className={styles.helpStepNum}>1</div>
                <div>
                  <p className={styles.helpStepTitle}>Adjuntá tu archivo</p>
                  <p className={styles.helpStepDesc}>Subí un CSV exportado desde Excel, tu sistema actual, o un TXT con tu lista anotada. Hasta 5.000 filas por carga.</p>
                </div>
              </div>
              <div className={styles.helpStep}>
                <div className={styles.helpStepNum}>2</div>
                <div>
                  <p className={styles.helpStepTitle}>Revisá y corregí</p>
                  <p className={styles.helpStepDesc}>Detectamos columnas en CSV y en listas libres interpretamos stock, talle y color. Tocá cualquier fila para corregir nombre, talle, color, stock o precio antes de confirmar.</p>
                </div>
              </div>
              <div className={styles.helpStep}>
                <div className={styles.helpStepNum}>3</div>
                <div>
                  <p className={styles.helpStepTitle}>Confirmá tranquilo</p>
                  <p className={styles.helpStepDesc}>Si algo falla a mitad, ese grupo se revierte solo. Y al terminar tenés "Deshacer importación" por si te arrepentís. Las fotos y códigos se completan después desde el inventario.</p>
                </div>
              </div>
              <div className={styles.helpTip}>
                <Info size={16} />
                <span>El mapeo se puede guardar para próximas importaciones: lo hacés una vez y queda para siempre.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportProductsView