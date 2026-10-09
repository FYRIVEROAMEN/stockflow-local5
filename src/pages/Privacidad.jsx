import LegalLayout from '../components/LegalLayout'

const SECCIONES = [
  { titulo: '1. Responsable y alcance', arts: [
    'StockShop (en adelante, "la Plataforma") es responsable del tratamiento de los datos personales que recoja a través de sus sitios y aplicaciones, conforme la Ley Nacional de Protección de Datos Personales N° 25.326, su Decreto Reglamentario 1558/01 y normativa complementaria vigente en la República Argentina.',
    'Esta Política describe qué datos recogemos, con qué finalidad, cómo los almacenamos y qué derechos tenés como titular.'
  ]},
  { titulo: '2. Datos que recopilamos', arts: [
    'Datos de cuenta: nombre, dirección de correo electrónico y, si te registrás con Google, el perfil básico que Google nos comparte (nombre, email y foto de perfil).',
    'Datos del comercio: nombre del local, teléfono de contacto, dirección, redes sociales, catálogo de productos, precios, imágenes y registros de ventas que el propio usuario carga.',
    'Datos de uso: información técnica mínima necesaria para operar el servicio (sesión, dispositivo, registros de error).'
  ]},
  { titulo: '3. Finalidad del tratamiento', arts: [
    'Prestar el servicio de gestión de stock, ventas y publicación de la tienda online del comercio.',
    'Autenticar al usuario y proteger la seguridad de las cuentas.',
    'Enviar comunicaciones operativas del servicio (novedades, mantenimientos, avisos de la plataforma).',
    'Elaborar estadísticas agregadas y anónimas de uso para mejorar el producto.'
  ]},
  { titulo: '4. Base legal y consentimiento', arts: [
    'El tratamiento se funda en el consentimiento expreso del titular al registrarse y aceptar los Términos y Condiciones, y en la relación contractual de prestación del servicio.'
  ]},
  { titulo: '5. Proveedores y encargados de tratamiento', arts: [
    'Los datos se alojan y procesan mediante proveedores de infraestructura en la nube (Supabase para base de datos y autenticación, Cloudinary para almacenamiento de imágenes, Cloudflare para distribución y seguridad), quienes actúan como encargados de tratamiento bajo estándares de confidencialidad y seguridad.',
    'Cuando el usuario se autentica con Google, Google actúa como proveedor de identidad independiente con su propia política de privacidad.'
  ]},
  { titulo: '6. Cesión de datos', arts: [
    'StockShop NO vende ni cede datos personales a terceros con fines comerciales.',
    'Los datos de contacto que un comercio publica en su tienda online (nombre, WhatsApp, redes) se muestran al público porque el propio comercio decide publicarlos como vidriera comercial.'
  ]},
  { titulo: '7. Cookies y almacenamiento local', arts: [
    'La Plataforma utiliza almacenamiento local del navegador (localStorage) para mantener la sesión y preferencias del usuario, y cookies técnicas necesarias para el funcionamiento. No utilizamos cookies publicitarias de terceros sin consentimiento adicional.'
  ]},
  { titulo: '8. Conservación de los datos', arts: [
    'Los datos se conservan mientras la cuenta esté activa. Las cuentas con inactividad total superior a 180 días podrán ser archivadas o eliminadas previa notificación, conforme los Términos y Condiciones.',
    'Los registros de ventas y comprobantes se conservan por los plazos que la normativa fiscal aplicable imponga al comercio.'
  ]},
  { titulo: '9. Derechos del titular (Ley 25.326)', arts: [
    'El titular puede ejercer los derechos de acceso, rectificación, actualización y supresión de sus datos personales enviando una solicitud al correo de contacto indicado al final de esta política, sin costo.',
    'El derecho de acceso puede ejercerse en los términos del art. 14 inc. 3 de la Ley 25.326.'
  ]},
  { titulo: '10. Seguridad', arts: [
    'Aplicamos medidas técnicas y organizativas razonables: autenticación gestionada, políticas de seguridad a nivel de fila (RLS) en la base de datos, cifrado en tránsito y control de acceso por rol y por comercio.',
    'Ningún sistema es absolutamente seguro: ante un incidente de seguridad que comprometa datos personales, notificaremos a los titulares afectados y a la autoridad de aplicación.'
  ]},
  { titulo: '11. Menores de edad', arts: [
    'El servicio está dirigido a mayores de 18 años con capacidad legal para contratar. No recopilamos deliberadamente datos de menores.'
  ]},
  { titulo: '12. Cambios en esta política', arts: [
    'Podemos actualizar esta Política. Los cambios sustanciales se anunciarán mediante avisos dentro de la plataforma. El uso continuado implica aceptación.'
  ]},
  { titulo: '13. Contacto', arts: [
    'Consultas y ejercicio de derechos: soporte@stockshop.com.ar (reemplazar por el correo real de contacto).'
  ]},
  { titulo: 'Aviso legal obligatorio', arts: [
    'LA DIRECCIÓN NACIONAL DE PROTECCIÓN DE DATOS PERSONALES, órgano de control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.'
  ]}
]

export default function Privacidad() {
  return <LegalLayout titulo="Política de Privacidad" actualizado="Octubre 2026" secciones={SECCIONES} />
}