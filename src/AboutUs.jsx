import React from 'react';
import { Truck, CreditCard, Target, Eye } from 'lucide-react';

const AboutUs = ({ cmsTextos = {} }) => {
  const {
    aboutMission = 'Nuestra misión es ofrecer calzado de la más alta calidad, cuidadosamente seleccionado para clientes que valoran autenticidad y estilo.',
    aboutVision = 'Ser la referencia regional en calzado premium, impulsando comunidad y cultura urbana a través de colecciones exclusivas.',
    shippingMethods = 'Envíos 24-72h con tracking. Opciones estándar y exprés disponibles.',
    paymentMethods = 'Aceptamos tarjetas, PSE, transferencias y pagos en cuotas.',
    welcomeMessage = 'Bienvenido a Verzing — selección curada para auténticos coleccionistas.',
    designImage = ''
  } = cmsTextos;

  const cards = [
    { icon: Target, title: 'Nuestra Misión', content: aboutMission, color: 'amber' },
    { icon: Eye, title: 'Nuestra Visión', content: aboutVision, color: 'emerald' },
    { icon: Truck, title: 'Métodos de Envío', content: shippingMethods, color: 'blue' },
    { icon: CreditCard, title: 'Métodos de Pago', content: paymentMethods, color: 'purple' }
  ];

  return (
    <section className="min-h-screen bg-[#FDFCFB] pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h4 className="text-amber-600 font-bold tracking-[0.3em] sm:tracking-[0.5em] text-[9px] sm:text-[10px] uppercase mb-3 sm:mb-4 flex items-center justify-center gap-2">
            <span className="w-6 sm:w-8 h-[1px] bg-amber-600"></span>
            Conoce Verzing
            <span className="w-6 sm:w-8 h-[1px] bg-amber-600"></span>
          </h4>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4 sm:mb-6">
            Sobre <span className="text-amber-600">Nosotros</span>
          </h1>
          <p className="text-neutral-500 max-w-xl mx-auto text-sm sm:text-base leading-relaxed px-2">
            {welcomeMessage}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-10 sm:mb-12">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div 
                key={idx}
                className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-neutral-100 hover:border-amber-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-${card.color}-50 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className={`text-${card.color}-600 sm:hidden`} />
                  <Icon size={24} className={`text-${card.color}-600 hidden sm:block`} />
                </div>
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight mb-2 sm:mb-3">{card.title}</h3>
                <p className="text-neutral-600 leading-relaxed text-sm sm:text-base">{card.content}</p>
              </div>
            );
          })}
        </div>

        {/* Design Image (opcional) */}
        {designImage && (
          <div className="flex justify-center animate-in fade-in zoom-in-95 duration-500 px-2">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full">
              <img src={designImage} alt="Verzing Design" className="w-full h-48 sm:h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>
          </div>
        )}

        {/* Brand Values - Mobile: vertical stack, Desktop: horizontal */}
        <div className="mt-12 sm:mt-16 text-center">
          {/* Mobile: Vertical cards */}
          <div className="sm:hidden space-y-3">
            <div className="bg-black text-white rounded-2xl py-4 px-6 flex justify-between items-center">
              <p className="text-[10px] uppercase tracking-widest text-neutral-400">Autenticidad</p>
              <p className="text-xl font-black">100%</p>
            </div>
            <div className="bg-black text-white rounded-2xl py-4 px-6 flex justify-between items-center">
              <p className="text-[10px] uppercase tracking-widest text-neutral-400">Calidad</p>
              <p className="text-xl font-black">Triple A</p>
            </div>
            <div className="bg-black text-white rounded-2xl py-4 px-6 flex justify-between items-center">
              <p className="text-[10px] uppercase tracking-widest text-neutral-400">Envío</p>
              <p className="text-xl font-black">24-72h</p>
            </div>
          </div>
          {/* Desktop: Horizontal pill */}
          <div className="hidden sm:inline-flex items-center gap-6 md:gap-8 py-5 md:py-6 px-8 md:px-10 bg-black text-white rounded-full">
            <div className="text-center">
              <p className="text-xl md:text-2xl font-black">100%</p>
              <p className="text-[8px] uppercase tracking-widest text-neutral-400">Autenticidad</p>
            </div>
            <div className="w-px h-6 md:h-8 bg-white/20"></div>
            <div className="text-center">
              <p className="text-xl md:text-2xl font-black">Triple A</p>
              <p className="text-[8px] uppercase tracking-widest text-neutral-400">Calidad</p>
            </div>
            <div className="w-px h-6 md:h-8 bg-white/20"></div>
            <div className="text-center">
              <p className="text-xl md:text-2xl font-black">24-72h</p>
              <p className="text-[8px] uppercase tracking-widest text-neutral-400">Envío</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
