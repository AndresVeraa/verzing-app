import React from 'react';
import { 
  Instagram, 
  MessageCircle, 
  ShieldCheck, 
  Truck, 
  ChevronUp,
  Send
} from 'lucide-react';

/**
 * Componente Footer - Estilo 4 (Premium Dark)
 * Incluye secciones de Newsletter, Navegación, Calidad y Redes Sociales.
 */
const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0A0A0A] text-white pt-24 pb-12 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Bloque Superior: Newsletter & Marca */}
        <div className="grid lg:grid-cols-2 gap-16 pb-20 border-b border-white/5">
          <div className="space-y-8">
            <div className="text-4xl font-black tracking-tighter italic">
              VERZING<span className="text-amber-600">.</span>
            </div>
            <p className="text-zinc-400 max-w-sm text-sm leading-relaxed font-medium">
              Nacidos en el asfalto, curados para la autenticidad. No vendemos solo calzado, entregamos la confianza para caminar tu propia verdad.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300">
                <Instagram size={16} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 font-bold text-[10px]">
                TK
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300">
                <MessageCircle size={16} />
              </a>
            </div>
          </div>

          <div className="bg-zinc-900/50 p-10 rounded-[2.5rem] border border-white/5">
            <h4 className="text-xl font-bold mb-4 uppercase tracking-tighter">Únete al próximo Drop</h4>
            <p className="text-zinc-500 text-xs mb-8 font-medium">Sé el primero en enterarte de las colecciones limitadas y lanzamientos exclusivos Triple A.</p>
            <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Tu email" 
                className="flex-1 bg-black border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-amber-600 transition-colors"
              />
              <button className="bg-white text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center gap-2">
                Suscribirse <Send size={12} />
              </button>
            </form>
          </div>
        </div>

        {/* Bloque Medio: Navegación Estructurada */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 py-20">
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 mb-8 italic">Catálogo</h5>
            <ul className="space-y-4 text-sm text-zinc-400 font-medium">
              <li><a href="#catalog" className="hover:text-white transition-colors">Streetwear Essentials</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Retro Classics</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Limited Editions</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Próximos Drops</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 mb-8 italic">Soporte</h5>
            <ul className="space-y-4 text-sm text-zinc-400 font-medium">
              <li><a href="#" className="hover:text-white transition-colors">Guía de Tallas</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Envíos Nacionales</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cuidado del Calzado</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Preguntas Frecuentes</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 mb-8 italic">Empresa</h5>
            <ul className="space-y-4 text-sm text-zinc-400 font-medium">
              <li><a href="#manifesto" className="hover:text-white transition-colors">Nuestro Manifiesto</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Garantía Verzing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contacto Directo</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Puntos de Entrega</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 mb-8 italic">Calidad Verzing</h5>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <ShieldCheck className="text-amber-600" size={20} />
                <div>
                  <p className="text-xs font-bold uppercase">Triple A Certificado</p>
                  <p className="text-[10px] text-zinc-500 font-medium">Materiales seleccionados de alta gama.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Truck className="text-amber-600" size={20} />
                <div>
                  <p className="text-xs font-bold uppercase">Envío Nacional</p>
                  <p className="text-[10px] text-zinc-500 font-medium">Cobertura total en todo el país.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bloque Inferior: Legales y Copyright */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 italic">
            Verzing Footwear Co. • © 2025 All Rights Reserved.
          </div>
          <div className="flex gap-8 text-[9px] font-black uppercase tracking-widest text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">Política de Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos de Servicio</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
          <button 
            onClick={scrollToTop} 
            className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group hover:text-amber-600 transition-colors"
          >
            Volver arriba <ChevronUp size={14} className="group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;