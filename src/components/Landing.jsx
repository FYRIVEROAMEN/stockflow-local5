import { useState } from 'react';

export default function Landing() {
  const handleIngresar = () => {
    window.location.href = '/login';
  };

  const handleCrearCuenta = () => {
    window.location.href = '/crear-cuenta';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-[#3882F6] selection:text-white overflow-x-hidden">
      
      {/* 1. NAVBAR */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto bg-[#F8FAFC]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0B2B5B] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-sm">
            S
          </div>
          <span className="font-extrabold text-2xl text-[#0B2B5B] tracking-tight">StockFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleIngresar} className="text-[#0B2B5B] font-semibold text-sm transition-colors hidden sm:block">
            Ingresar
          </button>
          <button onClick={handleCrearCuenta} className="bg-[#0B2B5B] hover:bg-[#153b75] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-md">
            Crear tienda
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION (Mobile-First) */}
      <section className="max-w-7xl mx-auto px-6 pt-12 md:pt-20 pb-16 relative flex flex-col lg:flex-row items-center gap-12">
        <div className="text-center lg:text-left lg:w-1/2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-100 shadow-sm text-sm font-semibold text-[#0B2B5B] mb-6">
            <span className="text-[#3882F6]">⚡</span> Adiós a las 10 planillas
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#0B2B5B] mb-6 leading-[1.1] tracking-tight">
            Gestión exacta y tu <span className="text-[#3882F6]">tienda online</span> en minutos.
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Sin pelear con plataformas caras ni tener el stock desincronizado. Vendé en el mostrador y en la web desde tu celular, pagando un precio justo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
            <button onClick={handleCrearCuenta} className="w-full sm:w-auto bg-[#D98C4F] hover:bg-[#c47c43] text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-lg hover:-translate-y-0.5">
              Abrir mi tienda gratis
            </button>
            <button onClick={handleIngresar} className="w-full sm:w-auto text-[#0B2B5B] font-bold px-8 py-4 rounded-xl text-md transition-all hover:bg-slate-100">
              Ya tengo cuenta →
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-4 font-medium">14 días de prueba · Sin tarjeta de crédito</p>
        </div>

        {/* PHONE MOCKUP UI */}
        <div className="lg:w-1/2 w-full flex justify-center relative z-10 mt-8 lg:mt-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#3882F6]/20 blur-[80px] rounded-full"></div>
          <div className="relative w-[300px] h-[600px] bg-slate-50 rounded-[3rem] border-[10px] border-slate-900 shadow-2xl overflow-hidden ring-4 ring-slate-200">
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-2xl w-32 mx-auto z-20"></div>
            <div className="w-full h-full flex flex-col text-left">
              <div className="bg-[#0B2B5B] px-5 pt-10 pb-6 text-white rounded-b-3xl shadow-sm">
                <p className="text-blue-200 text-xs font-medium mb-1">Hola, Tienda Zen 👋</p>
                <h3 className="text-2xl font-bold">Ventas de hoy</h3>
                <p className="text-3xl font-black mt-2">$ 342.500</p>
              </div>
              <div className="p-4 flex-1 bg-slate-50">
                <div className="flex justify-between items-center mb-4 mt-2">
                  <h4 className="font-bold text-slate-800">Alertas de Stock</h4>
                  <span className="text-xs font-bold text-[#3882F6]">Ver todo</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-slate-800">Buzo Oversize</p>
                      <p className="text-xs text-slate-500">Talle L · Negro</p>
                    </div>
                    <span className="bg-red-100 text-red-700 text-[10px] uppercase font-black px-2 py-1 rounded-md">Agotado</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-slate-800">Zapatillas Urbanas</p>
                      <p className="text-xs text-slate-500">Talle 42 · Blanco</p>
                    </div>
                    <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-black px-2 py-1 rounded-md">Quedan 2</span>
                  </div>
                </div>
                <div className="mt-8 flex justify-center">
                  <div className="bg-[#3882F6] text-white font-bold text-sm py-3 px-6 rounded-full shadow-lg flex items-center gap-2">
                    <span>+</span> Nueva Venta
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SOCIAL PROOF BANNER */}
      <section className="border-y border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">Diseñado para comercios argentinos</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
            {/* Logos falsos con texto para rellenar */}
            <span className="text-xl font-black font-serif text-slate-800">Zen Store</span>
            <span className="text-xl font-black tracking-tighter text-slate-800">URBAN<span className="font-light">CO</span></span>
            <span className="text-xl font-bold italic text-slate-800">Minimal BA</span>
            <span className="text-xl font-black text-slate-800">SNEAKER<span className="text-[#3882F6]">X</span></span>
          </div>
        </div>
      </section>

      {/* 4. FEATURES (Chau emojis, hola SVGs) */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-widest text-[#3882F6] uppercase mb-3">Todo Incluido</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-[#0B2B5B]">Una herramienta, no diez planillas</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="bg-slate-50 p-8 rounded-2xl border border-gray-100 hover:border-[#3882F6]/30 transition-colors">
              <div className="w-12 h-12 bg-[#0B2B5B] rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              </div>
              <h4 className="text-xl font-bold text-[#0B2B5B] mb-3">Stock Sincronizado</h4>
              <p className="text-slate-600 leading-relaxed">Una sola fuente de stock. Si vendés en el mostrador, se pausa en la web. Cero ventas sin mercadería.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-slate-50 p-8 rounded-2xl border border-gray-100 hover:border-[#3882F6]/30 transition-colors">
              <div className="w-12 h-12 bg-[#3882F6] rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
              </div>
              <h4 className="text-xl font-bold text-[#0B2B5B] mb-3">Ventas y POS Celular</h4>
              <p className="text-slate-600 leading-relaxed">Cobrá rápido desde el panel. Cierre de caja integrado, control de gastos y métricas en tiempo real.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 p-8 rounded-2xl border border-gray-100 hover:border-[#3882F6]/30 transition-colors">
              <div className="w-12 h-12 bg-[#D98C4F] rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
              </div>
              <h4 className="text-xl font-bold text-[#0B2B5B] mb-3">Tienda Web Integrada</h4>
              <p className="text-slate-600 leading-relaxed">Tu catálogo publicado al instante con tu marca y link propio. Sin configurar integraciones complejas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING (Atacando el dolor) */}
      <section className="bg-[#F8FAFC] py-24 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B2B5B] mb-4">Simple y sin comisiones sorpresa</h2>
          <p className="text-lg text-slate-600 mb-12">Olvidate de pagar más cuando más vendés. Un solo plan, todo incluido.</p>
          
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-between text-left gap-8">
            <div>
              <h4 className="text-2xl font-bold text-[#0B2B5B] mb-2">Plan StockFlow</h4>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-4xl font-black text-[#0B2B5B]">$19.500</span>
                <span className="text-slate-500 font-medium">/ mes (ARS)</span>
              </div>
              <ul className="space-y-3 text-slate-600 font-medium">
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Tienda online + Sistema POS</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Cero comisiones por venta web</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Soporte por WhatsApp</li>
              </ul>
            </div>
            <div className="w-full md:w-auto flex flex-col items-center">
              <button onClick={handleCrearCuenta} className="w-full md:w-auto bg-[#0B2B5B] hover:bg-[#153b75] text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-md mb-3">
                Comenzar prueba gratis
              </button>
              <p className="text-sm text-slate-500">14 días gratis · Cancelás cuando quieras</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA (Para el que scrolleó hasta abajo) */}
      <section className="bg-[#0B2B5B] py-20 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#3882F6]/20 rounded-full blur-3xl"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
            Llevá tu negocio al próximo nivel
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Dejá de perder tiempo cruzando datos. Creá tu cuenta hoy y empezá a vender ordenado.
          </p>
          <button onClick={handleCrearCuenta} className="bg-[#D98C4F] hover:bg-[#c47c43] text-white font-bold px-10 py-4 rounded-xl text-xl transition-all shadow-xl hover:-translate-y-1">
            Crear mi tienda ahora
          </button>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="font-bold text-white text-xl tracking-tight">StockFlow</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-400 font-medium mb-4 md:mb-0">
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Contacto</a>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            © {new Date().getFullYear()} StockFlow · Hecho en Argentina 🇦🇷
          </p>
        </div>
      </footer>

    </div>
  );
}