import { useEffect } from 'react'
import { ExternalLink } from 'lucide-react'

// 🎯 agregar un caso nuevo = 1 objeto acá
export const CASOS = [
  {
    nombre: 'Moon Importados',
    rubro: 'Indumentaria · Mujer y Hombre',
    url: 'https://moonimportados.stockshop.com.ar',
    screenshot: '/casos/moon-mobile.png'
  }
]

//  Caso real vestido de phone protagonista: notch, botones y glow
export function CasoCard({ c }) {
  return (
    <a
      href={c.url}
      target="_blank"
      rel="noopener noreferrer"
      className="min-w-[230px] sm:min-w-[260px] snap-center shrink-0 block group"
      title={`Visitar ${c.nombre}`}
    >
      <div className="relative">
        {/* botones físicos del phone (volumen + power) */}
        <span className="absolute -left-[11px] top-16 w-[4px] h-7 bg-slate-900 rounded-l-md" />
        <span className="absolute -left-[11px] top-26 w-[4px] h-7 bg-slate-900 rounded-l-md" />
        <span className="absolute -right-[11px] top-20 w-[4px] h-11 bg-slate-900 rounded-r-md" />

        {/* frame del phone */}
        <div className="relative h-[540px] sm:h-[520px] rounded-[2.2rem] border-[8px] border-slate-900 bg-white shadow-[0_24px_60px_rgba(8,40,92,.28)] overflow-hidden transition-shadow group-hover:shadow-[0_28px_70px_rgba(217,140,79,.35)]">
          {/* notch */}
          <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-900 rounded-full z-20" />

          <img
            src={c.screenshot}
            alt={`Tienda real: ${c.nombre}`}
            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          

          {/* invitación a visitar */}
         <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-transparent px-3 pt-12 pb-5 flex items-center justify-center gap-1.5 text-white text-[10px] font-black tracking-wide opacity-90 group-hover:opacity-100 transition-opacity z-10">
   VISITAR TIENDA REAL <ExternalLink size={11} />
</span>

          {/* home indicator */}
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-16 h-1 bg-white/80 rounded-full z-20" />
        </div>
      </div>
      <p className="text-xs font-bold text-slate-500 mt-2.5 text-center">
        {c.nombre} · <span className="text-[#D98C4F]">{c.rubro}</span>
      </p>
    </a>
  )
}

// 🎠 auto-scroll suave: avanza una card cada `cada` ms
//    se pausa con el mouse encima o al tocar (mobile)
//    respeta prefers-reduced-motion (accesibilidad)
export function useAutoScroll(ref, { cada = 4500 } = {}) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let pausado = false
    const parar = () => { pausado = true }
    const seguir = () => { pausado = false }
    el.addEventListener('pointerenter', parar)
    el.addEventListener('pointerleave', seguir)
    el.addEventListener('touchstart', parar, { passive: true })
    el.addEventListener('touchend', seguir)

    const t = setInterval(() => {
      if (pausado) return
      const card = el.querySelector(':scope > *')
      const paso = card ? card.offsetWidth + 20 : 300
      const max = el.scrollWidth - el.clientWidth
      if (el.scrollLeft >= max - 8) el.scrollTo({ left: 0, behavior: 'smooth' })
      else el.scrollBy({ left: paso, behavior: 'smooth' })
    }, cada)

    return () => {
      clearInterval(t)
      el.removeEventListener('pointerenter', parar)
      el.removeEventListener('pointerleave', seguir)
      el.removeEventListener('touchstart', parar)
      el.removeEventListener('touchend', seguir)
    }
  }, [ref, cada])
}