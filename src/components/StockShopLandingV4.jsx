import React from 'react';
import { motion } from 'framer-motion';

// 🐵 ÍCONOS Y COMPONENTES VISUALES
const Check = () => <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 13l4 4L19 7"/></svg>;
const Arrow = () => <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-6-6 6 6-6 6"/></svg>;
const Store = ({className='w-6 h-6 sm:w-7 sm:h-7'}) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 10.5V20h18v-9.5M3 10.5 5.2 4h13.6l2.2 6.5M3 10.5c.7 1.2 1.8 1.8 3.1 1.8s2.4-.6 3.1-1.8c.7 1.2 1.8 1.8 3.1 1.8s2.4-.6 3.1-1.8c.7 1.2 1.8 1.8 3.1 1.8s2.4-.6 3.1-1.8M7 20v-5h10v5"/></svg>;
const Box = ({className='w-6 h-6 sm:w-7 sm:h-7'}) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m12 3 8 4.2-8 4.1-8-4.1L12 3Zm-8 4.2V17l8 4 8-4V7.2M12 11.3V21"/></svg>;
const Globe = ({className='w-6 h-6 sm:w-7 sm:h-7'}) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9" strokeWidth="1.8"/><path strokeWidth="1.8" strokeLinecap="round" d="M3 12h18M12 3c2.2 2.5 3.2 5.5 3.2 9S14.2 18.5 12 21M12 3C9.8 5.5 8.8 8.5 8.8 12s1 6.5 3.2 9"/></svg>;
const Trend = ({className='w-6 h-6 sm:w-7 sm:h-7'}) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M3 17 9 11l4 4 7-8M14 7h6v6"/></svg>;
const Wpp = () => <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>;

const StorePreview = ({kind,label}) => (
  <motion.div whileHover={{ y: -5 }} className="min-w-[220px] sm:min-w-[250px] snap-center shrink-0">
    <div className="h-[260px] sm:h-[300px] rounded-[1.5rem] border-[6px] border-slate-900 bg-white shadow-lg overflow-hidden">
      <div className={`h-20 sm:h-24 ${kind==='tech'?'bg-[#08285B]':kind==='mate'?'bg-[#EED6B7]':'bg-[#DCEBD9]'}`}/>
      <div className="p-3 sm:p-4">
        <div className="h-2.5 w-20 sm:w-24 bg-slate-100 rounded mb-4"/>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {[1,2,3].map(n=><div key={n}><div className="aspect-square rounded-lg bg-slate-100"/><div className="h-1.5 bg-slate-100 rounded mt-1.5"/><div className="h-1.5 bg-slate-50 rounded mt-1 w-2/3"/></div>)}
        </div>
      </div>
    </div>
    <p className="text-xs font-bold text-slate-500 mt-2 text-center">{label}</p>
  </motion.div>
);

const Plan = ({name,desc,price,featured,children,icon}) => (
  <motion.div 
    whileHover={{ y: -8 }}
    transition={{ duration: 0.3 }}
    className={`relative min-w-[280px] sm:min-w-[310px] lg:min-w-0 snap-center shrink-0 rounded-2xl bg-white p-5 sm:p-6 ${featured?'border-2 border-[#3882F6] shadow-[0_18px_50px_rgba(56,130,246,.14)]':'border border-slate-200 shadow-sm'}`}
  >
    {featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3882F6] text-white text-[9px] font-black uppercase px-3 py-1 rounded-full">Todo en Uno</div>}
    <div className="flex items-center gap-3 mb-4 sm:mb-5">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${featured?'bg-[#3882F6] text-white':'bg-[#EEF6FF] text-[#3882F6]'}`}>{icon}</div>
      <div>
        <h3 className="font-black text-sm sm:text-base text-[#08285B]">{name}</h3>
        <p className="text-[10px] text-slate-500">{desc}</p>
      </div>
    </div>
    <div className="mb-5 sm:mb-6">
      <b className="text-xl sm:text-2xl text-[#08285B]">{price}</b><span className="text-[10px] text-slate-400"> /mes</span>
    </div>
    <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">{children}</ul>
    <button className={`w-full py-2.5 sm:py-3 rounded-xl font-bold text-xs transition-colors ${featured?'bg-[#3882F6] hover:bg-blue-700 text-white':'border border-slate-300 text-[#08285B] hover:bg-slate-50'}`}>Elegir plan</button>
  </motion.div>
);

const Item = ({children}) => <li className="flex items-center gap-2 text-xs text-slate-600"><span className="text-[#3882F6]"><Check/></span>{children}</li>;

export default function StockShopClone() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans overflow-x-hidden">
      
      {/* 1. NAVBAR */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 sm:py-5 flex items-center justify-between relative z-50 bg-white/95 backdrop-blur"
      >
        <a href="#" className="flex items-center gap-2">
          <img src="/MateLogo.png" alt="Logo StockShop" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
          <b className="text-lg sm:text-[1.65rem] tracking-tight text-[#08285B]">Stock<span className="text-[#3882F6]">Shop</span></b>
          <span className="hidden sm:block mt-1">🇦🇷</span>
        </a>
        
        <div className="hidden md:flex gap-9 text-sm font-semibold text-slate-500">
          <a href="#como-funciona" className="hover:text-blue-600 transition-colors">Cómo funciona</a>
          <a href="#planes" className="hover:text-blue-600 transition-colors">Planes</a>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button className="text-[#08285B] font-bold text-xs sm:text-sm px-2 py-1.5 hover:opacity-80 transition-opacity">
            Ingresar
          </button>
          <button className="bg-[#D98C4F] hover:bg-[#c67a3d] text-white font-bold px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-colors shadow-sm">
            Crear tienda
          </button>
        </div>
      </motion.nav>

      {/* 2. HERO SECTION */}
      <header className="relative overflow-hidden bg-gradient-to-b from-white to-[#F5F9FE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-14 pb-12 sm:pb-20 grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative z-10 text-center lg:text-left"
          >
            <span className="inline-flex bg-[#EAF3FF] text-[#3882F6] text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-[.14em] mb-4 sm:mb-6">
              Hecho para el comerciante argentino
            </span>
            
            <h1 className="text-3xl sm:text-5xl lg:text-[4.55rem] font-black leading-[1.05] sm:leading-[.98] tracking-[-.045em] text-[#08285B]">
              Tu negocio,<br/>ordenado.<br/>
              <span className="text-[#3882F6]">Tu tienda,</span><br/>funcionando.
            </h1>
            
            <p className="mt-4 sm:mt-7 max-w-xl mx-auto lg:mx-0 text-sm sm:text-lg leading-6 sm:leading-7 text-slate-500">
              Gestioná tu negocio y creá tu tienda online sin saber de sistemas ni de páginas web.
            </p>
            
            <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#D98C4F] hover:bg-[#c67a3d] text-white font-black px-7 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base shadow-[0_12px_30px_rgba(217,140,79,.24)]"
              >
                Empezar gratis <Arrow/>
              </motion.button>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-2 sm:mt-3">Probá 15 días gratis. Sin tarjeta de crédito.</p>
            
            <div className="mt-6 sm:mt-7 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
              {['Fácil de entender','Desde el celular','Sin conocimientos técnicos'].map(x => (
                <div key={x} className="flex items-center gap-1.5 text-[#08285B]">
                  <span className="text-[#3882F6]"><Check/></span>{x}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative flex justify-center items-center mt-6 lg:mt-0"
          >
            <div className="absolute w-[280px] sm:w-[400px] h-[280px] sm:h-[400px] rounded-full bg-[#E5F1FF] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"></div>
            
            <motion.img 
              whileHover={{ y: -10, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              src="/CelularLandingRecortada.png" 
              alt="Muestra de la app StockShop" 
              className="relative z-10 w-full max-w-[260px] sm:max-w-md lg:max-w-lg object-contain drop-shadow-2xl cursor-pointer"
            />
          </motion.div>

        </div>
      </header>

      {/* 3. VENDÉ, ORDENÁ, PUBLICÁ */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="border-t border-slate-100 py-10 sm:py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-[1.05fr_2fr] gap-8 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            <p className="text-[10px] font-black text-[#3882F6] uppercase tracking-[.14em] mb-2">Todo lo que necesitás</p>
            <h2 className="text-2xl sm:text-4xl font-black text-[#08285B]">Vendé · Ordená · Publicá</h2>
            <p className="text-xs sm:text-base text-slate-500 mt-2 max-w-md mx-auto lg:mx-0">Todo lo que necesitás para llevar tu negocio, en un solo lugar.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-8 text-center">
            {[{i: <Store/>, t: 'Vendé', d: 'En el mostrador y online.'}, {i: <Box/>, t: 'Ordená', d: 'Tu stock, caja y clientes.'}, {i: <Globe/>, t: 'Publicá', d: 'Tu tienda online en minutos.'}].map((item, idx) => (
              <motion.div key={idx} whileHover={{ scale: 1.05 }} className="flex flex-col items-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#EEF6FF] flex items-center justify-center text-[#3882F6] mb-2 sm:mb-4 shadow-sm">{item.i}</div>
                <b className="text-xs sm:text-lg text-[#08285B]">{item.t}</b>
                <p className="text-[10px] sm:text-sm text-slate-500 mt-0.5">{item.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 4. EJEMPLOS DE TIENDA */}
      <section className="bg-[#F7FAFE] border-y border-slate-100 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-[1fr_2.4fr] gap-8 lg:gap-10 items-center">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-[#08285B]">Así puede verse tu tienda</h2>
            <p className="text-xs sm:text-base text-slate-500 mt-2 max-w-sm mx-auto lg:mx-0">Tres ejemplos de cómo podés mostrar tu negocio.</p>
            <a href="#" className="inline-flex items-center gap-2 mt-4 text-xs sm:text-sm font-bold text-[#3882F6] hover:gap-3 transition-all">Ver más ejemplos <Arrow/></a>
          </div>
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-3 px-2 snap-x" style={{scrollbarWidth:'none',msOverflowStyle:'none'}}>
            <StorePreview kind="fashion" label="Ropa y accesorios"/>
            <StorePreview kind="mate" label="Kiosco y bebidas"/>
            <StorePreview kind="tech" label="Electrónica"/>
          </div>
        </div>
      </section>

      {/* 5. PASOS */}
      <section id="como-funciona" className="bg-[#F4F8FD] py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-[1fr_2.3fr] gap-8 lg:gap-10 items-center">
          <div className="text-center lg:text-left">
            <span className="bg-white border border-[#BFD9FF] text-[#3882F6] text-[10px] font-black uppercase px-3 py-1 rounded-full">Así de simple</span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#08285B] mt-3 leading-tight">De tus productos<br/>a tu tienda</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">Sin aprender desarrollo web.</p>
          </div>
          
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[{n:'01',t:'Cargá',d:'tus productos',i:<Box/>},{n:'02',t:'Mostrá',d:'tu tienda',i:<Store/>},{n:'03',t:'Vendé',d:'y crecé',i:<Trend/>}].map(s => (
              <motion.div key={s.n} whileHover={{ y: -3 }} className="flex flex-col items-center text-center bg-white sm:bg-[#F4F8FD] p-3 sm:px-4 rounded-2xl shadow-sm sm:shadow-none border border-slate-100 sm:border-0">
                <span className="text-[10px] font-black text-[#3882F6] mb-1">{s.n}</span>
                <div className="w-10 h-10 sm:w-[60px] sm:h-[60px] rounded-full bg-[#F4F8FD] sm:bg-white border border-[#D8E8FB] flex items-center justify-center text-[#3882F6] shadow-sm">{s.i}</div>
                <b className="text-xs sm:text-base text-[#08285B] mt-2">{s.t}</b>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PLANES (🔥 RESTAURADO: CARRUSEL HORIZONTAL FLUIDO EN MOBILE / GRID EN DESKTOP) */}
      <section id="planes" className="py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <h2 className="text-2xl sm:text-3xl font-black text-[#08285B] mb-8 text-center lg:text-left">
            Elegí cómo querés usar StockShop
          </h2>
          
          <div 
            className="flex lg:grid lg:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto pb-6 pt-2 px-2 snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <Plan name="Gestión" desc="Para ordenar tu negocio" price="$9.900" icon={<Store className="w-5 h-5"/>}>
              <Item>Ventas y caja</Item><Item>Stock y alertas</Item><Item>Clientes</Item>
            </Plan>
            
            <Plan name="Todo en Uno" desc="Negocio + tienda conectados" price="$19.500" featured icon={<Store className="w-5 h-5"/>}>
              <Item>Gestión completa</Item><Item>Tienda online</Item><Item>Stock conectado</Item>
            </Plan>
            
            <Plan name="Tienda" desc="Para vender por internet" price="$12.500" icon={<Globe className="w-5 h-5"/>}>
              <Item>Tienda online</Item><Item>Catálogo</Item><Item>Pedidos</Item>
            </Plan>
          </div>
        </div>
      </section>

      {/* 7. BANNER AZUL INFERIOR */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-8 pb-8 sm:pb-10"
      >
        <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[1.7rem] bg-[#08285B] min-h-[160px] flex items-center justify-center text-center px-4 sm:px-6 py-8 shadow-lg">
          <div className="absolute -right-20 -bottom-32 w-96 h-96 rounded-full border-[55px] border-[#1E5ED5]/20"/>
          <div className="relative z-10 flex flex-col items-center">
            
            <h2 className="text-xl sm:text-3xl font-black text-white leading-snug">
              Tu negocio no debería<br/>necesitar un manual para funcionar.
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-2">Ordená tu negocio, creá tu tienda y gestioná todo desde un solo lugar.</p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-5 bg-[#D98C4F] hover:bg-[#c67a3d] text-white font-black px-6 sm:px-8 py-3 rounded-xl text-xs sm:text-sm shadow-md"
            >
              Empezar gratis
            </motion.button>
            <p className="text-[10px] text-blue-200 mt-2">Probá 15 días gratis. Sin tarjeta de crédito.</p>
          </div>
        </div>
      </motion.section>

      {/* 8. FOOTER */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <img src="/MateLogo.png" alt="Logo StockShop" className="w-5 h-5 sm:w-6 sm:h-6 object-contain grayscale opacity-60" />
            <b className="text-sm sm:text-base text-[#08285B]">Stock<span className="text-[#3882F6]">Shop</span></b>
            <span className="text-xs">🇦🇷</span>
          </div>
          <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Tu tienda, más cerca.</p>
          <p className="text-[10px] text-slate-400">Hecho en Argentina · © {new Date().getFullYear()}</p>
        </div>
      </footer>

      {/* BOTÓN FLOTANTE WHATSAPP */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="WhatsApp" 
        className="fixed bottom-4 right-4 sm:bottom-7 sm:right-7 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#1fba59] flex items-center justify-center shadow-lg sm:shadow-xl z-50"
      >
        <Wpp/>
      </motion.button>

    </div>
  );
}