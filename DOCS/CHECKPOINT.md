# STOCKFLOW — CHECKPOINT DE PROYECTO (v2 — post e-commerce v1)
Estado al cerrar el e-commerce funcional y antes del modelo de variantes.

## 1. MODELO MULTI-LOCAL
- 1 Supabase cada 2 locales (separación por `local_id` dentro de la misma DB)
- 1 Cloudinary cada 2 locales (plan free por cuenta)
- 1 deploy Vercel por local (mismo repo app, cambia `VITE_LOCAL_ID`)
- 1 deploy Vercel por web (repo `stockflow-web`, mismo patrón)
- **APRENDIDO**: Los deploys "local5/local6" son nombres comerciales; los `local_id` internos son 1 y 2.

## 2. ENTORNOS
- PRODUCCIÓN (locales 1-3): Supabase viejo + Cloudinary ajm78yuz. NO TOCAR.
- PRUEBA/STAGING (locales 5-6):
  - Supabase: rhdlvhuntoukdckdflwq (secrets en .env.local / Vercel, NUNCA en docs)
  - Cloudinary: stockflow5y6, preset unsigned `Productos567`
  - Vercel app: stockflow-local5.vercel.app (VITE_LOCAL_ID=2 apunta a local 6 comercial)
  - Vercel web: stockflow-web-local5.vercel.app (pendiente)

## 3. STACK
**App (gestión)**: React + Vite + Tailwind + Supabase + Cloudinary + SweetAlert2 + lucide-react + @zxing/library
**Web (e-commerce)**: React + Vite + CSS Modules + react-router-dom + Supabase + Cloudinary + lucide-react
- Sin Node backend (Vercel Serverless Functions cuando llegue MercadoPago)

## 4. BASE DE DATOS
- Setup v2 (locales nuevos): locales, clientes, productos, ventas, pagos, detalle_ventas + vista clientes_con_deuda + funciones + RLS abierto + índices
- Migración v3 (gastos + capa web): productos.costo · tabla gastos (RLS) · productos: web_estado (no_enviado|pendiente|publicado|rechazado), web_nota_rechazo, web_descripcion, web_fotos (jsonb, máx 3), web_destacado, web_precio (null = hereda precio), web_enviado_en, web_aprobado_en
- **PENDIENTE**: Migración v4 (modelo de variantes)

## 5. ESTÁNDAR DE IMÁGENES (obligatorio)
optimizeImage(url, width): inyecta w_${width},f_auto,q_auto,dpr_auto.
w_600 thumbs mobile · w_150 desktop · w_1200 lightbox/detalle.
Subida guarda URL con f_auto,q_auto. NUNCA imagen_url cruda en <img>.

## 6. FEATURES APP (probadas en 5-6)
Inventario CRUD + barcode + desactivar/reactivar · paginación "Ver más" + scroll-top · ventas con carrito/descuentos/pago parcial · deudas FIFO + trigger · Clientes (pagos, WhatsApp, editar, eliminar) · Historial · Métricas (selector de mes, ganancia neta con CMV, 6 KPIs, tops, stock bajo, exports CSV reales) · Gastos (CRUD mensual + categorías + desglose) · Rentabilidad (Ventas − CMV − Gastos = Neta, aviso "vendido sin costo") · botón 🌐 en cards (enviar/cancelar/quitar/reenviar a web con confirmación).

## 7. FEATURES WEB (probadas en web de prueba)
Navbar hamburguesa + adm + WhatsApp flotante · Home (3 banners deslizables, categorías, destacados/novedades) · Categoría con filtros de talle/color · Detalle de producto (galería, talles, descripción, agregar al carrito) · Carrito con cantidades + envío a WhatsApp · Admin de aprobación (gate con código `stockflow2026`, pestañas pendientes/publicados, edición con descripción/fotos/precio web/destacado, rechazar con nota, quitar de web).

## 8. FLUJO E-COMMERCE (validado)
App "envía a web" → dueño aprueba en web (enriquece: descripción, ≤3 fotos, destacado, precio web opcional) → publicado.
Rechazo con nota visible en la app. Stock 0 o inactivo → web oculta sola.
v1 SIN pago online: carrito → pedido por WhatsApp con mensaje estructurado.

## 9. ROADMAP WEB v2 (inspirado en SKM Leyenda — skmleyenda.com.ar)
**FASE A (estructural, URGENTE)**: Modelo de variantes en gestión (talles normalizados + colores como lista) — fundación para todo lo demás
**FASE B (visible)**: Barra de anuncio arriba + cards ricas (selectores de color/talle en la card + quick-add) + badges (Nuevo, % OFF, "X colores") + sección Packs mayoristas
**FASE C (comercial)**: Doble precio lista/efectivo con controlador de % + carrito con retiro/envío
**FASE D (después)**: MercadoPago, envíos por CP, cupones, cuenta revendedor

## 10. ROADMAP APP
- Fix doble cómputo: mercadería NO es gasto (solo costo → CMV)
- Pulido UX mobile de Gastos/Métricas
- Deploy local 6 (VITE_LOCAL_ID=1)
- Import desde Excel (SheetJS)
- Google Login + tabla user_locales (roles dueño/empleado)
- v2: costo_unitario snapshot en detalle_ventas · % precios web · MercadoPago
- SEGURIDAD: rotar secrets de Cloudinary y Supabase expuestas en chats
- Nombres reales de locales para tabla locales
- Guardar setup SQL como setup-v4.sql versionado

## 11. DECISIONES DE DISEÑO
- Web e-commerce: CSS Modules + theme.css con variables (theming por local después)
- Checkout v1: carrito → WhatsApp (cero costo de integración, valida demanda)
- Admin v1: gate con código hardcodeado (v2: Supabase Auth)
- Categorías dinámicas desde productos.categoria (sin tabla nueva)
- Referencia de diseño: skmleyenda.com.ar (Tiendanube)

## 12. RECETA: NUEVO PAR DE LOCALES
1. Supabase nuevo → correr setup SQL (v2+v3) editando solo los 2 locales
2. Cloudinary nuevo → preset unsigned
3. Vercel: importar repo app, envs con VITE_LOCAL_ID impar/par
4. Vercel web: importar repo web, envs con VITE_LOCAL_ID + VITE_NOMBRE_LOCAL + VITE_WHATSAPP + Cloudinary vars + VITE_ADMIN_CODE
5. Ticket/verificación si la cuenta nueva falla (ver anexo)

## ANEXO: SAGA CLOUDINARY (para no repetirla)
Cuenta nueva daba 401 "Unknown API key" en uploads unsigned aunque consola y presets estaban OK. Se resolvió RENOMBRANDO el cloud name (forzó re-sincronización del entorno). Si una cuenta nueva falla igual: probar rename antes de quemar horas en soporte.