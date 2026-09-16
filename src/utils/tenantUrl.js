// ============================================
// STOCKFLOW · tenantUrl (GESTIÓN)
// La gestión enlaza a la WEB (otra app, otro puerto en dev)
// ============================================
export const urlMiTienda = (host) => {
  const dev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const baseWeb = import.meta.env.VITE_WEB_URL || 'http://localhost:5174'
  return dev ? `${baseWeb}/?dominio=${host}` : `https://${host}`
}