# STOCKFLOW — CHECKPOINT DE PROYECTO (v5 — post variantes + multi-tenant)

## 1. MODELO MULTI-LOCAL (evolucionado)
- 1 Supabase COMPARTIDO para muchos locales (separación por `local_id`) — plan Free rinde 10-15 locales; Pro cuando facture
- Locales VIEJOS (1-3): quedan en su Supabase + Cloudinary, sin e-commerce gigante
- Locales NUEVOS: Supabase compartido + AWS S3 (imágenes) + app + web
- 1 deploy Vercel por app/web (mismo repo, cambia `VITE_LOCAL_ID`)
- **APRENDIDO**: nombres comerciales ≠ `local_id` internos

## 2. ENTORNOS
- PRODUCCIÓN VIEJA (1-3): Supabase viejo + Cloudinary ajm78yuz. NO TOCAR.
- PRUEBA (5-6): Supabase rhdlvhuntoukdckdflwq + Cloudinary stockflow5y6 (preset `Productos567`)
- MULTI-TENANT NUEVO: Supabase xkmksgfqsmosyhjtwybc (cuenta novia) ✅ validado en producción
- Vercel app: stockflow-local5.vercel.app · web: stockflow-web-local5.vercel.app

## 3. STACK
**App**: React+Vite+Tailwind+Supabase+Cloudinary+SweetAlert2+lucide+@zxing
**Web**: React+Vite+CSS Modules+react-router-dom+Supabase+Cloudinary+lucide
**Arquitectura definitiva**: Supabase=datos/auth · AWS S3=solo imágenes nuevas · Vercel=hosting+serverless

## 4. BASE DE DATOS (3 SQLs versionados en docs/sql/)
- `setup-v3-completo.sql`: bases NUEVAS, 1 paste (core+gastos+web+variantes+auto-tests)
- `migracion-v3-gastos-web.sql` y `migracion-v4-variantes.sql`: bases VIVAS, EN ESE ORDEN
- **REGLA DE ORO: SQL antes que código** (deploy nuevo solo después de migrar)
- Variantes: tabla `variantes` (talle×color×stock), `detalle_ventas.variante_id`, RPC `descontar_stock_variante` (atómico + sync legacy), vista `productos_con_stock_total`, legacy deprecado pero sincronizado

## 5. ESTÁNDAR DE IMÁGENES (obligatorio)
optimizeImage(url, width): w_600 thumbs · w_150 desktop · w_1200 detalle. NUNCA url cruda.

## 6. FEATURES APP (probadas)
Todo lo del v2 + **sistema de variantes completo**: VariantManager (CRUD + sync legacy) · selector 2 pasos talle→color en SalesForm · asignación desde carrito (botón 🎯) · descuento atómico por variante · Historial y Clientes muestran talle/color real vendido · CSV por ítem con variante · cámara desde el celu (capture=environment)

## 7. FEATURES WEB (probadas)
Todo lo del v2 (navbar, home banners, categoría con filtros, detalle, carrito→WhatsApp, admin aprobación con código `stockflow2026`)
**EN DESARROLLO**: variantes visibles en la web (detalle + cards + carrito con variante)

## 8. FLUJO E-COMMERCE (validado)
App 🌐 → admin aprueba/enriquece → publicado · rechazo con nota · stock 0 oculta solo

## 9. ROADMAP WEB v2 (SKM Leyenda)
FASE A ✅ variantes en gestión · **FASE B (AHORA)**: variantes en web + cards ricas + badges + packs · FASE C: doble precio lista/efectivo + retiro/envío · FASE D: MercadoPago, CP, cupones, revendedor

## 10. ROADMAP APP
⏳ Migrar 2 Supabase viejos restantes (v3→v4) + deploy código nuevo
⏳ Google Auth + user_locales + RLS por tenant (post clientes)
⏳ Import Excel · costo_unitario snapshot · % precios web
⚠️ Rotar secrets expuestas · nombres reales de locales

## 11. DECISIONES
Checkout v1 WhatsApp · admin v1 código hardcodeado · categorías dinámicas · CSS Modules+theme.css · **hilo separado para UX/estilos (este hilo = funcional)**

## 12. RECETA NUEVO CLIENTE
1. Supabase → setup-v3-completo.sql (editar 2 locales) · 2. S3/Cloudinary · 3. Vercel app envs · 4. Vercel web envs (+VITE_ADMIN_CODE)

## ANEXOS
- SAGA CLOUDINARY: rename del cloud name arregla 401 en cuentas nuevas
- SAGA ORDEN: si el deploy nuevo explota, revisar que la migración SQL corrió antes