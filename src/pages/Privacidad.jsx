import LegalLayout from '../components/LegalLayout'

const SECCIONES = [
  { titulo: 'Datos Personales Recopilados', arts: [
    'Para el funcionamiento y acceso a la plataforma mediante autenticación externa segura (Google OAuth), StockShop recopila únicamente los datos mínimos indispensables provistos por el perfil del usuario:',
    'Datos de identificación: Nombre completo y dirección de correo electrónico (cuenta de Gmail).',
    'Datos de navegación y técnicos: Dirección IP, tipo de navegador y registros de sesión necesarios para garantizar la seguridad operativa y el acceso correcto al sistema de inventarios.',
    'Nota: StockShop no almacena contraseñas de cuentas de Google ni datos bancarios, ya que las transacciones y pagos se realizan mediante pasarelas externas configuradas de forma descentralizada por cada comercio.'
  ]},
  { titulo: 'Finalidad del Tratamiento de los Datos', arts: [
    'La información recopilada se utiliza exclusiva y limitadamente para los siguientes fines operativos:',
    'Permitir el acceso autenticado y seguro del comerciante a su panel de control e inventario.',
    'Identificar al propietario de la cuenta comercial dentro de la plataforma y gestionar los roles de entretiendas.',
    'Enviar notificaciones críticas relativas al servicio, seguridad o actualizaciones del sistema.',
    'Cumplir con obligaciones legales, requerimientos judiciales o normativas vigentes en la República Argentina.'
  ]},
  { titulo: 'Uso de Datos Agregados y Anonimizados con Fines Estadísticos', arts: [
    'El Usuario acepta y autoriza expresamente a StockShop a utilizar la información relativa a volúmenes y rotación de inventarios de forma estrictamente anonimizada y agregada (despojada de cualquier dato personal, nombre, CUIT o identificación comercial). Esta información podrá ser procesada para elaborar informes de tendencias del mercado, análisis sectoriales y estadísticas comerciales destinadas a optimizar la cadena de valor y el ecosistema de la plataforma.'
  ]},
  { titulo: 'Confidencialidad y No Comercialización', arts: [
    'StockShop no vende, alquila, cede ni comercializa bajo ningún concepto los datos personales o la información de inventarios de los usuarios a terceros. Los datos almacenados son de uso estrictamente confidencial y se gestionan bajo estándares de seguridad informática en servidores en la nube.'
  ]},
  { titulo: 'Uso de Cookies y Tecnologías de Sesión', arts: [
    'La Aplicación utiliza cookies técnicas y tokens de sesión estrictamente necesarios para mantener la sesión activa del usuario autenticado y recordar sus preferencias dentro del sistema de inventarios, sin realizar seguimiento publicitario invasivo ni perfiles de rastreo externo.'
  ]},
  { titulo: 'Integración con Servicios de Terceros', arts: [
    'La plataforma utiliza infraestructura en la nube y proveedores tecnológicos seguros (tales como Supabase y Google Cloud) para la autenticación y el almacenamiento de datos. El tratamiento de los datos realizado por dichos proveedores externos se rige por sus propias políticas de privacidad y seguridad.'
  ]},
  { titulo: 'Derechos de los Usuarios (Derechos ARCO)', arts: [
    'El titular de los datos personales cuenta con el derecho irrevocable de solicitar en cualquier momento el acceso, actualización, rectificación o la eliminación total de su cuenta y sus registros asociados de nuestra base de datos.',
    'En Argentina: El titular de los datos tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses. La Dirección Nacional de Protección de Datos Personales, Órgano de Control de la Ley Nº 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.'
  ]},
  { titulo: 'Modificaciones a la Política de Privacidad', arts: [
    'Los desarrolladores se reservan el derecho absoluto de actualizar la presente Política de Privacidad en cualquier momento para adaptarla a cambios normativos o tecnológicos. Cualquier modificación sustancial será informada dentro de la plataforma.'
  ]}
]

export default function Privacidad() {
  return (
    <LegalLayout
      titulo="Política de Privacidad de StockShop"
      actualizado="8 de octubre de 2026"
      intro={'La presente Política de Privacidad describe cómo StockShop ("la Aplicación" o "nosotros") recopila, utiliza, almacena y protege los datos personales de los usuarios y comerciantes ("el Usuario") que utilizan nuestra plataforma digital de gestión de inventarios y directorio comercial B2B en el sitio web www.stockshop.com.ar. Al registrarse, acceder o utilizar nuestros servicios, el Usuario acepta las prácticas descritas en esta política, la cual se rige bajo la Ley Nacional de Protección de Datos Personales N° 25.326 de la República Argentina.'}
      secciones={SECCIONES}
    />
  )
}
   