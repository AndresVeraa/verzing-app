import React, { useState } from 'react';
import { X, ShieldCheck, TrendingUp } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

/**
 * ProductModal: Ficha técnica detallada con gráfico de demanda y selector de tallas.
 */
const ProductModal = ({ product, onClose }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  
  if (!product) return null;

  const chartData = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Hoy'],
    datasets: [{
      label: 'Demanda',
      data: product.popularity,
      borderColor: '#D97706',
      backgroundColor: 'rgba(217, 119, 6, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false, min: 0, max: 110 } }
  };

  const handleWhatsApp = () => {
    if (!selectedSize) {
      alert("Por favor selecciona tu talla antes de continuar.");
      return;
    }
    const msg = `Hola Verzing! Me interesan los ${product.name} en talla ${selectedSize}. ¿Están disponibles?`;
    window.open(`https://wa.me/573000000000?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-5xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-8 right-8 z-10 p-2 hover:bg-neutral-100 rounded-full transition-colors">
          <X size={24} />
        </button>
        
        {/* Media Side */}
        <div className="md:w-1/2 bg-neutral-50 flex items-center justify-center p-12">
          <div className="w-full aspect-square bg-white rounded-3xl flex items-center justify-center shadow-inner relative">
            <span className="text-9xl font-black text-neutral-50 select-none">VZ</span>
            <div className="absolute top-6 left-6 flex items-center gap-2">
              <ShieldCheck className="text-amber-600" size={16} />
              <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 italic">Verificación Triple A</span>
            </div>
          </div>
        </div>

        {/* Content Side */}
        <div className="md:w-1/2 p-12 flex flex-col">
          <span className="text-amber-600 font-bold text-[10px] uppercase tracking-[0.3em] mb-4">{product.vibe} Collection</span>
          <h2 className="text-5xl font-black tracking-tighter mb-2 leading-none">{product.name}</h2>
          <p className="text-2xl font-bold mb-10">$ {product.price.toLocaleString('es-CO')}</p>

          {/* Data Visualization (Chart) */}
          <div className="mb-10 bg-neutral-50 p-6 rounded-3xl border border-neutral-100">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                <TrendingUp size={12} /> Tendencia de Demanda
              </p>
              <span className="text-[8px] font-black bg-rose-100 text-rose-600 px-2 py-1 rounded uppercase tracking-widest animate-pulse">Hot Drop</span>
            </div>
            <div className="h-[120px]">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Sizes */}
          <div className="mb-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-5">Tallas Disponibles (EU)</p>
            <div className="grid grid-cols-5 gap-3">
              {product.sizes.map(size => (
                <button 
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-4 text-xs font-bold rounded-2xl border-2 transition-all ${selectedSize === size ? 'border-black bg-black text-white' : 'border-neutral-100 hover:border-black'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleWhatsApp}
            className="w-full bg-black text-white py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-amber-600 transition-all flex items-center justify-center gap-3 mt-auto"
          >
            Consultar Disponibilidad en WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;