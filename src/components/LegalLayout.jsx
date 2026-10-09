import logoMate from '../assets/LogoStockShopUsable.png'

export default function LegalLayout({ titulo, actualizado, intro, secciones }) {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <nav className="max-w-3xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <img src={logoMate} alt="Logo StockShop" className="w-8 h-8 object-contain" />
          <b className="text-lg tracking-tight text-[#08285B]">Stock<span className="text-[#3882F6]">Shop</span></b>
        </a>
        <a href="/" className="text-xs font-bold text-[#3882F6] hover:opacity-80">← Volver al inicio</a>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 pb-16">
        <h1 className="text-2xl sm:text-4xl font-black text-[#08285B] mt-6">{titulo}</h1>
        <p className="text-xs text-slate-400 mt-2 mb-8">Fecha de última actualización: {actualizado}</p>

        {intro && (
          <p className="text-sm leading-7 text-slate-600 mb-8">{intro}</p>
        )}

        {secciones.map((sec, i) => (
          <section key={i} className="mb-8">
            <h2 className="text-sm sm:text-base font-black text-[#08285B] uppercase tracking-wide border-b border-slate-100 pb-2 mb-4">
              {i + 1}. {sec.titulo}
            </h2>
            <div className="space-y-3">
              {sec.arts.map((art, j) => (
                <p key={j} className="text-xs sm:text-sm leading-6 text-slate-600">{art}</p>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="border-t border-slate-100 py-6 text-center">
        <div className="flex justify-center gap-6 text-[10px] text-slate-400">
          <a href="/terminos" className="hover:text-blue-600">Términos y Condiciones</a>
          <a href="/privacidad" className="hover:text-blue-600">Política de Privacidad</a>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">Hecho en Argentina · © {new Date().getFullYear()} StockShop</p>
      </footer>
    </div>
  )
}