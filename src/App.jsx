import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Heart, 
  ShoppingCart, 
  ShieldCheck, 
  Truck,
  TrendingUp, 
  X, 
  Maximize2,
  Instagram,
  MessageCircle,
  ChevronUp,
  Send,
  Bot,
  User,
  LogIn,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Save,
  Sparkles,
  Menu
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

// Registrar Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// --- CONFIGURACIÓN ---
const apiKey = ""; // La clave se proporciona en el entorno de ejecución
const ADMIN_PASSWORD = "admin123";
const USER_PASSWORD = "user123";

// --- DATOS INICIALES ---
const DEFAULT_PRODUCTS = [
  { id: 1, name: "AJ1 High 'Chicago'", price: 195000, vibe: "Retro", sizes: [38, 40, 41, 42, 43], popularity: [10, 45, 30, 80, 75, 95], image: "https://images.unsplash.com/photo-1556906781-9a412961d28c?auto=format&fit=crop&q=80&w=600" },
  { id: 2, name: "Yeezy Boost 350 V2", price: 175000, vibe: "Streetwear", sizes: [36, 37, 38, 39, 40], popularity: [40, 30, 50, 60, 55, 65], image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&q=80&w=600" },
  { id: 3, name: "Dunk Low 'Panda'", price: 155000, vibe: "Streetwear", sizes: [38, 39, 40, 41, 42], popularity: [80, 85, 90, 95, 98, 92], image: "https://images.unsplash.com/photo-1628149455678-16f37bc392f4?auto=format&fit=crop&q=80&w=600" },
  { id: 4, name: "Travis Scott x AJ1 Low", price: 225000, vibe: "Limited", sizes: [40, 41, 42], popularity: [20, 35, 60, 85, 100, 98], image: "https://images.unsplash.com/photo-1584735175315-9d5816e3188d?auto=format&fit=crop&q=80&w=600" }
];

// --- FUNCIÓN API GEMINI ---
async function callGemini(prompt, systemInstruction = "") {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
  };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude procesar la respuesta.";
  } catch (error) {
    return "Error de conexión con el asistente.";
  }
}

// --- COMPONENTES ---

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onLogin('admin');
      onClose();
    } else if (password === USER_PASSWORD) {
      onLogin('user');
      onClose();
    } else {
      setError('Contraseña incorrecta');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-neutral-100 rounded-full transition-colors">
          <X size={20} />
        </button>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-600">
            <User size={32} />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Acceso Verzing</h2>
          <p className="text-sm text-neutral-400 mt-2 font-medium">Ingresa tu clave de acceso</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-amber-600 transition-all text-center tracking-widest"
            placeholder="••••••••"
            autoFocus
          />
          {error && <p className="text-rose-500 text-xs text-center font-bold uppercase">{error}</p>}
          <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-600 transition-all">
            Validar Identidad
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminPanel = ({ products, setProducts }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', vibe: 'Streetwear', sizes: '', imageDataUrl: '' });

    // Maneja la carga de archivos y los convierte a Data URL para persistir en localStorage
    const handleFileChange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setFormData(prev => ({ ...prev, imageDataUrl: reader.result }));
      reader.readAsDataURL(file);
    };

    const handleSave = (e) => {
      e.preventDefault();
      const newProduct = {
        id: editingId || Date.now(),
        name: formData.name,
        price: parseInt(formData.price),
        vibe: formData.vibe,
        image: formData.imageDataUrl || "https://images.unsplash.com/photo-1556906781-9a412961d28c?auto=format&fit=crop&q=80&w=600",
        sizes: formData.sizes.split(',').map(s => parseInt(s.trim())),
        popularity: Array.from({length: 6}, () => Math.floor(Math.random() * 100))
      };

      if (editingId) {
        setProducts(products.map(p => p.id === editingId ? newProduct : p));
      } else {
        setProducts([...products, newProduct]);
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: '', price: '', vibe: 'Streetwear', sizes: '', imageDataUrl: '' });
    }; 

  const handleEdit = (p) => {
    setFormData({ name: p.name, price: p.price, vibe: p.vibe, sizes: p.sizes.join(', '), imageDataUrl: p.image });
    setEditingId(p.id);
    setIsAdding(true);
  }; 

  const handleDelete = (id) => {
    if (confirm('¿Eliminar este producto permanentemente?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 mb-20 animate-in fade-in slide-in-from-top-4">
      <div className="bg-white border-2 border-neutral-100 rounded-[2.5rem] p-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Inventario Verzing</h2>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">Gestión de Catálogo Triple A</p>
          </div>
          <button 
            onClick={() => {
              if (isAdding) {
                setIsAdding(false);
                setEditingId(null);
                setFormData({ name: '', price: '', vibe: 'Streetwear', sizes: '', imageDataUrl: '' });
              } else {
                setIsAdding(true);
              }
            }}
            className="bg-amber-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center gap-2"
          > 
            {isAdding ? <X size={16} /> : <Plus size={16} />}
            {isAdding ? 'Cancelar' : 'Nuevo Modelo'}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleSave} className="bg-neutral-50 p-8 rounded-3xl mb-12 grid md:grid-cols-2 gap-6 animate-in zoom-in-95">
            <div className="space-y-4">
              <input 
                placeholder="Nombre del Modelo" 
                className="w-full bg-white px-6 py-4 rounded-xl border border-neutral-200 outline-none focus:border-amber-600"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required 
              />
              <input 
                placeholder="Precio (Ej: 185000)" 
                type="number" 
                className="w-full bg-white px-6 py-4 rounded-xl border border-neutral-200 outline-none focus:border-amber-600"
                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required 
              />
              <select 
                className="w-full bg-white px-6 py-4 rounded-xl border border-neutral-200 outline-none"
                value={formData.vibe} onChange={e => setFormData({...formData, vibe: e.target.value})}
              >
                <option value="Streetwear">Streetwear</option>
                <option value="Retro">Retro</option>
                <option value="Limited">Limited</option>
              </select>
            </div>
            <div className="space-y-4">
              <input 
                placeholder="Tallas (Ej: 38, 40, 42)" 
                className="w-full bg-white px-6 py-4 rounded-xl border border-neutral-200 outline-none focus:border-amber-600"
                value={formData.sizes} onChange={e => setFormData({...formData, sizes: e.target.value})} required 
              />

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block">Foto del Modelo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="w-full bg-white px-6 py-4 rounded-xl border border-neutral-200 outline-none focus:border-amber-600"
                />
                {formData.imageDataUrl && (
                  <div className="mt-4 w-36 h-36 rounded-xl overflow-hidden">
                    <img src={formData.imageDataUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <button className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                <Save size={16} /> Guardar Producto
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-4">
          {products.map(p => (
            <div key={p.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl hover:bg-white border border-transparent hover:border-neutral-100 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex items-center justify-center">
                   <img src={p.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{p.name}</h4>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">${p.price.toLocaleString()} • {p.vibe}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(p)} className="p-3 bg-white text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-3 bg-white text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ wishlistCount, onOpenAssistant, userRole, setRole, onOpenLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-[100] h-20 bg-[#FDFCFB]/90 backdrop-blur-xl border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center text-left">
        <div className="text-2xl font-black tracking-tighter cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          VERZING<span className="text-amber-600 group-hover:animate-pulse">.</span>
        </div>
        
        <div className="hidden md:flex space-x-10 text-[10px] font-bold uppercase tracking-[0.2em]">
          <a href="#catalog" className="hover:text-amber-600 transition-colors">Catálogo</a>
          <button onClick={onOpenAssistant} className="hover:text-amber-600 transition-colors flex items-center gap-2">
            ✨ Asistente AI
          </button>
        </div>

        <div className="flex items-center space-x-5">
          {userRole ? (
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-neutral-100 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                <User size={12} /> {userRole === 'admin' ? '👑 Admin' : 'Comprador'}
              </div>
              <button onClick={() => setRole(null)} className="p-2 hover:bg-rose-50 text-rose-500 rounded-full transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenLogin} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all">
              <LogIn size={14} /> Acceder
            </button>
          )}
          <Heart size={18} className="cursor-pointer hidden sm:block" />
          <div className="relative cursor-pointer">
            <ShoppingCart size={18} />
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {wishlistCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const Hero = ({ onOpenAssistant }) => (
  <section className="relative min-h-screen flex items-center pt-24 sm:pt-20 px-6 bg-[#FDFCFB] overflow-hidden">
    <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center text-left">
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 z-10">
        <h4 className="text-amber-600 font-bold tracking-[0.5em] text-[10px] uppercase mb-6 flex items-center gap-2">
          <span className="w-8 h-[1px] bg-amber-600"></span>
          Drop 2026 / Selección Auténtica
        </h4>
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.85] mb-10 uppercase">
          SNEAKERS<br />QUE <span className="border-text italic">HABLAN</span><br />POR TI.
        </h1>
        <p className="text-gray-500 max-w-sm mb-12 text-sm leading-relaxed font-medium">
          Curaduría premium de calzado Triple A. Tu estilo no tiene límites, nuestra calidad tampoco.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })}
            className="bg-black text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-600 transition-all shadow-xl shadow-black/10"
          >
            Explorar Catálogo
          </button>
          <button 
            onClick={onOpenAssistant}
            className="border-2 border-black px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
          >
            ✨ Consultar IA
          </button>
        </div>
      </div>
      <div className="relative hidden md:flex items-center justify-center">
        <div className="w-full aspect-square relative rounded-[3rem] overflow-hidden shadow-2xl">
          <img 
            src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=1000" 
            alt="Verzing Sneakers Hero" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      </div>
    </div>
  </section>
);

const ProductCard = ({ product, onClick }) => (
  <div className="group cursor-pointer animate-in fade-in duration-700" onClick={() => onClick(product)}>
    <div className="aspect-[4/5] bg-neutral-100 rounded-[2.5rem] mb-8 relative overflow-hidden flex items-center justify-center">
      <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
      <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest text-amber-600">
        {product.vibe}
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 translate-y-20 group-hover:translate-y-0 transition-transform duration-500">
        <div className="bg-white text-black px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
          Detalles <Maximize2 size={10} />
        </div>
      </div>
    </div>
    <div className="flex justify-between items-start text-left">
      <div className="flex-1">
        <h3 className="font-black text-xl mb-1 tracking-tight group-hover:text-amber-600 transition-colors uppercase">{product.name}</h3>
        <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest italic">Standard Triple A</p>
      </div>
      <p className="font-black text-lg whitespace-nowrap">$ {product.price.toLocaleString('es-CO')}</p>
    </div>
  </div>
);

const ProductModal = ({ product, onClose }) => {
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
      data: product.popularity || [40, 50, 60, 45, 70, 90],
      borderColor: '#D97706',
      backgroundColor: 'rgba(217, 119, 6, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 0
    }]
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-5xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
        <button onClick={onClose} className="absolute top-8 right-8 z-10 p-2 bg-white/50 backdrop-blur rounded-full transition-colors">
          <X size={20} />
        </button>
        <div className="md:w-1/2 bg-neutral-50 flex items-center justify-center p-12">
          <div className="w-full aspect-square bg-white rounded-3xl flex items-center justify-center shadow-inner relative overflow-hidden">
            <img src={product.image} className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="md:w-1/2 p-12 flex flex-col text-left">
          <span className="text-amber-600 font-bold text-[10px] uppercase tracking-[0.3em] mb-4">{product.vibe} Collection</span>
          <h2 className="text-4xl font-black tracking-tighter mb-2 leading-none uppercase">{product.name}</h2>
          <p className="text-2xl font-bold mb-8">$ {product.price.toLocaleString('es-CO')}</p>

          <div className="mb-8 p-6 bg-amber-50 rounded-3xl border border-amber-100">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-amber-800 mb-3 flex items-center gap-2">
              <Sparkles size={12} className="animate-pulse" /> Conserje de Estilo AI
            </h3>
            <div className="text-xs text-amber-900 leading-relaxed mb-4 min-h-[30px]">
              {loadingAI ? <span className="animate-pulse italic">Analizando tendencias...</span> : (aiAdvice || "¿Cómo combinarías estos Verzing?")}
            </div>
            {!aiAdvice && !loadingAI && (
              <button onClick={handleGetStyleAdvice} className="bg-amber-600 text-white px-6 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-amber-700 transition-all">Generar Consejos ✨</button>
            )}
          </div>

          <div className="mb-8 bg-neutral-50 p-6 rounded-3xl h-[120px]">
             <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mb-2">Demanda en Tiempo Real</p>
             <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }} />
          </div>

          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4">Tallas EU</p>
            <div className="grid grid-cols-5 gap-3">
              {product.sizes.map(size => (
                <button key={size} onClick={() => setSelectedSize(size)} className={`py-4 text-xs font-bold rounded-2xl border-2 transition-all ${selectedSize === size ? 'border-black bg-black text-white' : 'border-neutral-100 hover:border-black'}`}>{size}</button>
              ))}
            </div>
          </div>
          <button className="w-full bg-black text-white py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-amber-600 transition-all">Consultar por WhatsApp</button>
        </div>
      </div>
    </div>
  );
};

const AIAssistant = ({ isOpen, onClose, products }) => {
  const [messages, setMessages] = useState([{ role: 'bot', text: '¡Hola! Soy tu asistente de Verzing. ¿Buscas algún estilo en particular hoy?' }]);
  const [input, setInput] = useState('');
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    const catalog = products.map(p => `${p.name} ($${p.price})`).join(', ');
    const system = `Eres el asistente experto de Verzing. Catálogo: ${catalog}. Ayuda al usuario a elegir basándote en su estilo. Responde en español, tono premium y breve.`;
    const response = await callGemini(userMsg, system);
    setMessages(prev => [...prev, { role: 'bot', text: response }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[600px] animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-8 border-b border-neutral-100 flex justify-between items-center text-left bg-white">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">Asistente AI ✨</h3>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Style Concierge</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-50 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div ref={chatRef} className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-neutral-50/30">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl flex gap-3 text-left ${m.role === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-white text-neutral-800 rounded-tl-none border border-neutral-100 shadow-sm'}`}>
                <div className="shrink-0 mt-1">{m.role === 'bot' ? <Bot size={14} className="text-amber-600" /> : <User size={14} className="text-neutral-400" />}</div>
                <p className="text-xs leading-relaxed font-medium">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 bg-white border-t border-neutral-100 flex gap-3">
          <input 
            type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="¿Qué me recomiendas?"
            className="flex-1 bg-neutral-50 border border-neutral-200 rounded-2xl px-6 py-4 text-xs focus:outline-none focus:border-amber-600 transition-colors"
          />
          <button onClick={handleSend} className="bg-black text-white p-4 rounded-2xl hover:bg-amber-600 transition-all">
            <Send size={18} />
          </button>
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
  const [userRole, setUserRole] = useState(() => localStorage.getItem('verzing_role') || null);
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('verzing_products');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });
  const [activeVibe, setActiveVibe] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);

  useEffect(() => {
    localStorage.setItem('verzing_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    if (userRole) localStorage.setItem('verzing_role', userRole);
    else localStorage.removeItem('verzing_role');
  }, [userRole]);

  useEffect(() => {
    const handleScroll = () => setIsHeaderSticky(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => activeVibe === 'all' || p.vibe === activeVibe);
  }, [activeVibe, products]);

  const categories = ['all', 'Streetwear', 'Retro', 'Limited'];

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-amber-100 selection:text-amber-900 relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .border-text { -webkit-text-stroke: 1px #1A1A1A; color: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Navbar 
        wishlistCount={0} 
        onOpenAssistant={() => setIsAssistantOpen(true)} 
        userRole={userRole} 
        setRole={setUserRole} 
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <Hero onOpenAssistant={() => setIsAssistantOpen(true)} userRole={userRole} />

      {userRole === 'admin' && (
        <AdminPanel products={products} setProducts={setProducts} />
      )}

      {/* Catálogo Section */}
      <section id="catalog" className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-left">
          <div className={`sticky top-20 z-40 bg-[#FDFCFB]/95 backdrop-blur-md py-10 border-b border-black/5 flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-20 transition-all duration-300 ${isHeaderSticky ? 'shadow-sm px-6 -mx-6 rounded-b-3xl' : ''}`}>
            <div>
              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter mb-4 uppercase leading-none italic">The Drop</h2>
              <p className="text-gray-400 font-medium text-sm">Mostrando {filteredProducts.length} modelos exclusivos.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto no-scrollbar overflow-x-auto pb-2">
              {categories.map((vibe) => (
                <button 
                  key={vibe} 
                  onClick={() => setActiveVibe(vibe)} 
                  className={`flex-shrink-0 px-8 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border-2 ${activeVibe === vibe ? 'bg-black text-white border-black shadow-lg scale-105' : 'border-neutral-100 hover:border-black bg-white/50'}`}
                >
                  {vibe === 'all' ? 'Todos' : vibe}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} onClick={setSelectedProduct} />
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
      <AIAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} products={products} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLogin={setUserRole} />

      {!isAssistantOpen && (
        <button onClick={() => setIsAssistantOpen(true)} className="fixed bottom-10 right-10 z-[100] bg-black text-white p-5 rounded-full shadow-2xl hover:bg-amber-600 transition-all hover:scale-110 active:scale-95 group">
          <Sparkles size={24} className="group-hover:animate-spin" />
        </button>
      )}
    </div>
  );
}