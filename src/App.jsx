import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Heart, 
  ShoppingCart, 
  ShieldCheck, 
  TrendingUp, 
  X, 
  Maximize2,
  Instagram,
  MessageCircle,
  ChevronUp,
  Send,
  Scissors,
  Truck
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// --- ESTILOS ADICIONALES (CSS-in-JS para el Preview) ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap');
  
  .border-text {
    -webkit-text-stroke: 1px #1A1A1A;
    color: transparent;
  }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// --- DATOS ---
const PRODUCTS = [
  {
    id: 1,
    name: "AJ1 High 'Chicago'",
    price: 195000,
    vibe: "Retro",
    image: "https://images.unsplash.com/photo-1556906781-9a412961d28c?auto=format&fit=crop&q=80&w=600",
    sizes: [38, 40, 41, 42, 43],
    popularity: [10, 45, 30, 80, 75, 95]
  },
  {
    id: 2,
    name: "Yeezy Boost 350 V2",
    price: 175000,
    vibe: "Streetwear",
    image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&q=80&w=600",
    sizes: [36, 37, 38, 39, 40],
    popularity: [40, 30, 50, 60, 55, 65]
  },
  {
    id: 3,
    name: "Dunk Low 'Panda'",
    price: 155000,
    vibe: "Streetwear",
    image: "https://images.unsplash.com/photo-1628149455678-16f37bc392f4?auto=format&fit=crop&q=80&w=600",
    sizes: [38, 39, 40, 41, 42],
    popularity: [80, 85, 90, 95, 98, 92]
  },
  {
    id: 4,
    name: "Travis Scott x AJ1 Low",
    price: 225000,
    vibe: "Limited",
    image: "https://images.unsplash.com/photo-1584735175315-9d5816e3188d?auto=format&fit=crop&q=80&w=600",
    sizes: [40, 41, 42],
    popularity: [20, 35, 60, 85, 100, 98]
  }
];

// --- COMPONENTES ---

const Navbar = ({ wishlistCount }) => (
  <nav className="fixed top-0 w-full z-50 bg-[#FDFCFB]/80 backdrop-blur-lg border-b border-black/5">
    <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
      <div className="text-2xl font-black tracking-tighter cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
        VERZING<span className="text-amber-600 group-hover:animate-pulse">.</span>
      </div>
      <div className="hidden md:flex space-x-10 text-[10px] font-bold uppercase tracking-[0.2em]">
        <a href="#catalog" className="hover:text-amber-600 transition-colors">Catálogo</a>
        <a href="#manifesto" className="hover:text-amber-600 transition-colors">Calidad</a>
        <a href="#community" className="hover:text-amber-600 transition-colors">Comunidad</a>
      </div>
      <div className="flex items-center space-x-5">
        <Search size={18} className="cursor-pointer hover:text-amber-600" />
        <div className="relative cursor-pointer group">
          <Heart size={18} className="group-hover:text-rose-500 transition-colors" />
          {wishlistCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {wishlistCount}
            </span>
          )}
        </div>
        <ShoppingCart size={18} className="cursor-pointer" />
      </div>
    </div>
  </nav>
);

const Hero = () => (
  <section className="relative min-h-screen flex items-center pt-20 px-6 bg-[#FDFCFB] overflow-hidden">
    <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center text-left">
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <h4 className="text-amber-600 font-bold tracking-[0.5em] text-[10px] uppercase mb-6 flex items-center gap-2">
          <span className="w-8 h-[1px] bg-amber-600"></span>
          Drop 2025 / Selección Auténtica
        </h4>
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-10 uppercase">
          Camina<br />Tu <span className="border-text italic">Verdad.</span>
        </h1>
        <p className="text-gray-500 max-w-sm mb-12 text-sm leading-relaxed font-medium">
          Curaduría premium de calzado Triple A. Para quienes entienden que el estilo no se negocia, se camina.
        </p>
        <button 
          onClick={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })}
          className="bg-black text-white px-10 py-5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-amber-600 transition-all"
        >
          Explorar Catálogo
        </button>
      </div>
      <div className="relative hidden md:flex items-center justify-center">
        <div className="w-full aspect-square bg-neutral-100 rounded-[3rem] relative overflow-hidden flex items-center justify-center">
          <span className="text-[20vw] font-black text-white select-none">VZ</span>
        </div>
      </div>
    </div>
  </section>
);

const ProductCard = ({ product, onClick, index }) => (
  <div 
    className="group cursor-pointer animate-in fade-in duration-700"
    onClick={() => onClick(product)}
  >
    <div className="aspect-[4/5] bg-neutral-50 rounded-[2.5rem] mb-8 relative overflow-hidden flex items-center justify-center">
      <span className="text-8xl font-black text-white group-hover:scale-110 transition-transform duration-1000">VZ</span>
      <div className="absolute top-6 left-6 bg-white/80 backdrop-blur px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest text-amber-600">
        {product.vibe}
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 translate-y-20 group-hover:translate-y-0 transition-transform duration-500">
        <button className="bg-white text-black px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
          Ver Detalles <Maximize2 size={10} />
        </button>
      </div>
    </div>
    <div className="flex justify-between items-start text-left">
      <div>
        <h3 className="font-black text-xl mb-1 tracking-tight group-hover:text-amber-600 transition-colors uppercase">{product.name}</h3>
        <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest italic">Standard Triple A</p>
      </div>
      <p className="font-black text-lg">$ {product.price.toLocaleString('es-CO')}</p>
    </div>
  </div>
);

const ProductModal = ({ product, onClose }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  if (!product) return null;

  const chartData = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Hoy'],
    datasets: [{
      data: product.popularity,
      borderColor: '#D97706',
      backgroundColor: 'rgba(217, 119, 6, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 0
    }]
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-5xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-8 right-8 z-10 p-2 hover:bg-neutral-100 rounded-full transition-colors">
          <X size={24} />
        </button>
        <div className="md:w-1/2 bg-neutral-50 flex items-center justify-center p-12">
          <div className="w-full aspect-square bg-white rounded-3xl flex items-center justify-center shadow-inner relative">
            <span className="text-9xl font-black text-neutral-50 select-none">VZ</span>
            <div className="absolute top-6 left-6 flex items-center gap-2">
              <ShieldCheck className="text-amber-600" size={16} />
              <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 italic">Verificación Triple A</span>
            </div>
          </div>
        </div>
        <div className="md:w-1/2 p-12 flex flex-col text-left">
          <span className="text-amber-600 font-bold text-[10px] uppercase tracking-[0.3em] mb-4">{product.vibe} Collection</span>
          <h2 className="text-5xl font-black tracking-tighter mb-2 leading-none uppercase">{product.name}</h2>
          <p className="text-2xl font-bold mb-10">$ {product.price.toLocaleString('es-CO')}</p>
          <div className="mb-10 bg-neutral-50 p-6 rounded-3xl border border-neutral-100">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2"><TrendingUp size={12} /> Tendencia de Demanda</p>
              <span className="text-[8px] font-black bg-rose-100 text-rose-600 px-2 py-1 rounded uppercase tracking-widest animate-pulse">Hot Drop</span>
            </div>
            <div className="h-[120px]">
              <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }} />
            </div>
          </div>
          <div className="mb-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-5">Tallas Disponibles (EU)</p>
            <div className="grid grid-cols-5 gap-3">
              {product.sizes.map(size => (
                <button key={size} onClick={() => setSelectedSize(size)} className={`py-4 text-xs font-bold rounded-2xl border-2 transition-all ${selectedSize === size ? 'border-black bg-black text-white' : 'border-neutral-100 hover:border-black'}`}>{size}</button>
              ))}
            </div>
          </div>
          <button className="w-full bg-black text-white py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-amber-600 transition-all flex items-center justify-center gap-3">Consultar en WhatsApp</button>
        </div>
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="bg-[#0A0A0A] text-white pt-24 pb-12 px-6 overflow-hidden">
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-16 pb-20 border-b border-white/5">
        <div className="space-y-8 text-left">
          <div className="text-4xl font-black tracking-tighter italic">VERZING<span className="text-amber-600">.</span></div>
          <p className="text-zinc-400 max-w-sm text-sm leading-relaxed font-medium">Nacidos en el asfalto, curados para la autenticidad. No vendemos solo calzado, entregamos la confianza para caminar tu propia verdad.</p>
          <div className="flex space-x-6">
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer"><Instagram size={16} /></div>
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer text-[10px] font-bold">TK</div>
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer"><MessageCircle size={16} /></div>
          </div>
        </div>
        <div className="bg-zinc-900/50 p-10 rounded-[2.5rem] border border-white/5 text-left">
          <h4 className="text-xl font-bold mb-4 uppercase tracking-tighter">Únete al próximo Drop</h4>
          <p className="text-zinc-500 text-xs mb-8">Sé el primero en enterarte de las colecciones limitadas y lanzamientos exclusivos Triple A.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input type="email" placeholder="Tu email" className="flex-1 bg-black border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-amber-600 transition-colors" />
            <button className="bg-white text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center gap-2">Suscribirse <Send size={12} /></button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-12 py-20 text-left">
        <div>
          <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 mb-8 italic">Catálogo</h5>
          <ul className="space-y-4 text-sm text-zinc-400 font-medium">
            <li className="hover:text-white cursor-pointer">Streetwear Essentials</li>
            <li className="hover:text-white cursor-pointer">Retro Classics</li>
            <li className="hover:text-white cursor-pointer">Limited Editions</li>
          </ul>
        </div>
        <div>
          <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 mb-8 italic">Calidad Verzing</h5>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <ShieldCheck className="text-amber-600" size={20} />
              <div><p className="text-xs font-bold uppercase">Triple A Certificado</p></div>
            </div>
            <div className="flex items-start gap-4">
              <Truck className="text-amber-600" size={20} />
              <div><p className="text-xs font-bold uppercase">Envío Nacional</p></div>
            </div>
          </div>
        </div>
      </div>
      <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 italic">Verzing Footwear Co. • © 2025 All Rights Reserved.</div>
        <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group hover:text-amber-600 transition-colors">Volver arriba <ChevronUp size={14} className="group-hover:-translate-y-1 transition-transform" /></button>
      </div>
    </div>
  </footer>
);

// --- APP PRINCIPAL ---

export default function App() {
  const [activeVibe, setActiveVibe] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => activeVibe === 'all' || p.vibe === activeVibe);
  }, [activeVibe]);

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-amber-100 selection:text-amber-900 overflow-x-hidden">
      <style>{styles}</style>
      <Navbar wishlistCount={0} />
      <Hero />
      <section id="catalog" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="sticky top-20 z-40 bg-[#FDFCFB]/95 py-8 border-b border-black/5 flex flex-col md:flex-row justify-between items-end gap-10 mb-20 text-left">
            <div>
              <h2 className="text-6xl font-black tracking-tighter mb-4 uppercase">The Drop</h2>
              <p className="text-gray-400 font-medium text-sm">Mostrando {filteredProducts.length} modelos curados.</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto no-scrollbar overflow-x-auto pb-2 md:pb-0">
              {['all', 'Streetwear', 'Retro', 'Limited'].map(vibe => (
                <button key={vibe} onClick={() => setActiveVibe(vibe)} className={`px-8 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border-2 ${activeVibe === vibe ? 'bg-black text-white border-black' : 'border-neutral-100 hover:border-black'}`}>{vibe === 'all' ? 'Todos' : vibe}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
            {filteredProducts.map((p, idx) => (
              <ProductCard key={p.id} product={p} index={idx} onClick={setSelectedProduct} />
            ))}
          </div>
        </div>
      </section>
      <Footer />
      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  );
}