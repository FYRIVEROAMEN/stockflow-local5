import { supabase, LOCAL_ID } from './authService'

// ============ LÍMITES (anti-DoS involuntario) ============
export const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
export const MAX_FILAS = 5000

// ============ STORAGE DE MAPEO POR LOCAL ============
const mappingKey = (localId) => `import-mapping-${localId}`
export const loadSavedMapping = () => {
  try { return JSON.parse(localStorage.getItem(mappingKey(LOCAL_ID)) || 'null') }
  catch { return null }
}
export const saveMapping = (mapeo) => {
  try { localStorage.setItem(mappingKey(LOCAL_ID), JSON.stringify(mapeo)) } catch {}
}

// ============ TEMPLATE ============
export const descargarTemplate = () => {
  const csv = [
    'nombre,categoria,talle,color,stock,precio,costo,barcode',
    'Remera Nike estampada,Hombre,L,Negro,10,15000,8000,7791234567890',
    'Jean clasico,Hombre,42,Azul,5,25000,12000,',
    'Vestido floreado,Mujer,M,Rojo,3,30000,15000,'
  ].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'plantilla_import_stock.csv'
  link.click()
}

// ============ MAPEO v2 ============
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
const variantes = (h) => {
  const n = norm(h)
  return [n, n.replace(/s$/, ''), n.replace(/es$/, '')]
}
const SINONIMOS = {
  nombre: ['nombre', 'producto', 'articulo', 'descripcion', 'detalle', 'item', 'nombreproducto'],
  categoria: ['categoria', 'rubro', 'category', 'seccion', 'familia', 'grupo', 'linea'],
  talle: ['talle', 'talla', 'size', 'medida'],
  color: ['color', 'colores'],
  stock: ['stock', 'cantidad', 'unidades', 'cant', 'existencia', 'bultos', 'stockactual'],
  precio: ['precio', 'price', 'precioventa', 'pvp', 'preciounitario', 'valor', 'preciovta'],
  costo: ['costo', 'cost', 'preciocosto', 'costounitario', 'costocompra'],
  barcode: ['barcode', 'codigo', 'ean', 'sku', 'codigobarras', 'codigodebarras', 'upc']
}

export const autoMapeo = (headers) => {
  const saved = loadSavedMapping()
  if (saved && saved.headers && saved.headers.length === headers.length) {
    const iguales = saved.headers.every((h, i) => h === headers[i])
    if (iguales) return saved.mapeo
  }
  const mapeo = {}
  const usadas = new Set()
  Object.keys(SINONIMOS).forEach(campo => {
    const idx = headers.findIndex((h, i) =>
      !usadas.has(i) && variantes(h).some(v => SINONIMOS[campo].includes(v))
    )
    if (idx >= 0) usadas.add(idx)
    mapeo[campo] = idx
  })
  return mapeo
}

// sanitiza barcode (saca espacios, puntos, comas)
const sanitizarBarcode = (v) => {
  if (!v) return null
  const s = String(v).replace(/\s/g, '').replace(/[.,]/g, '')
  return /^[\w-]+$/.test(s) ? s : null
}

// ============ DICCIONARIO DE COLORES (exhaustivo) ============
// base → todas las variantes de género y plural que normalizan a ESE base
const COLORES_BASE = {
  // neutros
  negro:    ['negro','negra','negros','negras'],
  blanco:   ['blanco','blanca','blancos','blancas'],
  gris:     ['gris','grises'],
  marron:   ['marron','marrones','marrón'],
  beige:    ['beige','beiges'],
  crudo:    ['crudo','cruda','crudos','crudas'],
  crema:    ['crema','cremas'],
  nude:     ['nude'],
  topo:     ['topo','topos'],
  vison:    ['vison','visón','visones'],
  camel:    ['camel'],
  // cálidos
  rojo:     ['rojo','roja','rojos','rojas'],
  naranja:  ['naranja','naranjas','naranjo'],
  amarillo: ['amarillo','amarilla','amarillos','amarillas'],
  mostaza:  ['mostaza','mostazas'],
  rosa:     ['rosa','rosas','rosado','rosada','rosados','rosadas'],
  fucsia:   ['fucsia','fucsias','fucsia'],
  magenta:  ['magenta'],
  coral:    ['coral','corales'],
  salmon:   ['salmon','salmón','salmones'],
  bordo:    ['bordo','bordó','bordoes','bordeaux'],
  terracota:['terracota','terracotas'],
  durazno:  ['durazno','duraznos'],
  // fríos
  azul:     ['azul','azules'],
  celeste:  ['celeste','celestes'],
  turquesa: ['turquesa','turquesas'],
  aguamarina:['aguamarina','aguamarinas'],
  verde:    ['verde','verdes'],
  menta:    ['menta','mentas'],
  oliva:    ['oliva','olivas','olivo'],
  violeta:  ['violeta','violetas'],
  purpura:  ['purpura','púrpura','púrpuras','purpuras'],
  lila:     ['lila','lilas'],
  lavanda:  ['lavanda','lavandas'],
  indigo:   ['indigo','índigo','indigos'],
  // metálicos
  dorado:   ['dorado','dorada','dorados','doradas','oro'],
  plateado: ['plateado','plateada','plateados','plateadas','plata'],
  bronce:   ['bronce','bronces'],
  cobre:    ['cobre','cobres'],
  champagne:['champagne','champan'],
  // especiales
  vino:     ['vino','vinos','borravino'],
  marfil:   ['marfil'],
  cafe:     ['cafe','café','cafe','cafes','café'],
  chocolate:['chocolate','chocolates']
}

// lista plana de TODAS las variantes (para match rápido)
const TODOS_LOS_COLORES = []
Object.entries(COLORES_BASE).forEach(([base, variantes]) => {
  variantes.forEach(v => TODOS_LOS_COLORES.push({ variante: v, base }))
})
// ordenadas por longitud DESC para que "bordó" matchee antes que "bor"
TODOS_LOS_COLORES.sort((a, b) => b.variante.length - a.variante.length)

const esColor = (v) => {
  const n = String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return TODOS_LOS_COLORES.some(c => c.variante.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === n)
}
const normalizarColor = (v) => {
  const n = String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const m = TODOS_LOS_COLORES.find(c => c.variante.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === n)
  return m ? m.base : v
}

// ============ HERENCIA DE PRECIO DENTRO DEL MISMO PRODUCTO ============
const propagarPrecios = (filas) => {
  const grupos = new Map()
  filas.forEach(f => {
    const k = `${(f.nombre || '').toLowerCase()}|${(f.categoria || '').toLowerCase()}`
    if (!grupos.has(k)) grupos.set(k, [])
    grupos.get(k).push(f)
  })
  grupos.forEach(list => {
    const precio = list.find(f => f.precio > 0)?.precio
    const costo = list.find(f => f.costo > 0)?.costo
    list.forEach(f => {
      if (precio && f.precio === 0) {
        f.precio = precio
        f.warnings = (f.warnings || []).filter(w => !w.includes('Sin precio'))
        f.warnings.push(`Precio heredado del mismo producto: $${precio.toLocaleString('es-AR')}`)
      }
      if (costo && !f.costo) f.costo = costo
    })
  })
  return filas
}

// ============ NORMALIZACIÓN + DEDUPE + REPARACIÓN ============
export const normalizarFilas = (filas, mapeo) => {
  const num = (v) => {
    if (v === null || v === undefined || String(v).trim() === '') return null
    const n = parseFloat(String(v).replace(/[^\d.,-]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.'))
    return isNaN(n) ? null : n
  }

  const mapa = new Map()
  let dedupeCount = 0

  filas.forEach((fila, i) => {
    const warnings = []
    const filaRep = [...fila]
    const valor = (campo) => (mapeo[campo] >= 0 ? (filaRep[mapeo[campo]] ?? '') : '')

    // REPARACIÓN DE FILAS CORRIDAS (sentido común de almacenero)
    const reparos = []
    if (mapeo.color >= 0 && mapeo.stock >= 0) {
      const c = String(filaRep[mapeo.color] || '').trim()
      const s = String(filaRep[mapeo.stock] || '').trim()
      if (c && !isNaN(Number(c)) && s === '') {
        filaRep[mapeo.stock] = c
        filaRep[mapeo.color] = ''
        reparos.push('stock reubicado')
      }
    }
    if (mapeo.categoria >= 0 && mapeo.color >= 0) {
      const cat = String(filaRep[mapeo.categoria] || '').trim()
      const col = String(filaRep[mapeo.color] || '').trim()
      if (esColor(cat) && !col) {
        filaRep[mapeo.color] = cat
        filaRep[mapeo.categoria] = ''
        reparos.push('color reubicado')
      }
    }
    if (reparos.length) warnings.push(`Fila reparada: ${reparos.join(' + ')}`)

    const nombre = String(valor('nombre') || '').trim()
    if (!nombre) return

    const precioRaw = num(valor('precio'))
    const stockRaw = num(valor('stock'))
    const costoRaw = num(valor('costo'))
    const barcodeRaw = valor('barcode')
    const barcodeSan = sanitizarBarcode(barcodeRaw)
    const colorRaw = String(valor('color') || '').trim()

    if (precioRaw === null || precioRaw <= 0) warnings.push('Sin precio válido → quedará en $0')
    if (stockRaw === null || stockRaw < 0) warnings.push('Sin stock válido → quedará en 0')
    if (costoRaw === null) warnings.push('Sin costo cargado → revisar en inventario')
    if (barcodeRaw && barcodeSan === null) warnings.push('Código con caracteres raros → se ignorará')

    const nueva = {
      fila: i + 2,
      nombre,
      categoria: String(valor('categoria') || '').trim() || 'Sin categoría',
      talle: String(valor('talle') || '').trim() || 'Único',
      color: colorRaw ? normalizarColor(colorRaw) : null,
      stock: stockRaw ?? 0,
      precio: precioRaw ?? 0,
      costo: costoRaw ?? null,
      barcode: barcodeSan,
      warnings
    }

    const clave = `${norm(nombre)}|${norm(nueva.categoria)}|${norm(nueva.talle)}|${norm(nueva.color)}`
    if (mapa.has(clave)) {
      const prev = mapa.get(clave)
      prev.stock += nueva.stock
      prev.warnings.push('Fila duplicada fusionada (stock sumado)')
      dedupeCount++
    } else {
      mapa.set(clave, nueva)
    }
  })

  return { filas: propagarPrecios([...mapa.values()]), dedupeCount }
}

// ============ ROLLBACK ============
const revertirSnapshot = async (snap) => {
  try {
    if (snap.variantesCreadas?.length) await supabase.from('variantes').delete().in('id', snap.variantesCreadas)
    if (snap.productosCreados?.length) await supabase.from('productos').delete().in('id', snap.productosCreados)
    for (const v of snap.variantesActualizadas || []) {
      await supabase.from('variantes').update({ stock: v.stock, precio: v.precio, costo: v.costo, barcode: v.barcode }).eq('id', v.id)
    }
    for (const p of snap.productosActualizados || []) {
      await supabase.from('productos').update({ stock: p.stock }).eq('id', p.id)
    }
  } catch (e) {
    console.error('Error en rollback:', e)
  }
}

export const revertirImportacion = async (snapshot) => revertirSnapshot(snapshot)

// ============ IMPORT REAL (merge + modos + rollback por grupo) ============
const keyProd = (nombre, categoria) => `${(nombre || '').toLowerCase().trim()}|${(categoria || '').toLowerCase().trim()}`
const keyVar = (talle, color) => `${(talle || '').toLowerCase().trim()}|${(color || '').toLowerCase().trim()}`

export const importarProductos = async (filasNormalizadas, onProgress, modo = 'reemplazar') => {
  const localId = LOCAL_ID
  if (!localId) throw new Error('No hay sesión activa')

  const resumen = {
    created: 0, updated: 0, skipped: 0,
    warnings: 0, errors: [], total: filasNormalizadas.length,
    productCount: 0, variantCount: 0,
    snapshot: { productosCreados: [], variantesCreadas: [], variantesActualizadas: [], productosActualizados: [] }
  }

  const grupos = new Map()
  filasNormalizadas.forEach(f => {
    const k = keyProd(f.nombre, f.categoria)
    if (!grupos.has(k)) grupos.set(k, { nombre: f.nombre, categoria: f.categoria, filas: [] })
    grupos.get(k).filas.push(f)
  })
  const lista = [...grupos.values()]
  resumen.productCount = lista.length
  resumen.variantCount = filasNormalizadas.length

  if (!lista.length) return resumen

  const { data: prodsEx, error: eProd } = await supabase
    .from('productos').select('id, nombre, categoria, stock').eq('local_id', localId)
  if (eProd) throw eProd
  const mapProd = new Map((prodsEx || []).map(p => [keyProd(p.nombre, p.categoria), p]))

  let mapVar = new Map()
  const idsEx = [...mapProd.values()].map(p => p.id)
  if (idsEx.length) {
    const { data: varsEx, error: eVar } = await supabase
      .from('variantes').select('id, producto_id, talle, color, stock, precio, costo, barcode').in('producto_id', idsEx)
    if (eVar) throw eVar
    mapVar = new Map((varsEx || []).map(v => [`${v.producto_id}|${keyVar(v.talle, v.color)}`, v]))
  }

  let hechas = 0
  const reportar = () => {
    hechas++
    onProgress?.(Math.min(100, Math.round((hechas / lista.length) * 100)))
  }

  const procesarGrupo = async (g) => {
    const gSnap = { productosCreados: [], variantesCreadas: [], variantesActualizadas: [], productosActualizados: [] }
    try {
      const primera = g.filas[0]
      const stockTotal = g.filas.reduce((s, f) => s + (f.stock || 0), 0)
      const existente = mapProd.get(keyProd(g.nombre, g.categoria))
      let productoId

      if (!existente) {
        const { data, error } = await supabase.from('productos').insert({
          nombre: g.nombre, categoria: g.categoria,
          talle: primera.talle, color: primera.color,
          precio: primera.precio, costo: primera.costo,
          stock: stockTotal, barcode: primera.barcode,
          activo: true, local_id: localId
        }).select().single()
        if (error) throw error
        productoId = data.id
        gSnap.productosCreados.push(data.id)
        resumen.created++
      } else {
        productoId = existente.id
        gSnap.productosActualizados.push({ id: productoId, stock: existente.stock })
        resumen.updated++
      }

      for (const f of g.filas) {
        const kv = `${productoId}|${keyVar(f.talle, f.color)}`
        const varEx = mapVar.get(kv)
        if (f.warnings?.length) resumen.warnings++
        if (varEx) {
          const nuevoStock = modo === 'sumar'
            ? (Number(varEx.stock) || 0) + (f.stock || 0)
            : f.stock
          const { error } = await supabase.from('variantes')
            .update({ stock: nuevoStock, precio: f.precio, costo: f.costo, barcode: f.barcode })
            .eq('id', varEx.id)
          if (error) throw error
        } else {
          const { data, error } = await supabase.from('variantes').insert({
            producto_id: productoId, talle: f.talle, color: f.color,
            stock: f.stock, precio: f.precio, costo: f.costo,
            barcode: f.barcode, activo: true
          }).select().single()
          if (error) throw error
          gSnap.variantesCreadas.push(data.id)
        }
      }

      const { data: vs } = await supabase.from('variantes').select('stock').eq('producto_id', productoId)
      const suma = (vs || []).reduce((s, v) => s + (Number(v.stock) || 0), 0)
      await supabase.from('productos').update({ stock: suma }).eq('id', productoId)

      resumen.snapshot.productosCreados.push(...gSnap.productosCreados)
      resumen.snapshot.variantesCreadas.push(...gSnap.variantesCreadas)
      resumen.snapshot.variantesActualizadas.push(...gSnap.variantesActualizadas)
      resumen.snapshot.productosActualizados.push(...gSnap.productosActualizados)
    } catch (err) {
      await revertirSnapshot(gSnap)
      resumen.skipped += g.filas.length
      resumen.errors.push({ producto: g.nombre, error: err.message })
    }
    reportar()
  }

  for (let i = 0; i < lista.length; i += 5) {
    await Promise.all(lista.slice(i, i + 5).map(procesarGrupo))
  }
  onProgress?.(100)
  return resumen
}

// ============ MODO LISTA LIBRE (TXT / pegado de WhatsApp) ============
export const esListaLibre = (headers) => {
  if (headers.length === 1) return true
  return autoMapeo(headers).nombre === -1
}

// parser heurístico de línea: "remeras azules basicas 4 talle L $15.000"
export const parsearListaLibre = (lineas) => {
  const filas = []
  lineas.forEach((linea, i) => {
    let texto = ` ${String(linea).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')} `
    const warnings = ['Interpretado de lista libre: revisá nombre, stock y talle']

    // precio: $1.500 / $ 1500
    let precio = 0
    const mPrecio = texto.match(/\$\s*([\d.,]+)/)
    if (mPrecio) {
      precio = parseFloat(mPrecio[1].replace(/\.(?=\d{3})/g, '').replace(',', '.')) || 0
      texto = texto.replace(mPrecio[0], ' ')
    }

    // stock: primer número suelto
    let stock = 0
    const mStock = texto.match(/\s(\d+)\s/)
    if (mStock) { stock = Number(mStock[1]); texto = texto.replace(mStock[0], ' ') }

    // talle: "talle m" / "talles m" / "talle: 42"
    let talle = 'Único'
    const mTalle = texto.match(/talle?s?\s*[:]?\s*([a-z0-9]{1,4})\b/)
    if (mTalle) { talle = mTalle[1].toUpperCase(); texto = texto.replace(mTalle[0], ' ') }

    // color: buscar el primer color que aparezca (ya normalizado a base)
    let color = null
    for (const c of TODOS_LOS_COLORES) {
      const v = c.variante.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const re = new RegExp(`\\b${v}\\b`)
      if (re.test(texto)) {
        color = c.base
        texto = texto.replace(re, ' ')
        break
      }
    }

    // nombre: el resto, limpio
    const nombre = texto
      .replace(/\b(color|talle|talles|talla|udd?s|unidades)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (!nombre) return

    filas.push({
      fila: i + 1, nombre, categoria: 'Sin categoría', talle, color,
      stock, precio, costo: null, barcode: null, warnings
    })
  })
  return { filas: propagarPrecios(filas), dedupeCount: 0 }
}

// ============ PDF DE TEXTO (sin OCR: el texto ya está adentro) ============
// extrae las líneas del PDF reconstruyendo filas por posición Y
export const extraerLineasPdf = async (file) => {
  const pdfjs = await import('pdfjs-dist')
  const workerMod = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerMod.default

  const buf = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: buf }).promise
  const lineas = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const tc = await page.getTextContent()
    const filas = new Map()

    tc.items.forEach(it => {
      const str = (it.str || '').trim()
      if (!str) return
      // agrupa por altura (Y) con tolerancia de 4pt = misma línea visual
      const key = Math.round(it.transform[5] / 4) * 4
      if (!filas.has(key)) filas.set(key, [])
      filas.get(key).push({ x: it.transform[4], str: it.str })
    })

    // filas de arriba a abajo (Y del PDF crece hacia arriba → descendente)
    // y palabras de izquierda a derecha (X ascendente)
    ;[...filas.entries()]
      .sort((a, b) => b[0] - a[0])
      .forEach(([, items]) => {
        const linea = items
          .sort((a, b) => a.x - b.x)
          .map(i => i.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
        if (linea) lineas.push(linea)
      })
  }
  return lineas
}