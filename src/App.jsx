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
import { db, firebaseConfigured } from './firebase';
import { collection, query, orderBy, onSnapshot, addDoc, setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

// Local size-guide assets
import Tabladetallas from './assets/Tallas/Tabladetallas.jpeg';
import Comomedir from './assets/Tallas/Comomedir.jpeg';

// --- DATOS INICIALES ---
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Air Jordan 1 Retro",
    price: 850000,
    vibe: "Retro",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800",
    sizes: [38, 39, 40, 41, 42],
    popularity: [40, 50, 60, 45, 70, 90]
  },
  {
    id: 2,
    name: "Nike Dunk Low",
    price: 620000,
    vibe: "Streetwear",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800",
    sizes: [37, 38, 39, 40],
    popularity: [30, 40, 35, 60, 80, 85]
  },
  {
    id: 3,
    name: "Yeezy Boost 350",
    price: 1200000,
    vibe: "Limited",
    image: "https://images.unsplash.com/photo-1512374382149-433a4279743a?q=80&w=800",
    sizes: [40, 41, 42, 43, 44],
    popularity: [80, 85, 90, 95, 98, 100]
  }
];

// Registrar Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// --- CONFIGURACIÓN ---
const apiKey = ""; // La clave se proporciona en el entorno de ejecución
const ADMIN_PASSWORD = "admin123";
const USER_PASSWORD = "user123";


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

// --- SECURITY HELPERS ---

const bufferToBase64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const base64ToBuffer = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
const generateSalt = () => {
  const s = crypto.getRandomValues(new Uint8Array(16));
  return bufferToBase64(s);
};

async function hashPassword(password, salt, iterations = 150000) {
  const enc = new TextEncoder();
  const saltBuf = base64ToBuffer(salt);
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBuf, iterations, hash: 'SHA-256' }, keyMaterial, 256);
  return bufferToBase64(bits);
}

function constantTimeCompare(a, b) {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0;
}

function getUsers() {
  const raw = localStorage.getItem('verzing_users');
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem('verzing_users', JSON.stringify(users));
}

async function createUser({ username, password, role = 'user', firstName = '', lastName = '', email = '', phone = '' }) {
  const users = getUsers();
  if (users.find(u => u.username === username)) throw new Error('Usuario ya existe');
  if (email && users.find(u => u.email === email)) throw new Error('Correo ya registrado');
  if (phone && users.find(u => u.phone === phone)) throw new Error('Teléfono ya registrado');
  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  users.push({ username, salt, hash, role, firstName, lastName, email, phone });
  saveUsers(users);
  return { username, role, firstName, lastName, email, phone };
}

async function verifyUser(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (!user) return null;
  const hash = await hashPassword(password, user.salt);
  if (!constantTimeCompare(hash, user.hash)) return null;
  // Return user info without salt/hash
  const { salt, hash: h, ...rest } = user;
  return rest;
}

async function seedAdmin() {
  const users = getUsers();
  if (!users.find(u => u.username === 'admin')) {
    try {
      await createUser({ username: 'admin', password: ADMIN_PASSWORD, role: 'admin', firstName: 'Admin', lastName: 'User', email: 'admin@verzing.local' });
      // eslint-disable-next-line no-console
      console.info('Admin seeded');
    } catch (e) {
      // ignore
    }
  }
}

// --- COMPONENTES ---

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setMode('login');
      setUsername('');
      setPassword('');
      setConfirm('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateEmail = (e) => /\S+@\S+\.\S+/.test(e);
  const validatePhone = (p) => /^\+?\d{7,15}$/.test(p);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        if (!username.trim() || !password) {
          setError('Completa usuario y contraseña');
          setLoading(false);
          return;
        }
        const user = await verifyUser(username.trim(), password);
        if (!user) {
          setError('Credenciales inválidas');
          setLoading(false);
          return;
        }
        onLogin(user);
        onClose();
      } else {
        // register
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !username.trim() || !password) {
          setError('Completa todos los campos');
          setLoading(false);
          return;
        }
        if (!validateEmail(email.trim())) {
          setError('Correo no válido');
          setLoading(false);
          return;
        }
        if (!validatePhone(phone.trim())) {
          setError('Teléfono no válido (solo dígitos, puede incluir +, 7-15 caracteres)');
          setLoading(false);
          return;
        }
        if (password !== confirm) {
          setError('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }
        if (username.trim().toLowerCase() === 'admin') {
          setError('El nombre de usuario "admin" está reservado');
          setLoading(false);
          return;
        }
        const newUser = await createUser({ username: username.trim(), password, role: 'user', firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim() });
        onLogin(newUser);
        onClose();
      }
    } catch (err) {
      setError(err?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 overflow-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-neutral-100 rounded-full transition-colors">
          <X size={20} />
        </button>
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600">
            <User size={28} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">{mode === 'login' ? 'Acceso' : 'Registro'}</h2>
          <p className="text-sm text-neutral-400 mt-1 font-medium">{mode === 'login' ? 'Ingresa con tu usuario' : 'Crea una cuenta segura'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setError(''); }}
                className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-all"
                placeholder="Nombre"
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setError(''); }}
                className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-all"
                placeholder="Apellido"
              />
            </div>
          )}

          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-all"
            placeholder="Nombre de usuario (único)"
            autoFocus
          />

          {mode === 'register' && (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-all"
                placeholder="Correo electrónico"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(''); }}
                className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-all"
                placeholder="Teléfono (ej +573xx...)"
              />
            </>
          )}

          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-all"
            placeholder="Contraseña"
          />

          {mode === 'register' && (
            <input
              type="password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(''); }}
              className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-all"
              placeholder="Confirmar contraseña"
            />
          )}

          {error && <p className="text-rose-500 text-xs text-center font-bold uppercase">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-black text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-600 transition-all">
            {loading ? 'Procesando...' : (mode === 'login' ? 'Iniciar sesión' : 'Registrarme')}
          </button>

          <div className="text-center text-xs text-neutral-500 mt-2">
            {mode === 'login' ? (
              <button type="button" onClick={() => setMode('register')} className="underline">¿No tienes cuenta? Regístrate</button>
            ) : (
              <button type="button" onClick={() => setMode('login')} className="underline">¿Ya tienes cuenta? Ingresa</button>
            )}
          </div>
        </form>
        <div className="mt-4 text-[10px] text-neutral-400 text-center">Usuario administrador por defecto: <strong>admin</strong> / <i>admin123</i></div>
      </div>
    </div>
  );
};

const AdminPanel = ({ products, setProducts, onNotify, createProduct, updateProduct, deleteProduct, usingFirestore, migrateProductsToFirestore }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', vibe: 'Streetwear', sizes: '', imagesDataUrls: [] });

    // Maneja la carga de múltiples archivos y los convierte a Data URLs para persistir en localStorage
    const handleFileChange = async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      // Read all files as Data URLs
      const readFile = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      try {
        const urls = await Promise.all(files.map(f => readFile(f)));
        setFormData(prev => ({ ...prev, imagesDataUrls: [...(prev.imagesDataUrls || []), ...urls] }));
      } catch (err) {
        // ignore failures for now
      }
    };

    const removeImageAt = (index) => {
      setFormData(prev => ({ ...prev, imagesDataUrls: prev.imagesDataUrls.filter((_, i) => i !== index) }));
    };

    const handleSave = async (e) => {
      e.preventDefault();
      const imgField = (formData.imagesDataUrls && formData.imagesDataUrls.length > 0)
        ? (formData.imagesDataUrls.length === 1 ? formData.imagesDataUrls[0] : formData.imagesDataUrls)
        : "https://images.unsplash.com/photo-1556906781-9a412961d28c?auto=format&fit=crop&q=80&w=600";

      const productPayload = {
        name: formData.name,
        price: parseInt(formData.price),
        vibe: formData.vibe,
        image: imgField,
        sizes: formData.sizes.split(',').map(s => parseInt(s.trim())),
        popularity: Array.from({length: 6}, () => Math.floor(Math.random() * 100))
      };

      try {
        if (editingId) {
          await updateProduct(editingId, productPayload);
          onNotify && onNotify({ action: 'update', product: { ...productPayload, id: editingId }, message: 'Producto actualizado' });
        } else {
          const created = await createProduct(productPayload);
          onNotify && onNotify({ action: 'create', product: created, message: 'Producto creado' });
        }
      } catch (err) {
        onNotify && onNotify('Error al guardar producto');
      } finally {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: '', price: '', vibe: 'Streetwear', sizes: '', imagesDataUrls: [] });
      }
    };   

  const handleEdit = (p) => {
    const imgs = Array.isArray(p.image) ? p.image : (p.image ? [p.image] : []);
    setFormData({ name: p.name, price: p.price, vibe: p.vibe, sizes: p.sizes.join(', '), imagesDataUrls: imgs });
    setEditingId(p.id);
    setIsAdding(true);
  };  

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este producto permanentemente?')) {
      try {
        await deleteProduct(id);
        onNotify && onNotify({ action: 'delete', id, message: 'Producto eliminado' });
      } catch (err) {
        onNotify && onNotify('Error al eliminar producto');
      }
    }
  }; 

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-20 animate-in fade-in slide-in-from-top-4">
      <div className="bg-white border-2 border-neutral-100 rounded-[2.5rem] p-6 sm:p-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Inventario Verzing</h2>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">Gestión de Catálogo Triple A</p>
          </div>
          <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (isAdding) {
                setIsAdding(false);
                setEditingId(null);
                setFormData({ name: '', price: '', vibe: 'Streetwear', sizes: '', imagesDataUrls: [] });
              } else {
                setIsAdding(true);
              }
            }}
            className="bg-amber-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center gap-2"
          > 
            {isAdding ? <X size={16} /> : <Plus size={16} />}
            {isAdding ? 'Cancelar' : 'Nuevo Modelo'}
          </button>

          {usingFirestore && (
            <button
              onClick={async () => {
                if (!confirm('Subir todos los productos locales a Firestore? Esto puede sobrescribir documentos existentes con el mismo id.')) return;
                try {
                  setIsAdding(false);
                  // show a quick notification
                  onNotify && onNotify('Iniciando sincronización con Firestore...');
                  const res = await migrateProductsToFirestore(products);
                  onNotify && onNotify(`Sincronización completa. Migrados: ${res.success}, errores: ${res.fail}`);
                } catch (err) {
                  onNotify && onNotify(err?.message || 'Error al sincronizar');
                }
              }}
              className="bg-white text-amber-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-600 hover:bg-amber-50 transition-all"
            >
              Sincronizar catálogo
            </button>
          )}
        </div>
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
                <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block">Fotos del Modelo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  onChange={handleFileChange}
                  className="w-full bg-white px-6 py-4 rounded-xl border border-neutral-200 outline-none focus:border-amber-600"
                />

                {formData.imagesDataUrls && formData.imagesDataUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {formData.imagesDataUrls.map((src, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-neutral-200">
                        <img src={src} alt={`Preview ${idx+1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeImageAt(idx)} className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-sm text-rose-500">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
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

const Navbar = ({ wishlistCount, onOpenAssistant, userRole, currentUser, onLogout, onOpenLogin, usingFirestore, activeTab, setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-[100] h-16 md:h-20 bg-[#FDFCFB]/90 backdrop-blur-xl border-b border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex justify-between items-center text-left">
        <div className="text-2xl font-black tracking-tighter cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          VERZING<span className="text-amber-600 group-hover:animate-pulse">.</span>
        </div>
        
        <div className="hidden md:flex space-x-10 text-[10px] font-bold uppercase tracking-[0.2em]">
          <button onClick={() => { setActiveTab && setActiveTab('shop'); setTimeout(() => document.getElementById('catalog')?.scrollIntoView({behavior: 'smooth'}), 50); }} className="hover:text-amber-600 transition-colors">Catálogo</button>
          <button onClick={onOpenAssistant} className="hover:text-amber-600 transition-colors flex items-center gap-2">
            ✨ Asistente AI
          </button>
          <button 
            onClick={() => setActiveTab && setActiveTab('sizes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${activeTab === 'sizes' ? 'bg-amber-600 text-white' : 'hover:bg-neutral-100 text-neutral-400'}`}
            title="Guía de Tallas"
          >
            <Maximize2 size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Guía de Tallas</span>
          </button>
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 bg-neutral-50 rounded-full shadow-sm">
          <Menu size={18} />
        </button> 

        <div className="flex items-center space-x-5">
          {userRole ? (
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-neutral-100 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                <User size={12} /> {userRole === 'admin' ? `${currentUser} 👑` : currentUser}
              </div>
              <button onClick={onLogout} className="p-2 hover:bg-rose-50 text-rose-500 rounded-full transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenLogin} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all">
              <LogIn size={14} /> Acceder
            </button>
          )}
          <Heart size={18} className="cursor-pointer hidden sm:block" />
          {usingFirestore && (
            <div className="hidden sm:flex items-center text-[10px] bg-amber-50 text-amber-800 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Sincronizado</div>
          )}
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

      {/* Mobile slide-over menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 flex justify-end">
          <div className="w-72 bg-white h-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="text-lg font-black">VERZING</div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-neutral-100"><X size={18} /></button>
            </div>
            <nav className="flex flex-col gap-4">
              <button onClick={() => { setMobileMenuOpen(false); setActiveTab && setActiveTab('shop'); setTimeout(() => document.getElementById('catalog')?.scrollIntoView({behavior: 'smooth'}), 50); }} className="uppercase font-bold">Catálogo</button>
              <button onClick={() => { onOpenAssistant(); setMobileMenuOpen(false);}} className="text-left uppercase font-bold">✨ Asistente AI</button>
              <button onClick={() => { setMobileMenuOpen(false); setActiveTab && setActiveTab('sizes'); }} className="text-left uppercase font-bold">Guía de Tallas</button>
              {userRole ? (
                <button onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="text-left text-rose-500">Cerrar sesión</button>
              ) : (
                <button onClick={() => { onOpenLogin(); setMobileMenuOpen(false); }} className="text-left">Acceder</button>
              )}
            </nav>
          </div>
        </div>
      )}
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
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] mb-6 sm:mb-10 uppercase">
          SNEAKERS<br />QUE <span className="border-text italic">HABLAN</span><br />POR TI.
        </h1>
        <p className="text-gray-500 max-w-sm mb-6 text-sm leading-relaxed font-medium">
          Curaduría premium de calzado Triple A. Tu estilo no tiene límites, nuestra calidad tampoco.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })}
            className="bg-black text-white px-8 py-4 sm:px-10 sm:py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-600 transition-all shadow-xl shadow-black/10"
          >
            Explorar Catálogo
          </button>
          <button 
            onClick={onOpenAssistant}
            className="border-2 border-black px-8 py-4 sm:px-10 sm:py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
          >
            ✨ Consultar IA
          </button>
        </div>

        {/* Small-screen hero image */}
        <div className="md:hidden mt-8 w-full flex justify-center">
          <div className="w-11/12 aspect-[3/2] rounded-2xl overflow-hidden shadow-2xl">
            <img src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=1000" alt="Verzing" className="w-full h-full object-cover" />
          </div>
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
      <img src={Array.isArray(product.image) ? product.image[0] : product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
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
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product]);

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
          <div className="w-full max-w-md">
            <div className="aspect-square bg-white rounded-3xl flex items-center justify-center shadow-inner relative overflow-hidden">
              <img src={(Array.isArray(product.image) ? product.image[activeImageIndex] : product.image)} className="w-full h-full object-cover" />
            </div>
            {Array.isArray(product.image) && product.image.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
                {product.image.map((src, idx) => (
                  <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`w-20 h-20 rounded-xl overflow-hidden border-2 ${activeImageIndex === idx ? 'border-amber-600' : 'border-transparent'}`}>
                    <img src={src} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
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

const SizeGuide = ({ onBack }) => {
  const [gender, setGender] = useState('men');
  const [selectedSize, setSelectedSize] = useState(40);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  // Datos de referencia (Talla EU vs Medida en CM)
  const sizeData = {
    men: [
      { eu: 38, cm: 24.5 }, { eu: 39, cm: 25 }, { eu: 40, cm: 25.5 },
      { eu: 41, cm: 26 }, { eu: 42, cm: 26.5 }, { eu: 43, cm: 27.5 }, { eu: 44, cm: 28 }
    ],
    women: [
      { eu: 35, cm: 22 }, { eu: 36, cm: 22.5 }, { eu: 37, cm: 23.5 },
      { eu: 38, cm: 24 }, { eu: 39, cm: 25 }, { eu: 40, cm: 25.5 }
    ]
  };

  const currentMeasure = sizeData[gender].find(s => s.eu === selectedSize) || sizeData[gender][0];
  const shoeScale = (currentMeasure.cm / 30) * 100;

  // Map cm to a hue-rotate value (-60deg .. +60deg)
  const sizesArr = sizeData[gender];
  const minCm = sizesArr[0].cm;
  const maxCm = sizesArr[sizesArr.length - 1].cm;
  const hue = ((currentMeasure.cm - minCm) / (maxCm - minCm)) * 120 - 60;
  const imgFilter = `hue-rotate(${hue}deg) saturate(1.05) contrast(0.98)`;

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setLightboxOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-10 bg-white rounded-[3rem] border-2 border-neutral-100 shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header con Botón Volver */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Guía de Tallas</h2>
          <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-amber-600"></span> Ajuste de Precisión Verzing
          </p>
        </div>
        <button 
          onClick={() => onBack && onBack()} 
          className="group flex items-center gap-3 px-6 py-3 bg-neutral-50 hover:bg-black hover:text-white rounded-2xl transition-all duration-300 border border-neutral-100"
        >
          <span className="text-[10px] font-black uppercase tracking-widest">Cerrar Guía</span>
          <X size={16} className="group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 items-start">
        {/* COLUMNA IZQUIERDA: Visualización y Fotos (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Contenedor del Zapato a Escala */}
          <div className="relative flex flex-col items-center justify-center bg-neutral-50 rounded-[2.5rem] p-10 h-[450px] border border-neutral-100 overflow-hidden shadow-inner">
            <div className="absolute top-6 left-6 flex items-center gap-2 text-[9px] font-black uppercase text-amber-600 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm">
              <Maximize2 size={12} /> Escala Real Relativa
            </div>
            
            <div 
              className="transition-all duration-700 ease-out flex flex-col items-center"
              style={{ width: `${shoeScale}%`, maxWidth: '90%' }}
            >
              <img 
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800" 
                alt="Escala" 
                className="w-full drop-shadow-[0_35px_35px_rgba(0,0,0,0.15)] grayscale hover:grayscale-0 transition-all duration-500 cursor-crosshair"
                style={{ filter: imgFilter, transition: 'filter 0.5s ease' }}
              />
              {/* Regla Inferior */}
              <div className="w-full h-[2px] bg-black mt-6 relative">
                <div className="absolute -left-0.5 -top-1 w-1 h-3 bg-black"></div>
                <div className="absolute -right-0.5 -top-1 w-1 h-3 bg-black"></div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="text-[11px] font-black tracking-tighter bg-black text-white px-3 py-1 rounded-full">{currentMeasure.cm} CM</span>
                </div>
              </div>
            </div>
          </div>

          {/* GALERÍA DE 2 IMÁGENES: Bien distribuidas (usar assets locales en src/assets/Tallas) */}
          <div className="grid grid-cols-2 gap-4">
            {[Tabladetallas, Comomedir].map((src, idx) => (
              <div key={idx} className="group relative h-56 md:h-64 rounded-[2rem] overflow-hidden border border-neutral-100 shadow-sm cursor-zoom-in flex items-center justify-center bg-neutral-50">
                <img
                  src={src}
                  alt={idx === 0 ? 'Tabla de tallas' : 'Cómo medir'}
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  onClick={() => { setLightboxSrc(src); setLightboxOpen(true); }}
                />
                <div className="absolute inset-0 bg-black/6 group-hover:bg-transparent transition-colors pointer-events-none"></div>
              </div>
            ))}
          </div>

          {/* Lightbox modal para ampliar imagen */}
          {lightboxOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80" onClick={() => setLightboxOpen(false)}></div>
              <div className="relative max-w-4xl w-full z-50">
                <button onClick={() => setLightboxOpen(false)} className="absolute top-3 right-3 z-50 p-2 bg-white rounded-full"><X size={20} /></button>
                <img src={lightboxSrc} alt="Ampliada" className="w-full max-h-[90vh] object-contain rounded-xl" />
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: Controles (5/12) */}
        <div className="lg:col-span-5 space-y-8 bg-neutral-50/50 p-8 rounded-[2.5rem] border border-neutral-100">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-6 text-center">Selecciona Categoría</p>
            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-neutral-100">
              <button 
                onClick={() => { setGender('men'); setSelectedSize(40); }}
                className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${gender === 'men' ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:text-black'}`}
              >Hombres</button>
              <button 
                onClick={() => { setGender('women'); setSelectedSize(37); }}
                className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${gender === 'women' ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:text-black'}`}
              >Mujeres</button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest mb-6 block text-neutral-400 text-center">Talla Europea (EU)</label>
            <div className="grid grid-cols-4 gap-3">
              {sizeData[gender].map((item) => (
                <button
                  key={item.eu}
                  onClick={() => setSelectedSize(item.eu)}
                  className={`py-5 rounded-2xl text-sm font-black transition-all border-2 ${selectedSize === item.eu ? 'border-amber-600 bg-amber-600 text-white scale-105 shadow-md' : 'border-white bg-white hover:border-neutral-200 shadow-sm'}`}
                >
                  {item.eu}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-10 -mt-10 transition-all group-hover:bg-amber-100"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Medida Interna</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tighter">{currentMeasure.cm}</span>
                <span className="text-lg font-bold text-neutral-400 uppercase">cm</span>
              </div>
              <div className="mt-6 flex items-center gap-3 text-[9px] font-bold uppercase text-neutral-500 bg-neutral-50 p-3 rounded-xl">
                <ShieldCheck size={14} className="text-amber-600" /> Ajuste Sugerido Verzing
              </div>
            </div>
          </div>
          
          <button className="w-full bg-black text-white py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-amber-600 transition-all shadow-xl shadow-black/5">
            Confirmar Disponibilidad
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  // Session (username + role) persisted as verzing_session
  const [currentUser, setCurrentUser] = useState(() => {
    const s = localStorage.getItem('verzing_session');
    if (!s) return null;
    const parsed = JSON.parse(s);
    return parsed.displayName || parsed.username || null;
  });
  const [userRole, setUserRole] = useState(() => {
    const s = localStorage.getItem('verzing_session');
    return s ? JSON.parse(s).role : null;
  });
  // Notification message (used to show cross-tab updates)
  const [notif, setNotif] = useState('');

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('verzing_products');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });
  const [activeVibe, setActiveVibe] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [activeTab, setActiveTab] = useState('shop');

  // Seed admin user on first run
  useEffect(() => { seedAdmin(); }, []);

  // Broadcast channel ref for real-time updates across tabs
  const bcRef = useRef(null);

  useEffect(() => {
    if ('BroadcastChannel' in window) {
      bcRef.current = new BroadcastChannel('verzing_updates');
      bcRef.current.onmessage = (ev) => {
        const data = ev.data;
        if (!data) return;
        if (data.type === 'products_update' && data.products) {
          setProducts(data.products);
          setNotif(data.action === 'create' ? 'Nuevo producto agregado' : 'Catálogo actualizado');
          setTimeout(() => setNotif(''), 4000);
        }
        if (data.type === 'session_update') {
          // optional: update session from other tabs
          if (data.session) {
            setCurrentUser(data.session.displayName || data.session.username || null);
            setUserRole(data.session.role || null);
          }
        }
      };
      return () => bcRef.current.close();
    }
  }, []);

  // Firestore usage detection (env vars OR firebase config present)
  const [usingFirestore] = useState(Boolean((import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_API_KEY) || firebaseConfigured));

  // If Firestore is enabled, subscribe to the productos collection in real time
  useEffect(() => {
    if (!usingFirestore) return;
    const q = query(collection(db, 'productos'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(docs.length ? docs : DEFAULT_PRODUCTS);
    }, (err) => {
      // eslint-disable-next-line no-console
      console.error('Firestore onSnapshot error', err);
    });
    return () => unsub();
  }, [usingFirestore]);

  useEffect(() => {
    if (!usingFirestore) localStorage.setItem('verzing_products', JSON.stringify(products));
  }, [products, usingFirestore]);

  // Keep session synced
  useEffect(() => {
    if (userRole) {
      localStorage.setItem('verzing_session', JSON.stringify({ username: currentUser, role: userRole }));
    } else {
      localStorage.removeItem('verzing_session');
    }
  }, [userRole, currentUser]);

  // Sync across tabs/windows: watch for localStorage changes
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'verzing_products' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setProducts(parsed);
          setNotif('Catálogo actualizado por otro administrador');
          setTimeout(() => setNotif(''), 4000);
        } catch (err) {
          // ignore
        }
      }

      if (e.key === 'verzing_session') {
        if (e.newValue) {
          try {
            const s = JSON.parse(e.newValue);
            setCurrentUser(s.displayName || s.username || null);
            setUserRole(s.role || null);
          } catch (err) {
            // ignore
          }
        } else {
          setCurrentUser(null);
          setUserRole(null);
        }
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Handle notifications & announcements from AdminPanel (and broadcast when admin makes changes)
  const handleNotify = (msg) => {
    if (!msg) return;
    // backward-compatible: simple string messages
    if (typeof msg === 'string') {
      setNotif(msg);
      setTimeout(() => setNotif(''), 4000);
      return;
    }

    // msg: { action, product, id, products, message }
    const { action, products: updatedProducts, message } = msg;
    if (message) setNotif(message);
    else setNotif(action === 'create' ? 'Producto creado' : 'Catálogo actualizado');
    setTimeout(() => setNotif(''), 4000);

    // Broadcast to other tabs immediately
    if (bcRef.current && updatedProducts) {
      bcRef.current.postMessage({ type: 'products_update', action, products: updatedProducts });
    }
  };

  // Firestore CRUD helpers (fallback to localStorage when not configured)
  const createProduct = async (product) => {
    if (!usingFirestore) {
      const newProduct = { ...product, id: Date.now() };
      const updated = [...products, newProduct];
      setProducts(updated);
      handleNotify({ action: 'create', product: newProduct, products: updated, message: 'Producto creado' });
      return newProduct;
    }
    const col = collection(db, 'productos');
    const docRef = await addDoc(col, { ...product, createdAt: serverTimestamp() });
    return { id: docRef.id, ...product };
  };

  const updateProduct = async (id, product) => {
    if (!usingFirestore) {
      const updated = products.map(p => p.id === id ? { ...product, id } : p);
      setProducts(updated);
      handleNotify({ action: 'update', product: { ...product, id }, products: updated, message: 'Producto actualizado' });
      return;
    }
    await setDoc(doc(db, 'productos', String(id)), { ...product, updatedAt: serverTimestamp() }, { merge: true });
  };

  const deleteProduct = async (id) => {
    if (!usingFirestore) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      handleNotify({ action: 'delete', id, products: updated, message: 'Producto eliminado' });
      return;
    }
    await deleteDoc(doc(db, 'productos', String(id)));
  };

  // Migrate current local products to Firestore (overwrites by id)
  const migrateProductsToFirestore = async (items) => {
    if (!usingFirestore) throw new Error('Firestore no está habilitado');
    if (!Array.isArray(items) || items.length === 0) throw new Error('No hay productos para migrar');

    // Quick size check for data URLs (warn if any are large)
    const oversized = items.filter(p => {
      const img = p.image;
      return typeof img === 'string' && img.startsWith('data:') && img.length > 500000; // ~500KB
    });
    if (oversized.length) {
      throw new Error(`Hay ${oversized.length} imagenes en formato DataURL muy grandes. Sube las imágenes a Storage o reduce su tamaño antes de migrar.`);
    }

    let success = 0;
    let fail = 0;
    for (const p of items) {
      try {
        const docId = String(p.id || Date.now());
        await setDoc(doc(db, 'productos', docId), { ...p, createdAt: serverTimestamp() });
        success++;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('migrate error', err);
        fail++;
      }
    }

    // Notify and return summary
    handleNotify({ action: 'migrate', products: items, message: `Migrados: ${success}, errores: ${fail}` });
    return { success, fail };
  };


  // Keep selected product in sync when products change (reflect edits or delete)
  useEffect(() => {
    if (!selectedProduct) return;
    const updated = products.find(p => p.id === selectedProduct.id);
    setSelectedProduct(updated || null);
  }, [products, selectedProduct]);

  useEffect(() => {
    const handleScroll = () => setIsHeaderSticky(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = (user) => {
    const displayName = (user.firstName || user.lastName) ? `${(user.firstName || '').trim()} ${(user.lastName || '').trim()}`.trim() : user.username;
    setCurrentUser(displayName);
    setUserRole(user.role);
    localStorage.setItem('verzing_session', JSON.stringify({ username: user.username, role: user.role, displayName }));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserRole(null);
    localStorage.removeItem('verzing_session');
  }; 

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
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginOpen(true)}
        usingFirestore={usingFirestore}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {activeTab === 'shop' && (
        <>
          <Hero onOpenAssistant={() => setIsAssistantOpen(true)} userRole={userRole} />

          {userRole === 'admin' && (
            <AdminPanel products={products} setProducts={setProducts} onNotify={(msg) => handleNotify(msg)} createProduct={createProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} usingFirestore={usingFirestore} migrateProductsToFirestore={migrateProductsToFirestore} />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} onClick={setSelectedProduct} />
                ))}
              </div> 
            </div>
          </section>
        </>
      )}

      {activeTab === 'sizes' && (
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto text-left">
            <SizeGuide onBack={() => setActiveTab('shop')} />
          </div>
        </section>
      )}

      <Footer />

      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
      <AIAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} products={products} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLogin={(user) => { handleLogin(user); setIsLoginOpen(false); }} />

      {!isAssistantOpen && (
        <button onClick={() => setIsAssistantOpen(true)} className="fixed bottom-10 right-10 z-[100] bg-black text-white p-5 rounded-full shadow-2xl hover:bg-amber-600 transition-all hover:scale-110 active:scale-95 group">
          <Sparkles size={24} className="group-hover:animate-spin" />
        </button>
      )}
    </div>
  );
}