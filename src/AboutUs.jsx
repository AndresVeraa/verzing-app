import React from 'react';

const AboutUs = ({ mision, vision, envio, pagos, designImage }) => (
  <section className="max-w-3xl mx-auto py-16 px-6 text-center animate-in fade-in">
    <h1 className="text-4xl font-black mb-8 tracking-tight">Sobre Nosotros</h1>
    <div className="grid gap-10">
      <div className="bg-white rounded-2xl shadow p-8">
        <h2 className="text-xl font-bold mb-2 text-amber-600">Misión</h2>
        <p className="text-neutral-700 text-base leading-relaxed">{mision}</p>
      </div>
      <div className="bg-white rounded-2xl shadow p-8">
        <h2 className="text-xl font-bold mb-2 text-amber-600">Visión</h2>
        <p className="text-neutral-700 text-base leading-relaxed">{vision}</p>
      </div>
      <div className="bg-white rounded-2xl shadow p-8">
        <h2 className="text-xl font-bold mb-2 text-amber-600">Métodos de Envío</h2>
        <ul className="list-disc list-inside text-neutral-700 text-base">
          {envio?.list?.map((item, idx) => <li key={idx}>{item}</li>)}
        </ul>
      </div>
      <div className="bg-white rounded-2xl shadow p-8">
        <h2 className="text-xl font-bold mb-2 text-amber-600">Métodos de Pago</h2>
        <ul className="list-disc list-inside text-neutral-700 text-base">
          {pagos?.list?.map((item, idx) => <li key={idx}>{item}</li>)}
        </ul>
      </div>
      {designImage && (
        <div className="flex justify-center mt-8">
          <img src={designImage} alt="Diseño" className="rounded-xl shadow w-48 h-48 object-cover" />
        </div>
      )}
    </div>
  </section>
);

export default AboutUs;
