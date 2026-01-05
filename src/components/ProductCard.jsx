import React from 'react';
import { Maximize2 } from 'lucide-react';

/**
 * ProductCard: Representación visual individual de cada zapato.
 */
const ProductCard = ({ product, onClick, index }) => {
  return (
    <div 
      className="group cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-700"
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={() => onClick(product)}
    >
      <div className="aspect-[4/5] bg-neutral-50 rounded-[2.5rem] mb-8 relative overflow-hidden flex items-center justify-center">
        <span className="text-8xl font-black text-white select-none group-hover:scale-110 transition-transform duration-1000">VZ</span>
        
        {/* Badge de Categoría */}
        <div className="absolute top-6 left-6 bg-white/80 backdrop-blur px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest text-amber-600">
          {product.vibe}
        </div>

        {/* Overlay en Hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 translate-y-20 group-hover:translate-y-0 transition-transform duration-500">
          <button className="bg-white text-black px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
            Ver Detalles <Maximize2 size={10} />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-black text-xl mb-1 tracking-tight group-hover:text-amber-600 transition-colors uppercase">
            {product.name}
          </h3>
          <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest italic">Estándar Triple A</p>
        </div>
        <p className="font-black text-lg">$ {product.price.toLocaleString('es-CO')}</p>
      </div>
    </div>
  );
};

export default ProductCard;