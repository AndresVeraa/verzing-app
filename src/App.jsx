import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Truck,
  Sparkles,
  User,
  Bot,
  Menu
} from 'lucide-react';

// --- IMPORTACIÓN DE IMAGEN LOCAL ---
// Cambia 'sneakers-hero.png' por el nombre real de tu archivo en src/assets
// import heroSneakers from './assets/sneakers-hero.png'; 

// Para que el preview no falle si no encuentra el archivo, usaré una constante.
// En tu código local, simplemente descomenta la línea de arriba y usa 'heroSneakers'.
const heroSneakersPath = "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=1000"; 

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

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

// Registrar Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'verzing-premium-app';

// --- CONFIGURACIÓN DE GEMINI API ---
const apiKey = ""; 

async function callGemini(prompt, systemInstruction = "") {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
  };

  let retries = 0;
  while (retries < 5) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo obtener una respuesta.";
    } catch (error) {
      retries++;
      await new Promise(r => setTimeout(r, Math.pow(2, retries) * 1000));
    }
  }
  return "Error de conexión con la IA.";
}

// --- DATOS ---
const PRODUCTS = [
  { id: 1, name: "AJ1 High 'Chicago'", price: 195000, vibe: "Retro", sizes: [38, 40, 41, 42, 43], popularity: [10, 45, 30, 80, 75, 95] },
  { id: 2, name: "Yeezy Boost 350 V2", price: 175000, vibe: "Streetwear", sizes: [36, 37, 38, 39, 40], popularity: [40, 30, 50, 60, 55, 65] },
  { id: 3, name: "Dunk Low 'Panda'", price: 155000, vibe: "Streetwear", sizes: [38, 39, 40, 41, 42], popularity: [80, 85, 90, 95, 98, 92] },
  { id: 4, name: "Travis Scott x AJ1 Low", price: 225000, vibe: "Limited", sizes: [40, 41, 42], popularity: [20, 35, 60, 85, 100, 98] }
];

// --- COMPONENTES ---

const Navbar = ({ wishlistCount, onOpenAssistant }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-[100] h-20 bg-[#FDFCFB]/90 backdrop-blur-xl border-b border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex justify-between items-center text-left">
        <div className="text-xl sm:text-2xl font-black tracking-tighter cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          VERZING<span className="text-amber-600 group-hover:animate-pulse">.</span>
        </div>
        
        <div className="hidden md:flex space-x-10 text-[10px] font-bold uppercase tracking-[0.2em]">
          <a href="#catalog" className="hover:text-amber-600 transition-colors">Catálogo</a>
          <button onClick={onOpenAssistant} className="hover:text-amber-600 transition-colors flex items-center gap-2">
            ✨ Asistente AI
          </button>
          <a href="#footer" className="hover:text-amber-600 transition-colors">Contacto</a>
        </div>

        <div className="flex items-center space-x-4 sm:space-x-5">
          <div className="relative cursor-pointer group" onClick={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })}>
            <Heart size={18} className={`${wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : 'group-hover:text-rose-500'} transition-all`} />
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {wishlistCount}
              </span>
            )}
          </div>
          <ShoppingCart size={18} className="cursor-pointer" />
          <button className="md:hidden text-black" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-neutral-100 flex flex-col p-6 space-y-4 shadow-xl animate-in slide-in-from-top-2">
          <a href="#catalog" className="text-xs font-black uppercase tracking-widest" onClick={() => setMobileMenuOpen(false)}>Catálogo</a>
          <button onClick={() => { onOpenAssistant(); setMobileMenuOpen(false); }} className="text-left text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">✨ Asistente AI</button>
          <a href="#footer" className="text-xs font-black uppercase tracking-widest" onClick={() => setMobileMenuOpen(false)}>Contacto</a>
        </div>
      )}
    </nav>
  );
};

const Hero = ({ onOpenAssistant }) => (
  <section className="relative min-h-screen flex items-center pt-24 sm:pt-20 px-4 sm:px-6 bg-[#FDFCFB] overflow-hidden">
    <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-8 sm:gap-16 items-center text-left">
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 z-10">
        <h4 className="text-amber-600 font-bold tracking-[0.3em] sm:tracking-[0.5em] text-[9px] sm:text-[10px] uppercase mb-4 sm:mb-6 flex items-center gap-2">
          <span className="w-6 sm:w-8 h-[1px] bg-amber-600"></span>
          Drop 2025 / Selección Auténtica
        </h4>
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.9] sm:leading-[0.85] mb-6 sm:mb-10 uppercase">
          SNEAKERS<br />QUE <span className="border-text italic">HABLAN</span><br />POR TI.
        </h1>
        <p className="text-gray-500 max-w-sm mb-8 sm:mb-12 text-xs sm:text-sm leading-relaxed font-medium">
          Curaduría premium de calzado Triple A. Usa nuestra ✨ IA para recibir asesoría de estilo personalizada al instante.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto bg-black text-white px-8 sm:px-10 py-4 sm:py-5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-amber-600 transition-all shadow-xl shadow-black/10"
          >
            Explorar Catálogo
          </button>
          <button 
            onClick={onOpenAssistant}
            className="w-full sm:w-auto border-2 border-black px-8 sm:px-10 py-4 sm:py-5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
          >
            ✨ Probar IA
          </button>
        </div>
      </div>
      <div className="relative hidden md:flex items-center justify-center">
        {/* REEMPLAZO POR IMAGEN LOCAL */}
        <div className="w-full aspect-square relative rounded-[3rem] overflow-hidden shadow-2xl">
          <img 
            src={heroSneakersPath} 
            alt="Verzing Sneakers Hero" 
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
          />
          {/* Capa de diseño decorativa */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      </div>
    </div>
  </section>
);

const ProductCard = ({ product, onClick, onWishlist, isLiked }) => (
  <div className="group cursor-pointer animate-in fade-in duration-700" onClick={() => onClick(product)}>
    <div className="aspect-[4/5] bg-neutral-50 rounded-[1.5rem] sm:rounded-[2.5rem] mb-4 sm:mb-8 relative overflow-hidden flex items-center justify-center">
      <span className="text-6xl sm:text-8xl font-black text-white group-hover:scale-110 transition-transform duration-1000 select-none">VZ</span>
      <button 
        onClick={(e) => { e.stopPropagation(); onWishlist(product.id); }}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 bg-white/80 backdrop-blur rounded-2xl text-slate-400 hover:text-rose-500 transition-all z-10"
      >
        <Heart size={18} className={isLiked ? "text-rose-500 fill-rose-500" : ""} />
      </button>
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-white/80 backdrop-blur px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-amber-600">
        {product.vibe}
      </div>
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 translate-y-20 group-hover:translate-y-0 transition-transform duration-500">
        <div className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
          Detalles <Maximize2 size={10} />
        </div>
      </div>
    </div>
    <div className="flex justify-between items-start text-left px-1">
      <div className="flex-1 mr-2 overflow-hidden">
        <h3 className="font-black text-base sm:text-xl mb-0.5 sm:mb-1 tracking-tight group-hover:text-amber-600 transition-colors uppercase truncate">{product.name}</h3>
        <p className="text-neutral-400 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest italic">Standard Triple A</p>
      </div>
      <p className="font-black text-sm sm:text-lg whitespace-nowrap">$ {product.price.toLocaleString('es-CO')}</p>
    </div>
  </div>
);

const ProductModal = ({ product, onClose, onWishlist, isLiked, callGemini }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  if (!product) return null;

  const handleGetStyleAdvice = async () => {
    setLoadingAI(true);
    const system = "Eres un estilista premium. Sugiere 3 outfits cortos (Casual, Urban, Sport) para estos sneakers en español. Sé conciso.";
    const prompt = `Outfits para: ${product.name} de estilo ${product.vibe}.`;
    const response = await callGemini(prompt, system);
    setAiAdvice(response);
    setLoadingAI(false);
  };

  const chartData = {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'Ahora'],
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-5xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 sm:top-8 sm:right-8 z-10 p-2 bg-white/50 backdrop-blur rounded-full transition-colors">
          <X size={20} />
        </button>
        <div className="w-full md:w-1/2 bg-neutral-50 flex items-center justify-center p-8 sm:p-12">
          <div className="w-full aspect-square bg-white rounded-3xl flex items-center justify-center shadow-inner relative max-w-[300px] sm:max-w-full">
            <span className="text-7xl sm:text-9xl font-black text-neutral-50 select-none">VZ</span>
          </div>
        </div>
        <div className="w-full md:w-1/2 p-6 sm:p-12 flex flex-col text-left">
          <div className="flex justify-between items-start mb-4">
            <span className="text-amber-600 font-bold text-[8px] sm:text-[10px] uppercase tracking-[0.3em]">{product.vibe} Collection</span>
            <button 
              onClick={() => onWishlist(product.id)}
              className="text-slate-400 hover:text-rose-500 transition-all"
            >
              <Heart size={24} className={isLiked ? "text-rose-500 fill-rose-500" : ""} />
            </button>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-2 leading-none uppercase">{product.name}</h2>
          <p className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">$ {product.price.toLocaleString('es-CO')}</p>

          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-amber-50 rounded-[1.5rem] sm:rounded-3xl border border-amber-100">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-amber-800 mb-3 flex items-center gap-2">
              <Sparkles size={12} className="animate-pulse" /> Conserje de Estilo AI
            </h3>
            <div className="text-xs text-amber-900 leading-relaxed mb-4 min-h-[30px]">
              {loadingAI ? <span className="animate-pulse italic">Analizando tendencias...</span> : (aiAdvice || "¿Cómo combinarías estos Verzing?")}
            </div>
            {!aiAdvice && !loadingAI && (
              <button onClick={handleGetStyleAdvice} className="bg-amber-600 text-white px-4 sm:px-6 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-amber-700 transition-all">Generar Consejos ✨</button>
            )}
          </div>

          <div className="mb-6 sm:mb-8 bg-neutral-50 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-3xl h-[120px] sm:h-[150px]">
            <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }} />
          </div>

          <div className="mb-6 sm:mb-8">
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4">Tallas EU</p>
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {product.sizes.map(size => (
                <button key={size} onClick={() => setSelectedSize(size)} className={`py-3 sm:py-4 text-[10px] sm:text-xs font-bold rounded-xl sm:rounded-2xl border-2 transition-all ${selectedSize === size ? 'border-black bg-black text-white' : 'border-neutral-100 hover:border-black'}`}>{size}</button>
              ))}
            </div>
          </div>
          <button className="w-full bg-black text-white py-4 sm:py-6 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] hover:bg-amber-600 transition-all">WhatsApp Business</button>
        </div>
      </div>
    </div>
  );
};

const AIAssistant = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([{ role: 'bot', text: '¡Hola! Soy tu asistente de Verzing. ¿En qué te puedo ayudar hoy?' }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);
    const catalog = PRODUCTS.map(p => p.name).join(', ');
    const system = `Eres el asistente experto de Verzing. Catálogo: ${catalog}. Responde en español, tono premium y breve.`;
    const response = await callGemini(userMsg, system);
    setMessages(prev => [...prev, { role: 'bot', text: response }]);
    setIsTyping(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm hidden sm:block" onClick={onClose}></div>
      <div className="relative bg-white w-full h-full sm:h-[600px] sm:max-lg sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-4 duration-300">
        <div className="p-6 sm:p-8 border-b border-neutral-100 flex justify-between items-center text-left bg-white">
          <div>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">Asistente AI ✨</h3>
            <p className="text-[8px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Estilo Verzing</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-50 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 no-scrollbar bg-neutral-50/30">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 sm:p-4 rounded-xl sm:rounded-2xl flex gap-3 text-left ${m.role === 'user' ? 'bg-black text-white rounded-tr-none shadow-lg' : 'bg-white text-neutral-800 rounded-tl-none border border-neutral-100 shadow-sm'}`}>
                <div className="shrink-0 mt-1">{m.role === 'bot' ? <Bot size={14} className="text-amber-600" /> : <User size={14} className="text-neutral-400" />}</div>
                <p className="text-xs leading-relaxed font-medium">{m.text}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-xl border border-neutral-100 italic text-[9px] text-neutral-400 animate-pulse flex items-center gap-2">
                <Bot size={12} /> Redactando...
              </div>
            </div>
          )}
        </div>
        <div className="p-4 sm:p-6 bg-white border-t border-neutral-100 flex gap-2 sm:gap-3">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="¿Qué me recomiendas?"
            className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs focus:outline-none focus:border-amber-600 transition-colors shadow-inner"
          />
          <button onClick={handleSend} className="bg-black text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:bg-amber-600 transition-all active:scale-95">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- APP ---

export default function App() {
  const [activeVibe, setActiveVibe] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, setUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const wishlistCol = collection(db, 'artifacts', appId, 'users', user.uid, 'wishlist');
    const unsubscribeSnapshot = onSnapshot(wishlistCol, (snapshot) => {
      setWishlist(snapshot.docs.map(doc => doc.id));
    }, (err) => console.error(err));
    return () => unsubscribeSnapshot();
  }, [user]);

  const toggleWishlist = async (productId) => {
    if (!user) return;
    const prodIdStr = productId.toString();
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'wishlist', prodIdStr);
    if (wishlist.includes(prodIdStr)) {
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, { addedAt: new Date().toISOString() });
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsHeaderSticky(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => activeVibe === 'all' || p.vibe === activeVibe);
  }, [activeVibe]);

  const categories = ['all', 'Streetwear', 'Retro', 'Limited'];

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-amber-100 selection:text-amber-900 relative overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .border-text { -webkit-text-stroke: 1px #1A1A1A; color: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .sticky-header {
          position: sticky;
          top: 80px;
          z-index: 50;
          background-color: rgba(253, 252, 251, 0.98);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
      `}</style>

      <Navbar wishlistCount={wishlist.length} onOpenAssistant={() => setIsAssistantOpen(true)} />
      
      {/* HERO SECTION CON IMAGEN LOCAL */}
      <Hero onOpenAssistant={() => setIsAssistantOpen(true)} />
      
      {/* Catalog Section */}
      <section id="catalog" className="py-16 sm:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-left">
          <div className={`sticky top-20 z-40 bg-[#FDFCFB]/95 backdrop-blur-md py-6 sm:py-10 border-b border-black/5 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-10 mb-12 sm:mb-20 transition-all duration-300 ${isHeaderSticky ? 'shadow-sm px-4 -mx-4 rounded-b-3xl' : ''}`}>
            <div>
              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter mb-2 sm:mb-4 uppercase leading-none italic">The Drop</h2>
              <p className="text-gray-400 font-medium text-[10px] sm:text-sm">Explora {filteredProducts.length} modelos curados con ✨ IA.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto no-scrollbar overflow-x-auto pb-2 -mx-2 px-2 md:mx-0 md:px-0">
              {categories.map((vibe) => (
                <button key={vibe} onClick={() => setActiveVibe(vibe)} className={`flex-shrink-0 px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-widest transition-all border-2 ${activeVibe === vibe ? 'bg-black text-white border-black shadow-lg scale-105' : 'border-neutral-100 hover:border-black bg-white/50'}`}>
                  {vibe === 'all' ? 'Todos' : vibe}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-12 gap-y-12 sm:gap-y-20">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} onClick={setSelectedProduct} onWishlist={toggleWishlist} isLiked={wishlist.includes(p.id.toString())} />
            ))}
          </div>
        </div>
      </section>

      <footer id="footer" className="bg-[#0A0A0A] text-white pt-16 sm:pt-24 pb-12 px-4 sm:px-6 text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div>
            <div className="text-3xl font-black tracking-tighter italic uppercase mb-4">VERZING<span className="text-amber-600">.</span></div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">© 2025 Verzing Footwear Co.</p>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">
            <Instagram size={18} className="hover:text-white cursor-pointer" />
            <MessageCircle size={18} className="hover:text-white cursor-pointer" />
            <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="flex items-center gap-2 hover:text-white"><ChevronUp size={14}/> Arriba</button>
          </div>
        </div>
      </footer>

      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onWishlist={toggleWishlist} isLiked={wishlist.includes(selectedProduct.id.toString())} />}
      <AIAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
      {!isAssistantOpen && (
        <button onClick={() => setIsAssistantOpen(true)} className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-[100] bg-black text-white p-4 sm:p-5 rounded-full shadow-2xl hover:bg-amber-600 transition-all hover:scale-110 active:scale-95 group">
          <Sparkles size={24} className="group-hover:animate-spin" />
        </button>
      )}
    </div>
  );
}