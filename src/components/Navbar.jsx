import React from 'react';
import { Search, Heart, ShoppingCart } from 'lucide-react';

/**
 * Navbar: Barra de navegación con efecto glassmorphism.
 */
const Navbar = ({ wishlistCount }) => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#FDFCFB]/80 backdrop-blur-lg border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        {/* Logo interactivo */}
        <div 
          className="text-2xl font-black tracking-tighter cursor-pointer group" 
          onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
        >
          VERZING<span className="text-amber-600 group-hover:animate-pulse">.</span>
        </div>

        {/* Enlaces centrales */}
        <div className="hidden md:flex space-x-10 text-[10px] font-bold uppercase tracking-[0.2em]">
          <a href="#catalog" className="hover:text-amber-600 transition-colors">Catálogo</a>
          <a href="#manifesto" className="hover:text-amber-600 transition-colors">Calidad</a>
          <a href="#community" className="hover:text-amber-600 transition-colors">Comunidad</a>
        </div>

        {/* Acciones de usuario */}
        <div className="flex items-center space-x-5">
          <Search size={18} className="cursor-pointer hover:text-amber-600 transition-colors" />
          <div className="relative cursor-pointer group">
            <Heart size={18} className="group-hover:text-rose-500 transition-colors" />
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {wishlistCount}
              </span>
            )}
          </div>
          <ShoppingCart size={18} className="cursor-pointer hover:text-amber-600 transition-colors" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;