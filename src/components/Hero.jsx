import React from 'react';

/**
 * Hero Section: El primer impacto visual de la marca.
 */
const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 px-6 bg-[#FDFCFB] overflow-hidden">
      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
        {/* Texto de Impacto */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h4 className="text-amber-600 font-bold tracking-[0.5em] text-[10px] uppercase mb-6 flex items-center gap-2">
            <span className="w-8 h-[1px] bg-amber-600"></span>
            Drop 2025 / Selección Auténtica
          </h4>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-10">
            CAMINA<br />TU <span className="text-transparent border-text italic" style={{ WebkitTextStroke: '1px #1A1A1A' }}>VERDAD.</span>
          </h1>
          <p className="text-gray-500 max-w-sm mb-12 text-sm leading-relaxed font-medium">
            Curaduría premium de calzado Triple A. Para quienes entienden que el estilo no se negocia, se camina.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })}
              className="bg-black text-white px-10 py-5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-amber-600 transition-all active:scale-95"
            >
              Explorar Catálogo
            </button>
          </div>
        </div>

        {/* Imagen/Decoración Abstracta */}
        <div className="relative hidden md:flex items-center justify-center">
          <div className="w-full aspect-square bg-neutral-100 rounded-[3rem] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[20vw] font-black text-white select-none group-hover:scale-110 transition-transform duration-1000">VZ</span>
            </div>
            <div className="absolute bottom-12 left-12 bg-white/90 backdrop-blur p-8 rounded-3xl shadow-2xl max-w-[240px] border border-white/20">
              <p className="text-[10px] font-black text-amber-600 mb-2 uppercase tracking-widest italic">Edición Limitada</p>
              <p className="text-lg font-black mb-1 leading-none tracking-tight">AJ1 'Chicago'</p>
              <p className="text-gray-400 text-[10px] font-medium leading-relaxed">El estándar más alto en calidad Triple A disponible hoy.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;