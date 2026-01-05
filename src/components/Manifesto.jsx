import React from 'react';

/**
 * Manifesto: Sección educativa sobre la calidad Triple A de Verzing.
 */
const Manifesto = () => {
  const pillars = [
    { id: '01', title: 'Curaduría Triple A', desc: 'Materiales genuinos y procesos de fabricación que replican la experiencia original al 100%.' },
    { id: '02', title: 'Acabado Artesanal', desc: 'Cada par pasa por un control de calidad manual: costuras, pegado y simetría perfecta.' },
    { id: '03', title: 'Estilo sin Filtro', desc: 'Seleccionamos solo modelos que marcan tendencia y definen el Streetwear contemporáneo.' }
  ];

  return (
    <section id="manifesto" className="py-40 bg-white border-y border-black/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-24">
          <h2 className="text-5xl font-black tracking-tighter mb-6 uppercase">El Estándar <span className="text-amber-600">Verzing</span></h2>
          <p className="text-gray-400 font-medium">No somos una tienda de reventa más. Somos un filtro de autenticidad y calidad superior.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-16">
          {pillars.map(item => (
            <div key={item.id} className="group cursor-default">
              <p className="text-5xl font-black text-neutral-100 group-hover:text-amber-600/20 transition-colors mb-6">{item.id}</p>
              <h3 className="font-bold text-xl mb-4 uppercase tracking-tight">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Manifesto;