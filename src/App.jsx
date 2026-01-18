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
import { collection, query, orderBy, onSnapshot, addDoc, setDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import AboutUs from './AboutUs';

// Local size-guide assets
import Tabladetallas from './assets/Tallas/Tabladetallas.jpeg';
import Comomedir from './assets/Tallas/Comomedir.jpeg';

// --- DATOS INICIALES ---
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Air Jordan 1 Retro",
    brand: "Jordan",
    gender: "Hombre",
    price: 850000,
    vibe: "Retro",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800",
    sizes: [38, 39, 40, 41, 42],
    popularity: [40, 50, 60, 45, 70, 90]
  },
  {
    id: 2,
    name: "Nike Dunk Low",
    brand: "Nike",
    gender: "Dama",
    price: 620000,
    vibe: "Streetwear",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800",
    sizes: [37, 38, 39, 40],
    popularity: [30, 40, 35, 60, 80, 85]
  },
  {
    id: 3,
    name: "Yeezy Boost 350",
    brand: "Adidas",
    gender: "Unisex",
    price: 1200000,
    vibe: "Limited",
    image: "https://images.unsplash.com/photo-1512374382149-433a4279743a?q=80&w=800",
    sizes: [40, 41, 42, 43, 44],
    popularity: [80, 85, 90, 95, 98, 100]
  },
  {
    id: 4,
    name: "Nike Air Max Uptempo",
    brand: "Nike",
    gender: "Hombre",
    price: 650000,
    promoPrice: 480000,
    promoUntil: "2026-01-20T23:59:59",
    vibe: "Limited",
    isPromo: true,
    image: "https://images.unsplash.com/photo-1549989473-8e6a3b8f1d60?q=80&w=800",
    sizes: [39, 40, 41, 42],
    popularity: [60, 70, 80, 90, 95, 99]
  }
];

// Registrar Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// --- CONFIGURACIÓN ---
const apiKey = ""; // La clave se proporciona en el entorno de ejecución
const ADMIN_PASSWORD = "admin123";
const USER_PASSWORD = "user123";

// Número de WhatsApp para consultas (código de país + número, sin '+', ej: '573004371955')
const WHATSAPP_NUMBER = '573004371955';

const BRANDS = ['Todas', 'Nike', 'Adidas', 'Jordan', 'New Balance', 'On Cloud', 'Asics', 'Puma', 'Reebok', 'Vans', 'Converse', 'Under Armour', 'Skechers', 'Louis Vuitton', 'Dolce & Gabbana', 'Amiri', 'Hugo boss', 'La coste ', 'Le coq sportif', 'Fila', 'OFF WHITE'];
const STYLES = ['Todos', 'Streetwear', 'Retro', 'Limited', 'Deportivo', 'Casual', 'Para Salir'];
const GENDERS = ['Todos', 'Hombre', 'Dama', 'Unisex', 'Niños'];
const EURO_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

// --- CONTENIDO Y TEXTOS POR DEFECTO (CMS) ---
const DEFAULT_TEXTOS = {
  dropText: 'Drop 2026 / Selección Auténtica',
  titleMain: 'SNEAKERS\nQUE HABLAN\nPOR TI.',
  subtitle: 'Curaduría premium de calzado Triple A. Tu estilo no tiene límites, nuestra calidad tampoco.',
  welcomeMessage: 'Bienvenido a Verzing — selección curada para auténticos coleccionistas.',
  aboutMission: 'Nuestra misión es ofrecer calzado de la más alta calidad, cuidadosamente seleccionado para clientes que valoran autenticidad y estilo.',
  aboutVision: 'Ser la referencia regional en calzado premium, impulsando comunidad y cultura urbana a través de colecciones exclusivas.',
  shippingMethods: 'Envíos 24-72h con tracking. Opciones estándar y exprés disponibles.',
  paymentMethods: 'Aceptamos tarjetas, PSE, transferencias y pagos en cuotas.',
  designImage: ''
};

// --- UTIL: COMPRESIÓN DE IMÁGENES (máx 1MB) ---
async function compressImageFile(file, maxMB = 1) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          let quality = 0.9;
          let attempt = 0;
          const maxAttempts = 10;
          const tryCompress = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const jpeg = canvas.toDataURL('image/jpeg', quality);
            const approxMB = ((jpeg.length - 26) * 3) / 4 / (1024 * 1024);
            if (approxMB <= maxMB || quality < 0.3 || attempt >= maxAttempts) {
              resolve(jpeg);
            } else {
              quality -= 0.1;
              attempt += 1;
              tryCompress();
            }
          };
          tryCompress();
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

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

const AdminPanel = ({ products, setProducts, onNotify, createProduct, updateProduct, deleteProduct, usingFirestore, migrateProductsToFirestore, cmsTextos, setCmsTextos }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [adminTab, setAdminTab] = useState('inventario'); // 'inventario' | 'diseno'
  const [designData, setDesignData] = useState(() => cmsTextos || DEFAULT_TEXTOS);
    const [formData, setFormData] = useState({ name: '', price: '', vibe: 'Streetwear', sizes: [], gender: 'Unisex', brand: 'Nike', imagesDataUrls: [], isPromo: false, promoPrice: '', promoUntil: '' });

    // Sync designData when cmsTextos changes
    useEffect(() => {
      setDesignData(cmsTextos || DEFAULT_TEXTOS);
    }, [cmsTextos]);

    // Maneja la carga de múltiples archivos y los comprime usando compressImageFile
    const handleFileChange = async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      try {
        const urls = await Promise.all(files.map(f => compressImageFile(f, 1)));
        setFormData(prev => ({ ...prev, imagesDataUrls: [...(prev.imagesDataUrls || []), ...urls] }));
      } catch (err) {
        console.error('Error compressing images:', err);
      }
    };

    // Maneja imagen de diseño con compresión
    const handleDesignImageUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await compressImageFile(file, 1);
        setDesignData(prev => ({ ...prev, designImage: dataUrl }));
      } catch (err) {
        console.error('Error compressing design image:', err);
      }
    };

    // Guardar configuración de diseño en Firestore
    const handleSaveDesign = async () => {
      try {
        if (usingFirestore) {
          await setDoc(doc(db, 'configuracion', 'textos_web'), designData, { merge: true });
          onNotify && onNotify('✅ Configuración de diseño guardada en Firestore');
        } else {
          localStorage.setItem('verzing_textos', JSON.stringify(designData));
          onNotify && onNotify('✅ Configuración guardada localmente');
        }
        setCmsTextos && setCmsTextos(designData);
      } catch (err) {
        console.error('Error saving design config:', err);
        onNotify && onNotify('❌ Error al guardar configuración');
      }
    };

    const removeImageAt = (index) => {
      setFormData(prev => ({ ...prev, imagesDataUrls: prev.imagesDataUrls.filter((_, i) => i !== index) }));
    };

    const toggleSize = (size) => {
      setFormData(prev => ({
        ...prev,
        sizes: prev.sizes.includes(size) ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size]
      }));
    };

    const handleSave = async (e) => {
      if (e) e.preventDefault();

      // 1. Validación de campos críticos
      if (!formData.name || !formData.price || !Array.isArray(formData.imagesDataUrls) || formData.imagesDataUrls.length === 0) {
        alert("⚠️ Completa los campos obligatorios y sube al menos una imagen.");
        return;
      }

      // 2. Crear un OBJETO ÚNICO (Evita usar productPayload y productToSave a la vez)
      const finalProduct = {
        name: formData.name.trim(),
        brand: formData.brand || 'Nike',
        price: parseFloat(formData.price),
        vibe: formData.vibe || 'Streetwear',
        gender: formData.gender || 'Unisex',
        sizes: Array.isArray(formData.sizes) ? formData.sizes : [],
        image: formData.imagesDataUrls,
        isPromo: Boolean(formData.isPromo),
        promoPrice: formData.isPromo ? parseFloat(formData.promoPrice) : null,
        promoUntil: formData.isPromo ? formData.promoUntil : null,
        updatedAt: new Date().toISOString()
      };

      try {
        if (editingId) {
          // MODO EDICIÓN
          await updateProduct(editingId, finalProduct);

          // Actualizar estado local SIN duplicar
          setProducts(prev => prev.map(p => 
            String(p.id) === String(editingId) ? { ...finalProduct, id: editingId } : p
          ));

          alert('✅ Producto actualizado correctamente');
        } else {
          // MODO CREACIÓN
          const newProduct = { ...finalProduct, id: Date.now() };
          const created = await createProduct(newProduct);

          // Si Firestore no lo añade automáticamente, lo añadimos al estado local
          if (!usingFirestore) {
            setProducts(prev => [newProduct, ...prev]);
          }
          alert('✅ Producto creado con éxito');
        }

        // 3. RESET TOTAL (Limpia el editingId para que la próxima no sea edición)
        setEditingId(null);
        setIsAdding(false);
        setFormData({
          name: '', price: '', brand: 'Nike', vibe: 'Streetwear', 
          gender: 'Unisex', sizes: [], imagesDataUrls: [],
          isPromo: false, promoPrice: '', promoUntil: ''
        });

      } catch (error) {
        console.error("Error crítico:", error);
        alert("❌ Error al procesar el producto");
      }
    };

  const handleEdit = (p) => {
    const imgs = Array.isArray(p.image) ? p.image : (p.image ? [p.image] : []);
    console.log("handleEdit - iniciando edición para ID:", p.id);
    setFormData({ 
      name: p.name, 
      price: p.price, 
      vibe: p.vibe, 
      sizes: Array.isArray(p.sizes) ? p.sizes : (p.sizes ? p.sizes.split(',').map(s => s.trim()) : []), 
      gender: p.gender || 'Unisex', 
      brand: p.brand || 'Nike',
      imagesDataUrls: imgs,
      isPromo: !!p.isPromo,
      promoPrice: p.promoPrice || '',
      promoUntil: p.promoUntil || ''
    });
    setEditingId(p.id);
    setIsAdding(true);
  };   

  const [removingId, setRemovingId] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto permanentemente?')) return;
    // Marca como "eliminando" para animar
    setRemovingId(id);
    setTimeout(async () => {
      try {
        await deleteProduct(id);
        onNotify && onNotify({ action: 'delete', id, message: 'Producto eliminado' });
      } catch (err) {
        onNotify && onNotify('Error al eliminar producto');
      } finally {
        setRemovingId(null);
      }
    }, 300); // tiempo para que se muestre la animación
  }; 

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 mb-20 animate-in fade-in slide-in-from-top-4">
      <div className="bg-white border-2 border-neutral-100 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-10">
        {/* Tabs de navegación del Admin */}
        <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto no-scrollbar -mx-1 px-1">
          <button
            onClick={() => setAdminTab('inventario')}
            className={`flex-shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'inventario' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
          >
            📦 Inventario
          </button>
          <button
            onClick={() => setAdminTab('diseno')}
            className={`flex-shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'diseno' ? 'bg-amber-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
          >
            🎨 Diseño Web
          </button>
        </div>

        {/* TAB: Diseño Web */}
        {adminTab === 'diseno' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">Configuración de Diseño</h2>
              <p className="text-[10px] sm:text-xs text-neutral-400 mt-1">Edita los textos del Hero y la sección Sobre Nosotros</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black uppercase text-neutral-400 mb-1.5 sm:mb-2 block">Texto Drop (Hero)</label>
                  <input value={designData.dropText || ''} onChange={e => setDesignData(prev => ({ ...prev, dropText: e.target.value }))} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-neutral-200 focus:border-amber-600 outline-none text-sm" />
                </div>
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black uppercase text-neutral-400 mb-1.5 sm:mb-2 block">Título Principal (usa \n para saltos)</label>
                  <textarea value={designData.titleMain || ''} onChange={e => setDesignData(prev => ({ ...prev, titleMain: e.target.value }))} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-neutral-200 focus:border-amber-600 outline-none text-sm" rows={3} />
                </div>
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black uppercase text-neutral-400 mb-1.5 sm:mb-2 block">Subtítulo Hero</label>
                  <input value={designData.subtitle || ''} onChange={e => setDesignData(prev => ({ ...prev, subtitle: e.target.value }))} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-neutral-200 focus:border-amber-600 outline-none text-sm" />
                </div>
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black uppercase text-neutral-400 mb-1.5 sm:mb-2 block">Mensaje de Bienvenida</label>
                  <input value={designData.welcomeMessage || ''} onChange={e => setDesignData(prev => ({ ...prev, welcomeMessage: e.target.value }))} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-neutral-200 focus:border-amber-600 outline-none text-sm" />
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black uppercase text-neutral-400 mb-1.5 sm:mb-2 block">Misión</label>
                  <textarea value={designData.aboutMission || ''} onChange={e => setDesignData(prev => ({ ...prev, aboutMission: e.target.value }))} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-neutral-200 focus:border-amber-600 outline-none text-sm" rows={3} />
                </div>
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black uppercase text-neutral-400 mb-1.5 sm:mb-2 block">Visión</label>
                  <textarea value={designData.aboutVision || ''} onChange={e => setDesignData(prev => ({ ...prev, aboutVision: e.target.value }))} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-neutral-200 focus:border-amber-600 outline-none text-sm" rows={3} />
                </div>
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black uppercase text-neutral-400 mb-1.5 sm:mb-2 block">Métodos de Envío</label>
                  <input value={designData.shippingMethods || ''} onChange={e => setDesignData(prev => ({ ...prev, shippingMethods: e.target.value }))} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-neutral-200 focus:border-amber-600 outline-none text-sm" />
                </div>
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black uppercase text-neutral-400 mb-1.5 sm:mb-2 block">Métodos de Pago</label>
                  <input value={designData.paymentMethods || ''} onChange={e => setDesignData(prev => ({ ...prev, paymentMethods: e.target.value }))} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-neutral-200 focus:border-amber-600 outline-none text-sm" />
                </div>
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black uppercase text-neutral-400 mb-1.5 sm:mb-2 block">Imagen de Diseño (opcional, máx 1MB)</label>
                  <input type="file" accept="image/*" onChange={handleDesignImageUpload} className="w-full text-sm" />
                  {designData.designImage && (
                    <div className="mt-3 relative inline-block">
                      <img src={designData.designImage} alt="Preview" className="w-24 sm:w-32 h-18 sm:h-24 object-cover rounded-lg sm:rounded-xl shadow" />
                      <button type="button" onClick={() => setDesignData(prev => ({ ...prev, designImage: '' }))} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
              <button onClick={handleSaveDesign} className="bg-amber-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center justify-center gap-2">
                <Save size={14} className="sm:hidden" /><Save size={16} className="hidden sm:block" /> Guardar Cambios
              </button>
              <button onClick={() => setDesignData(DEFAULT_TEXTOS)} className="bg-neutral-100 text-neutral-600 px-5 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all">
                Restaurar Valores
              </button>
            </div>
          </div>
        )}

        {/* TAB: Inventario */}
        {adminTab === 'inventario' && (
          <>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-10">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tighter">Inventario Verzing</h2>
            <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">Gestión de Catálogo Triple A</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button 
            onClick={() => {
              if (isAdding) {
                setIsAdding(false);
                setEditingId(null);
                setFormData({ name: '', price: '', vibe: 'Streetwear', sizes: [], gender: 'Unisex', brand: 'Nike', imagesDataUrls: [] });
              } else {
                setIsAdding(true);
              }
            }}
            className="bg-amber-600 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center"
          > 
            {isAdding ? <X size={14} className="sm:hidden" /> : <Plus size={14} className="sm:hidden" />}
            {isAdding ? <X size={16} className="hidden sm:block" /> : <Plus size={16} className="hidden sm:block" />}
            {isAdding ? 'Cancelar' : 'Nuevo'}
            <span className="hidden sm:inline">{isAdding ? '' : ' Modelo'}</span>
          </button>

          {usingFirestore && (
            <button
              onClick={async () => {
                if (!confirm('Subir todos los productos locales a Firestore? Esto puede sobrescribir documentos existentes con el mismo id.')) return;
                try {
                  setIsAdding(false);
                  onNotify && onNotify('Iniciando sincronización con Firestore...');
                  const res = await migrateProductsToFirestore(products);
                  onNotify && onNotify(`Sincronización completa. Migrados: ${res.success}, errores: ${res.fail}`);
                } catch (err) {
                  onNotify && onNotify(err?.message || 'Error al sincronizar');
                }
              }}
              className="bg-white text-amber-600 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest border border-amber-600 hover:bg-amber-50 transition-all"
            >
              <span className="sm:hidden">Sync</span>
              <span className="hidden sm:inline">Sincronizar catálogo</span>
            </button>
          )}

          <button
            onClick={() => {
              if (!confirm('Limpiar localStorage y recargar la página? Esto borrará datos locales y recargará la app.')) return;
              localStorage.clear();
              window.location.reload();
            }}
            className="bg-rose-50 text-rose-500 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest border border-rose-200 hover:bg-rose-100 transition-all"
          >
            Reset
          </button>
        </div>
        </div>

        {isAdding && (
          <form onSubmit={handleSave} className="bg-neutral-50 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl mb-8 sm:mb-12 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-in zoom-in-95">
            <div className="space-y-3 sm:space-y-4">
              <input 
                placeholder="Nombre del Modelo" 
                className="w-full bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-neutral-200 outline-none focus:border-amber-600 text-sm"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required 
              />
              <input 
                placeholder="Precio (Ej: 185000)" 
                type="number" 
                className="w-full bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-neutral-200 outline-none focus:border-amber-600 text-sm"
                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required 
              />
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase ml-2 text-neutral-400">Marca</label>
                  <select 
                    className="w-full bg-white px-3 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-neutral-200 outline-none focus:border-amber-600 text-sm"
                    value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}
                  >
                    {BRANDS.filter(b => b !== 'Todas').map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase ml-2 text-neutral-400">Género</label>
                  <select 
                    className="w-full bg-white px-3 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-neutral-200 outline-none focus:border-amber-600 text-sm"
                    value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
                  >
                    {GENDERS.filter(g => g !== 'Todos').map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {/* SECCIÓN DE TALLAS (36-45 EUR) */}
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[9px] sm:text-[10px] font-black uppercase text-neutral-400 ml-2">Tallas Disponibles (EUR)</label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 p-2 bg-white sm:bg-neutral-50 rounded-xl sm:rounded-2xl">
                  {EURO_SIZES.map(size => (
                    <button
                      key={`size-btn-${size}`}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold transition-all border-2 ${
                        formData.sizes.includes(size)
                        ? 'bg-black text-white border-black shadow-md'
                        : 'bg-white text-neutral-400 border-neutral-100 hover:border-neutral-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECCIÓN DE ESTILO / OCASIÓN */}
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[9px] sm:text-[10px] font-black uppercase text-neutral-400 ml-2">Estilo / Ocasión</label>
                <select 
                  className="w-full bg-white sm:bg-neutral-50 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-none outline-none focus:ring-2 focus:ring-amber-500 font-bold text-sm"
                  value={formData.vibe}
                  onChange={e => setFormData({...formData, vibe: e.target.value})}
                >
                  {STYLES.filter(s => s !== 'Todos').map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-2 block">Fotos del Modelo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  onChange={handleFileChange}
                  className="w-full bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-neutral-200 outline-none focus:border-amber-600 text-sm"
                />

                {formData.imagesDataUrls && formData.imagesDataUrls.length > 0 && (
                  <div className="mt-3 sm:mt-4 grid grid-cols-4 sm:grid-cols-4 gap-2">
                    {formData.imagesDataUrls.map((src, idx) => (
                      <div key={idx} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden border border-neutral-200">
                        <img src={src} alt={`Preview ${idx+1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeImageAt(idx)} className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 p-0.5 sm:p-1 bg-white rounded-full shadow-sm text-rose-500">
                          <Trash2 size={10} className="sm:hidden" />
                          <Trash2 size={12} className="hidden sm:block" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Promo fields */}
              <div className="md:col-span-2 p-4 sm:p-6 bg-amber-50 rounded-2xl sm:rounded-3xl border-2 border-amber-100 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <input 
                    type="checkbox" 
                    id="isPromo"
                    checked={formData.isPromo}
                    onChange={e => setFormData({...formData, isPromo: e.target.checked})}
                    className="w-4 h-4 sm:w-5 sm:h-5 accent-amber-600"
                  />
                  <label htmlFor="isPromo" className="text-xs sm:text-sm font-black uppercase italic">¿Es una promoción activa?</label>
                </div>

                {formData.isPromo && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 animate-in fade-in zoom-in-95">
                    <input 
                      placeholder="Precio de Oferta" 
                      type="number" 
                      className="w-full bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-neutral-200 text-sm"
                      value={formData.promoPrice} 
                      onChange={e => setFormData({...formData, promoPrice: e.target.value})} 
                    />
                    <input 
                      type="datetime-local" 
                      className="w-full bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-neutral-200 text-sm"
                      value={formData.promoUntil} 
                      onChange={e => setFormData({...formData, promoUntil: e.target.value})} 
                    />
                  </div>
                )}

              <button type="submit" className="w-full bg-black text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-amber-600 transition-all">
                Finalizar y Publicar
              </button>
            </div>
          </div>
          </form>
        )}

        <div className="grid gap-3 sm:gap-4">
          {products.map(p => (
            <div key={p.id} className={`flex items-center justify-between p-3 sm:p-4 bg-neutral-50 rounded-xl sm:rounded-2xl hover:bg-white border border-transparent hover:border-neutral-100 transition-all group ${removingId && removingId.toString() === p.id.toString() ? 'animate-out fade-out slide-out-to-right duration-300' : ''}`}>
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
                   <img src={Array.isArray(p.image) ? p.image[0] : p.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm sm:text-lg truncate">{p.name}</h4>
                  <p className="text-[8px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-widest">${p.price.toLocaleString()} • {p.vibe}</p>
                </div>
              </div>
              <div className="flex gap-1.5 sm:gap-2 flex-shrink-0 ml-2">
                <button type="button" onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="p-2 sm:p-3 bg-white text-amber-600 rounded-lg sm:rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm" title="Editar">
                  <Edit size={14} className="sm:hidden" />
                  <Edit size={16} className="hidden sm:block" />
                </button>
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} 
                  className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all ${removingId === p.id ? 'opacity-50 scale-90 bg-gray-200' : 'bg-white text-rose-500 hover:bg-rose-500 hover:text-white'}`}
                  disabled={removingId === p.id}
                  title="Eliminar"
                >
                  <Trash2 size={14} className="sm:hidden" />
                  <Trash2 size={16} className="hidden sm:block" />
                </button>
              </div>
            </div>
          ))}
        </div>
          </>
        )}
      </div>
    </div>
  );
};

const Navbar = ({ wishlistCount, onOpenAssistant, userRole, currentUser, onLogout, onOpenLogin, usingFirestore, activeTab, setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Detectar scroll para efecto glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateTo = (tab, scrollId = null) => {
    setActiveTab && setActiveTab(tab);
    setMobileMenuOpen(false);
    if (scrollId) {
      setTimeout(() => {
        document.getElementById(scrollId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <>
      {/* NAVBAR PRINCIPAL - GLASSMORPHISM */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${isScrolled ? 'bg-white/70 backdrop-blur-xl shadow-lg shadow-black/5' : 'bg-white/95'}`}>
        <div className="h-16 md:h-20 flex items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
          {/* Logo con identidad de marca */}
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => navigateTo('shop')}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-black rounded-lg flex items-center justify-center group-hover:bg-amber-600 transition-colors">
              <span className="text-white font-black text-sm sm:text-base">V</span>
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tighter">
              ERZING<span className="text-amber-600">.CO</span>
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 lg:space-x-10">
            <button 
              onClick={() => navigateTo('shop', 'catalog')} 
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-amber-600 ${activeTab === 'shop' ? 'text-amber-600' : 'text-neutral-700'}`}
            >
              Drops
            </button>
            <button 
              onClick={() => navigateTo('about')} 
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-amber-600 ${activeTab === 'about' ? 'text-amber-600' : 'text-neutral-700'}`}
            >
              Sobre Nosotros
            </button>
            <button 
              onClick={onOpenAssistant} 
              className="text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-amber-600 flex items-center gap-2 text-neutral-700"
            >
              <Sparkles size={14} className="text-amber-600" /> Asistente AI
            </button>
            <button 
              onClick={() => setActiveTab('sizes')}
              className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl transition-all ${activeTab === 'sizes' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'text-neutral-700 hover:text-amber-600'}`}
            >
              Guía de Tallas
            </button>
          </div>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative cursor-pointer p-2 hover:bg-neutral-100 rounded-full transition-colors">
              <ShoppingCart size={18} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[8px] rounded-full w-5 h-5 flex items-center justify-center font-black">{wishlistCount}</span>
              )}
            </div>

            {userRole ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-neutral-600 hidden lg:block">{currentUser?.firstName || currentUser?.username}</span>
                <button 
                  onClick={onLogout} 
                  className="bg-rose-50 hover:bg-rose-100 text-rose-500 px-5 py-2.5 rounded-full font-black uppercase text-[9px] tracking-widest transition-all"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <button 
                onClick={onOpenLogin} 
                className="bg-black hover:bg-amber-600 text-white px-5 py-2.5 rounded-full font-black uppercase text-[9px] tracking-widest transition-all flex items-center gap-2"
              >
                <LogIn size={14} /> Ingresar
              </button>
            )}
          </div>

          {/* Mobile: Solo carrito y hamburguesa */}
          <div className="flex md:hidden items-center gap-3">
            <div className="relative cursor-pointer p-2">
              <ShoppingCart size={18} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[7px] rounded-full w-4 h-4 flex items-center justify-center font-black">{wishlistCount}</span>
              )}
            </div>
            
            {/* Login/Logout circular en móvil */}
            {userRole ? (
              <button 
                onClick={onLogout}
                className="w-9 h-9 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center hover:bg-rose-100 transition-colors"
              >
                <LogOut size={16} />
              </button>
            ) : (
              <button 
                onClick={onOpenLogin}
                className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors"
              >
                <LogIn size={16} />
              </button>
            )}

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* MENÚ MÓVIL FULLSCREEN */}
      <div className={`
        md:hidden fixed inset-0 bg-white/95 backdrop-blur-xl transition-all duration-500 ease-out z-[150]
        ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}>
        <div className="p-6 flex flex-col h-full pt-20">
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-5 right-5 p-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors"
          >
            <X size={22} />
          </button>

          <div className="space-y-3 flex-1">
            <button 
              onClick={() => {
                setActiveTab('shop');
                setMobileMenuOpen(false);
                document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`w-full flex items-center justify-between p-5 rounded-2xl text-sm font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'shop' ? 'bg-black text-white' : 'bg-neutral-50 text-neutral-800 active:bg-neutral-100'}`}
            >
              Drops <TrendingUp size={18} />
            </button>

            <button 
              onClick={() => {
                setActiveTab('about');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between p-5 rounded-2xl text-sm font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'about' ? 'bg-amber-600 text-white' : 'bg-neutral-50 text-neutral-800 active:bg-neutral-100'}`}
            >
              Sobre Nosotros <User size={18} />
            </button>

            <button 
              onClick={() => {
                setActiveTab('sizes');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between p-5 rounded-2xl text-sm font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'sizes' ? 'bg-amber-600 text-white' : 'bg-neutral-50 text-neutral-800 active:bg-neutral-100'}`}
            >
              Guía de Tallas <Maximize2 size={18} />
            </button>
          </div>

          {/* Footer del menú móvil */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex justify-center gap-6">
              <a href="https://www.instagram.com/verzing.co/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all">
                <Instagram size={20} />
              </a>
              <a href="https://wa.me/3004371955" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center hover:bg-green-500 hover:text-white transition-all">
                <MessageCircle size={20} />
              </a>
            </div>
            
            {currentUser ? (
              <button 
                onClick={() => { onLogout(); setMobileMenuOpen(false); }} 
                className="w-full py-4 rounded-2xl bg-rose-50 text-rose-500 font-black uppercase text-[10px] tracking-widest hover:bg-rose-100 transition-colors"
              >
                Cerrar Sesión
              </button>
            ) : (
              <button 
                onClick={() => { onOpenLogin(); setMobileMenuOpen(false); }} 
                className="w-full py-4 rounded-2xl bg-black text-white font-black uppercase text-[10px] tracking-widest hover:bg-amber-600 transition-colors"
              >
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN FLOTANTE INFERIOR - MÓVIL */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 pointer-events-none">
        <div className="bg-black/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/30 pointer-events-auto">
          <div className="flex items-center justify-around py-2 relative">
            {/* Drops */}
            <button 
              onClick={() => {
                setActiveTab('shop');
                document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${activeTab === 'shop' ? 'text-amber-500' : 'text-white/70'}`}
            >
              <TrendingUp size={20} />
              <span className="text-[8px] font-black uppercase tracking-wider mt-1">Drops</span>
            </button>

            {/* Tallas */}
            <button 
              onClick={() => setActiveTab('sizes')}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${activeTab === 'sizes' ? 'text-amber-500' : 'text-white/70'}`}
            >
              <Maximize2 size={20} />
              <span className="text-[8px] font-black uppercase tracking-wider mt-1">Tallas</span>
            </button>

            {/* Botón Central - Asistente AI (sobresale) */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-6">
              <button 
                onClick={onOpenAssistant}
                className="w-14 h-14 bg-amber-600 rounded-full flex items-center justify-center shadow-xl shadow-amber-600/40 hover:bg-amber-500 transition-all active:scale-95 ring-4 ring-black/90"
              >
                <Sparkles size={24} className="text-white" />
              </button>
            </div>

            {/* Spacer para el botón central */}
            <div className="w-16"></div>

            {/* About */}
            <button 
              onClick={() => setActiveTab('about')}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${activeTab === 'about' ? 'text-amber-500' : 'text-white/70'}`}
            >
              <User size={20} />
              <span className="text-[8px] font-black uppercase tracking-wider mt-1">Nosotros</span>
            </button>

            {/* Menu */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center py-2 px-4 rounded-xl text-white/70 transition-all"
            >
              <Menu size={20} />
              <span className="text-[8px] font-black uppercase tracking-wider mt-1">Menú</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const Hero = ({ onOpenAssistant, cmsTextos }) => {
  const { dropText, titleMain, subtitle } = cmsTextos || DEFAULT_TEXTOS;
  
  return (
  <section className="relative min-h-screen flex items-center pt-24 sm:pt-20 px-6 bg-[#FDFCFB] overflow-hidden">
    <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center text-left">
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 z-10">
        <h4 className="text-amber-600 font-bold tracking-[0.5em] text-[10px] uppercase mb-6 flex items-center gap-2">
          <span className="w-8 h-[1px] bg-amber-600"></span>
          {dropText}
        </h4>
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] mb-6 sm:mb-10 uppercase">
          {String(titleMain).split('\n').map((line, i) => (
            <span key={i}>
              {i === 1 ? <><span className="border-text italic">{line}</span><br /></> : <>{line}<br /></>}
            </span>
          ))}
        </h1>
        <p className="text-gray-500 max-w-sm mb-6 text-sm leading-relaxed font-medium">
          {subtitle}
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
};

const ProductCard = ({ product, onClick }) => (
  <div 
    className="group cursor-pointer active:scale-95 transition-transform duration-200" 
    onClick={() => onClick(product)}
    style={{ touchAction: 'manipulation' }}
  >
    <div className="aspect-[4/5] bg-neutral-100 rounded-[2rem] sm:rounded-[2.5rem] mb-4 relative overflow-hidden">
      <img src={Array.isArray(product.image) ? product.image[0] : product.image} className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest text-black shadow-sm">
        {product.brand}
      </div>
    </div>
    <div className="flex justify-between items-start px-1">
      <div>
        <h3 className="font-black text-base sm:text-lg leading-tight uppercase">{product.name}</h3>
        <p className="text-neutral-400 text-[9px] font-bold uppercase tracking-widest">{product.gender} • {product.vibe}</p>
      </div>
      <div className="text-right">
        {product.isPromo && product.promoPrice ? (
          <>
            <p className="font-black text-sm sm:text-base whitespace-nowrap text-amber-600">${Number(product.promoPrice).toLocaleString()}</p>
            <p className="text-[9px] text-neutral-400 line-through">${Number(product.price).toLocaleString()}</p>
          </>
        ) : (
          <p className="font-black text-sm sm:text-base whitespace-nowrap text-amber-600">${Number(product.price).toLocaleString()}</p>
        )}
      </div>
    </div>
  </div>
);

const CatalogSection = ({ products, onProductClick, activeBrand, setActiveBrand, activeStyle, setActiveStyle, activeGender, setActiveGender }) => {
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchBrand = activeBrand === 'Todas' || p.brand === activeBrand;
      const matchStyle = activeStyle === 'Todos' || p.vibe === activeStyle;
      const matchGender = activeGender === 'Todos' || p.gender === activeGender;
      return matchBrand && matchStyle && matchGender;
    });
  }, [activeBrand, activeStyle, activeGender, products]);

  return (
    <section id="catalog" className="py-12 md:py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none mb-2">The Drop</h2>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">Selección Curada: {filteredProducts.length} Modelos</p>
          </div>

          <div className="flex justify-center md:justify-start gap-6 border-b border-neutral-100 pb-4 overflow-x-auto no-scrollbar touch-pan-x">
            {GENDERS.map(g => (
              <button 
                key={g} 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveGender(g); }}
                className={`relative py-2 text-[11px] font-black uppercase tracking-widest min-w-[60px] transition-all ${activeGender === g ? 'text-amber-600 border-b-2 border-amber-600' : 'text-neutral-400'}`}
              >
                {g}
                {activeGender === g && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-600 animate-in fade-in duration-300" />
                )}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-[8px] font-black uppercase text-neutral-400 tracking-widest text-center md:text-left">Marcas</p>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 touch-pan-x">
              {BRANDS.map((brand) => (
                <button 
                  key={brand} 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveBrand(brand); }} 
                  className={activeBrand === brand ? 'flex-shrink-0 min-h-[48px] px-8 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2 bg-black text-white border-black shadow-xl scale-105' : 'flex-shrink-0 min-h-[48px] px-8 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2 border-neutral-100 bg-white active:bg-neutral-50'}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[8px] font-black uppercase text-neutral-400 tracking-widest text-center md:text-left">Estilo / Ocasión</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {STYLES.map((style) => (
                <button 
                  key={style} 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveStyle(style); }} 
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${activeStyle === style ? 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm' : 'bg-neutral-50 text-neutral-500 border-transparent'}`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} onClick={onProductClick} />
          ))}
        </div>
      </div>
    </section>
  );
};

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

  const handleWhatsAppChat = () => {
    if (!selectedSize) { alert('Por favor, selecciona una talla primero.'); return; }
    const phone = (WHATSAPP_NUMBER || '').toString().replace(/\D/g, '');
    if (!phone) { alert('Número de WhatsApp no configurado'); return; }
    const priceText = product.isPromo && product.promoPrice ? Number(product.promoPrice).toLocaleString('es-CO') : Number(product.price).toLocaleString('es-CO');
    const promoText = product.isPromo ? ` que está en oferta a $${priceText}` : '';
    const message = `Hola Verzing! 👋\n\nEstoy interesado en el modelo *${product.name}*${promoText}\n*Talla:* ${selectedSize}\n\n¿Está disponible?`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    const w = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!w) window.location.href = whatsappUrl;
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-5xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 sm:top-8 sm:right-8 z-10 p-2 bg-white/80 sm:bg-white/50 backdrop-blur rounded-full transition-colors">
          <X size={18} className="sm:hidden" />
          <X size={20} className="hidden sm:block" />
        </button>
        <div className="w-full md:w-1/2 bg-neutral-50 flex items-center justify-center p-4 sm:p-8 md:p-12">
          <div className="w-full max-w-md">
            <div className="aspect-square bg-white rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-inner relative overflow-hidden">
              <img src={(Array.isArray(product.image) ? product.image[activeImageIndex] : product.image)} className="w-full h-full object-cover" />
            </div>
            {Array.isArray(product.image) && product.image.length > 1 && (
              <div className="mt-3 sm:mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {product.image.map((src, idx) => (
                  <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`flex-shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden border-2 ${activeImageIndex === idx ? 'border-amber-600' : 'border-transparent'}`}>
                    <img src={src} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="w-full md:w-1/2 p-5 sm:p-8 md:p-12 flex flex-col text-left">
          <span className="text-amber-600 font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-2 sm:mb-4">{product.vibe} Collection</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter mb-2 leading-none uppercase">{product.name}</h2>
          {product.isPromo && product.promoPrice ? (
            <div className="mb-4 sm:mb-8">
              <p className="text-xl sm:text-2xl font-black mb-1 text-amber-600">$ {Number(product.promoPrice).toLocaleString('es-CO')}</p>
              <p className="text-xs sm:text-sm text-neutral-400 line-through">$ {Number(product.price).toLocaleString('es-CO')}</p>
            </div>
          ) : (
            <p className="text-xl sm:text-2xl font-bold mb-4 sm:mb-8">$ {Number(product.price).toLocaleString('es-CO')}</p>
          )}

          <div className="mb-4 sm:mb-8 p-4 sm:p-6 bg-amber-50 rounded-2xl sm:rounded-3xl border border-amber-100">
            <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-amber-800 mb-2 sm:mb-3 flex items-center gap-2">
              <Sparkles size={10} className="animate-pulse sm:hidden" />
              <Sparkles size={12} className="animate-pulse hidden sm:block" /> Conserje de Estilo AI
            </h3>
            <div className="text-[10px] sm:text-xs text-amber-900 leading-relaxed mb-3 sm:mb-4 min-h-[25px] sm:min-h-[30px]">
              {loadingAI ? <span className="animate-pulse italic">Analizando tendencias...</span> : (aiAdvice || "¿Cómo combinarías estos Verzing?")}
            </div>
            {!aiAdvice && !loadingAI && (
              <button onClick={handleGetStyleAdvice} className="bg-amber-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-widest hover:bg-amber-700 transition-all">Generar Consejos ✨</button>
            )}
          </div>

          <div className="mb-4 sm:mb-8 bg-neutral-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl h-[90px] sm:h-[120px]">
             <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-neutral-400 mb-1 sm:mb-2">Demanda en Tiempo Real</p>
             <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }} />
          </div>

          <div className="mb-4 sm:mb-8">
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3 sm:mb-4">Tallas EU</p>
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {product.sizes.map(size => (
                <button key={size} onClick={() => setSelectedSize(size)} className={`py-2.5 sm:py-4 text-[10px] sm:text-xs font-bold rounded-xl sm:rounded-2xl border-2 transition-all ${selectedSize === size ? 'border-black bg-black text-white' : 'border-neutral-100 hover:border-black'}`}>{size}</button>
              ))}
            </div>
          </div>
          <button 
            onClick={handleWhatsAppChat}
            disabled={!selectedSize}
            className={`w-full py-4 sm:py-6 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all ${
              selectedSize 
              ? 'bg-black text-white hover:bg-amber-600 shadow-xl' 
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {selectedSize ? 'Consultar por WhatsApp' : 'Selecciona una talla'}
          </button>
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

const PromoSection = ({ products, onProductClick }) => {
  const promoProducts = products.filter(p => p.isPromo && p.promoUntil && new Date(p.promoUntil) > new Date());
  if (promoProducts.length === 0) return null;

  const PromoCard = ({ p }) => {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
      const id = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(id);
    }, []);

    const until = new Date(p.promoUntil).getTime();
    const diff = Math.max(0, until - now);
    const days = Math.floor(diff / (24*60*60*1000));
    const hours = Math.floor((diff % (24*60*60*1000)) / (60*60*1000));
    const minutes = Math.floor((diff % (60*60*1000)) / (60*1000));
    const seconds = Math.floor((diff % (60*1000)) / 1000);

    const expired = diff <= 0;

    return (
      <div className="group cursor-pointer bg-zinc-900 rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-4 border border-white/5 hover:border-amber-600/50 transition-all" onClick={() => !expired && onProductClick(p)}>
        <div className="aspect-square rounded-xl sm:rounded-[2rem] overflow-hidden relative mb-4 sm:mb-6">
          <img src={Array.isArray(p.image) ? p.image[0] : p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-amber-600 text-black px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest animate-pulse">-{Math.round((1 - p.promoPrice / p.price) * 100)}%</div>
        </div>
        <div className="px-2 sm:px-4 pb-2 sm:pb-4">
          <h3 className="text-base sm:text-xl font-black uppercase mb-1 sm:mb-2 truncate">{p.name}</h3>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-lg sm:text-2xl font-black text-amber-600">${Number(p.promoPrice).toLocaleString()}</span>
            <span className="text-xs sm:text-sm text-zinc-500 line-through">${Number(p.price).toLocaleString()}</span>
          </div>
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/5 flex items-center justify-between">
             <span className="text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Finaliza pronto</span>
             {expired ? (
               <div className="text-[10px] sm:text-xs font-black uppercase bg-black/60 px-2 sm:px-3 py-1 rounded">Finalizada</div>
             ) : (
               <div className="flex gap-1 sm:gap-2">
                  <div className="bg-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-black">{days}d</div>
                  <div className="bg-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-black">{hours}h</div>
                  <div className="bg-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-black">{minutes}m</div>
                  <div className="bg-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-black">{seconds}s</div>
               </div>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="py-12 sm:py-20 bg-black text-white overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 sm:mb-12 gap-4 sm:gap-6">
          <div>
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none">Ofertas <span className="text-amber-600">Flash</span></h2>
            <p className="text-zinc-500 font-bold uppercase tracking-widest mt-2 sm:mt-4 text-[10px] sm:text-xs">Solo por tiempo limitado</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          {promoProducts.map(p => (
            <PromoCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-[#0A0A0A] text-white pt-12 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 overflow-hidden">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 pb-12 sm:pb-20 border-b border-white/5">
        <div className="space-y-6 sm:space-y-8 text-left">
          <div className="text-2xl sm:text-4xl font-black tracking-tighter italic">VERZING<span className="text-amber-600">.CO</span></div>
          <p className="text-zinc-400 max-w-sm text-xs sm:text-sm leading-relaxed font-medium">Nacidos en el asfalto, curados para la autenticidad. No vendemos solo calzado, entregamos la confianza para caminar tu propia verdad.</p>
          <div className="flex space-x-4 sm:space-x-6">
            <a href="https://www.instagram.com/verzing.co/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer"><Instagram size={14} className="sm:hidden" /><Instagram size={16} className="hidden sm:block" /></a>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer text-[9px] sm:text-[10px] font-bold">TK</div>
            <a href="https://wa.me/3004371955" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer"><MessageCircle size={14} className="sm:hidden" /><MessageCircle size={16} className="hidden sm:block" /></a>
          </div>
        </div>
        <div className="bg-zinc-900/50 p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] border border-white/5 text-left">
          <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 uppercase tracking-tighter">Únete al próximo Drop</h4>
          <p className="text-zinc-500 text-[10px] sm:text-xs mb-5 sm:mb-8">Sé el primero en enterarte de las colecciones limitadas y lanzamientos exclusivos Triple A.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input type="email" placeholder="Tu email" className="flex-1 bg-black border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm focus:outline-none focus:border-amber-600 transition-colors" />
            <button className="bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center gap-2">Suscribirse <Send size={10} className="sm:hidden" /><Send size={12} className="hidden sm:block" /></button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 py-10 sm:py-20 text-left">
        <div>
          <h5 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-amber-600 mb-5 sm:mb-8 italic">Catálogo</h5>
          <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-zinc-400 font-medium">
            <li className="hover:text-white cursor-pointer">Streetwear Essentials</li>
            <li className="hover:text-white cursor-pointer">Retro Classics</li>
            <li className="hover:text-white cursor-pointer">Limited Editions</li>
          </ul>
        </div>
        <div>
          <h5 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-amber-600 mb-5 sm:mb-8 italic">Calidad Verzing</h5>
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <ShieldCheck className="text-amber-600 flex-shrink-0" size={16} />
              <div><p className="text-[10px] sm:text-xs font-bold uppercase">Triple A Certificado</p></div>
            </div>
            <div className="flex items-start gap-3 sm:gap-4">
              <Truck className="text-amber-600 flex-shrink-0" size={16} />
              <div><p className="text-[10px] sm:text-xs font-bold uppercase">Envío Nacional</p></div>
            </div>
          </div>
        </div>
      </div>
      <div className="pt-8 sm:pt-12 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-8">
        <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-600 italic text-center sm:text-left">Verzing Footwear Co. • © 2025 All Rights Reserved.</div>
        <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group hover:text-amber-600 transition-colors">Volver arriba <ChevronUp size={12} className="group-hover:-translate-y-1 transition-transform sm:hidden" /><ChevronUp size={14} className="group-hover:-translate-y-1 transition-transform hidden sm:block" /></button>
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
    <div className="max-w-6xl mx-auto p-3 sm:p-6 md:p-10 bg-white rounded-2xl sm:rounded-[3rem] border-2 border-neutral-100 shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header con Botón Volver */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-12 gap-4 sm:gap-6">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter italic leading-none">Guía de Tallas</h2>
          <p className="text-neutral-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] mt-1 sm:mt-2 flex items-center justify-center sm:justify-start gap-2">
            <span className="w-3 sm:w-4 h-[1px] bg-amber-600"></span> Ajuste de Precisión Verzing
          </p>
        </div>
        <button 
          onClick={() => onBack && onBack()} 
          className="group flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-neutral-50 hover:bg-black hover:text-white rounded-xl sm:rounded-2xl transition-all duration-300 border border-neutral-100"
        >
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Cerrar Guía</span>
          <X size={14} className="sm:hidden group-hover:rotate-90 transition-transform" />
          <X size={16} className="hidden sm:block group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
        {/* COLUMNA IZQUIERDA: Visualización y Fotos (7/12) */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          {/* Contenedor del Zapato a Escala */}
          <div className="relative flex flex-col items-center justify-center bg-neutral-50 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-10 h-[280px] sm:h-[350px] md:h-[450px] border border-neutral-100 overflow-hidden shadow-inner">
            <div className="absolute top-3 left-3 sm:top-6 sm:left-6 flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[9px] font-black uppercase text-amber-600 bg-white/80 backdrop-blur px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg shadow-sm">
              <Maximize2 size={10} className="sm:hidden" />
              <Maximize2 size={12} className="hidden sm:block" /> Escala Real Relativa
            </div>
            
            <div 
              className="transition-all duration-700 ease-out flex flex-col items-center"
              style={{ width: `${shoeScale}%`, maxWidth: '90%' }}
            >
              <img 
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800" 
                alt="Escala" 
                className="w-full drop-shadow-[0_20px_20px_rgba(0,0,0,0.12)] sm:drop-shadow-[0_35px_35px_rgba(0,0,0,0.15)] grayscale hover:grayscale-0 transition-all duration-500 cursor-crosshair"
                style={{ filter: imgFilter, transition: 'filter 0.5s ease' }}
              />
              {/* Regla Inferior */}
              <div className="w-full h-[2px] bg-black mt-4 sm:mt-6 relative">
                <div className="absolute -left-0.5 -top-1 w-1 h-2 sm:h-3 bg-black"></div>
                <div className="absolute -right-0.5 -top-1 w-1 h-2 sm:h-3 bg-black"></div>
                <div className="absolute -bottom-7 sm:-bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="text-[10px] sm:text-[11px] font-black tracking-tighter bg-black text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">{currentMeasure.cm} CM</span>
                </div>
              </div>
            </div>
          </div>

          {/* GALERÍA DE 2 IMÁGENES */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[Tabladetallas, Comomedir].map((src, idx) => (
              <div key={idx} className="group relative h-36 sm:h-48 md:h-56 lg:h-64 rounded-xl sm:rounded-2xl md:rounded-[2rem] overflow-hidden border border-neutral-100 shadow-sm cursor-zoom-in flex items-center justify-center bg-neutral-50">
                <img
                  src={src}
                  alt={idx === 0 ? 'Tabla de tallas' : 'Cómo medir'}
                  className="w-full h-full object-contain p-2 sm:p-4 group-hover:scale-105 transition-transform duration-500"
                  onClick={() => { setLightboxSrc(src); setLightboxOpen(true); }}
                />
                <div className="absolute inset-0 bg-black/6 group-hover:bg-transparent transition-colors pointer-events-none"></div>
              </div>
            ))}
          </div>

          {/* Lightbox modal para ampliar imagen */}
          {lightboxOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4">
              <div className="absolute inset-0 bg-black/80" onClick={() => setLightboxOpen(false)}></div>
              <div className="relative max-w-4xl w-full z-50">
                <button onClick={() => setLightboxOpen(false)} className="absolute top-2 right-2 sm:top-3 sm:right-3 z-50 p-1.5 sm:p-2 bg-white rounded-full">
                  <X size={16} className="sm:hidden" />
                  <X size={20} className="hidden sm:block" />
                </button>
                <img src={lightboxSrc} alt="Ampliada" className="w-full max-h-[85vh] sm:max-h-[90vh] object-contain rounded-lg sm:rounded-xl" />
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: Controles (5/12) */}
        <div className="lg:col-span-5 space-y-5 sm:space-y-8 bg-neutral-50/50 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2.5rem] border border-neutral-100">
          <div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4 sm:mb-6 text-center">Selecciona Categoría</p>
            <div className="flex bg-white p-1 sm:p-1.5 rounded-xl sm:rounded-2xl shadow-sm border border-neutral-100">
              <button 
                onClick={() => { setGender('men'); setSelectedSize(40); }}
                className={`flex-1 py-3 sm:py-4 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all ${gender === 'men' ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:text-black'}`}
              >Hombres</button>
              <button 
                onClick={() => { setGender('women'); setSelectedSize(37); }}
                className={`flex-1 py-3 sm:py-4 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all ${gender === 'women' ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:text-black'}`}
              >Mujeres</button>
            </div>
          </div>

          <div>
            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-4 sm:mb-6 block text-neutral-400 text-center">Talla Europea (EU)</label>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {sizeData[gender].map((item) => (
                <button
                  key={item.eu}
                  onClick={() => setSelectedSize(item.eu)}
                  className={`py-3 sm:py-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all border-2 ${selectedSize === item.eu ? 'border-amber-600 bg-amber-600 text-white scale-105 shadow-md' : 'border-white bg-white hover:border-neutral-200 shadow-sm'}`}
                >
                  {item.eu}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[2rem] border border-neutral-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-amber-50 rounded-bl-full -mr-6 sm:-mr-10 -mt-6 sm:-mt-10 transition-all group-hover:bg-amber-100"></div>
            <div className="relative z-10">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1 sm:mb-2">Medida Interna</p>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">{currentMeasure.cm}</span>
                <span className="text-sm sm:text-lg font-bold text-neutral-400 uppercase">cm</span>
              </div>
              <div className="mt-4 sm:mt-6 flex items-center gap-2 sm:gap-3 text-[8px] sm:text-[9px] font-bold uppercase text-neutral-500 bg-neutral-50 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                <ShieldCheck size={12} className="text-amber-600 sm:hidden" />
                <ShieldCheck size={14} className="text-amber-600 hidden sm:block" /> Ajuste Sugerido Verzing
              </div>
            </div>
          </div>
          
          <button className="w-full bg-black text-white py-4 sm:py-6 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:bg-amber-600 transition-all shadow-xl shadow-black/5">
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

  // Firestore usage detection (env vars OR firebase config present)
  const usingFirestore = Boolean((import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_API_KEY) || firebaseConfigured);

  // Check whether the app has been initialized before
  const initialSaved = localStorage.getItem('verzing_products');
  const wasInitialized = localStorage.getItem('verzing_initialized') === '1';

  const [products, setProducts] = useState(() => {
    // If Firestore is enabled, don't load cached local data to avoid stale overrides
    if (usingFirestore) return [];
    if (initialSaved) return JSON.parse(initialSaved);
    // Only seed defaults on absolute first run
    return !wasInitialized ? DEFAULT_PRODUCTS : [];
  });
  const [activeVibe, setActiveVibe] = useState('all');
  const [activeBrand, setActiveBrand] = useState('Todas');
  const [activeStyle, setActiveStyle] = useState('Todos');
  const [activeGender, setActiveGender] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [activeTab, setActiveTab] = useState('shop');

  // CMS texts loaded from Firestore (or defaults)
  const [cmsTextos, setCmsTextos] = useState(DEFAULT_TEXTOS);

  // Seed admin user on first run
  useEffect(() => { seedAdmin(); }, []);

  // Load textos_web from Firestore (if available) or from localStorage as fallback
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (usingFirestore) {
          const cfgRef = doc(db, 'configuracion', 'textos_web');
          const snap = await getDoc(cfgRef);
          if (snap && snap.exists()) {
            mounted && setCmsTextos({ ...DEFAULT_TEXTOS, ...snap.data() });
            return;
          }
        }
        // fallback: try localStorage
        const saved = localStorage.getItem('verzing_textos');
        if (saved) {
          mounted && setCmsTextos({ ...DEFAULT_TEXTOS, ...JSON.parse(saved) });
        }
      } catch (err) {
        console.warn('Error loading textos_web:', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [usingFirestore]);

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

  // (usingFirestore already computed above)

  // If Firestore is enabled, subscribe to the productos collection in real time
  useEffect(() => {
    if (!usingFirestore) return;
    const q = query(collection(db, 'productos'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      // Normalize data so Firestore doc ID always wins (over any id in the body)
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      // Deduplicate by ID just in case the snapshot contains duplicates
      const unique = Array.from(new Map(docs.map(d => [String(d.id), d])).values());
      if (unique.length !== docs.length) console.warn('onSnapshot: removed duplicate docs in snapshot');
      // Replace local state with authoritative Firestore data
      console.log('onSnapshot: received', unique.length, 'productos');
      setProducts(unique);
    }, (err) => {
      // eslint-disable-next-line no-console
      console.error('Firestore onSnapshot error', err);
    });
    return () => unsub();
  }, [usingFirestore]);

  // If this is the absolute first run and we seeded DEFAULT_PRODUCTS above, persist that seed
  useEffect(() => {
    if (usingFirestore) return;
    const savedNow = localStorage.getItem('verzing_products');
    if (!savedNow && products && products.length > 0) {
      localStorage.setItem('verzing_products', JSON.stringify(products));
      localStorage.setItem('verzing_initialized', '1');
    }
  }, []); // run once

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
      // Use updater to avoid stale closures
      setProducts(prev => {
        const updated = [...prev, newProduct];
        localStorage.setItem('verzing_products', JSON.stringify(updated));
        handleNotify({ action: 'create', product: newProduct, products: updated, message: 'Producto creado' });
        return updated;
      });
      return newProduct;
    }

    // If the product already carries an ID (e.g., Date.now() from admin UI), use it as the document ID
    if (product.id) {
      const idStr = String(product.id);
      const productRef = doc(db, 'productos', idStr);
      await setDoc(productRef, { ...product, createdAt: serverTimestamp() });
      return { id: idStr, ...product };
    }

    // Otherwise use addDoc to let Firestore generate an ID
    const col = collection(db, 'productos');
    const docRef = await addDoc(col, { ...product, createdAt: serverTimestamp() });
    return { id: docRef.id, ...product };
  }; 

  const updateProduct = async (id, product) => {
    if (!usingFirestore) {
      // Use updater function to avoid stale closures and add debug logs
      setProducts(prev => {
        const updated = prev.map(p => {
          console.log("updateProduct mapping - ID buscado:", id, "ID en lista:", p.id);
          return String(p.id) === String(id) ? { ...product, id } : p;
        });
        // Persist immediately to localStorage
        localStorage.setItem('verzing_products', JSON.stringify(updated));
        handleNotify({ action: 'update', product: { ...product, id }, products: updated, message: 'Producto actualizado' });
        return updated;
      });
      return;
    }
    // Ensure Firestore ID is a string
    const productRef = doc(db, 'productos', String(id));
    await setDoc(productRef, { ...product, updatedAt: serverTimestamp() }, { merge: true });
  }; 

  const deleteProduct = async (id) => {
    const idStr = String(id);
    try {
      if (usingFirestore) {
        console.log('Intentando borrar ID:', idStr);

        const docRef = doc(db, 'productos', idStr);
        // Verify document exists before deleting
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          console.warn('deleteProduct: documento no encontrado en Firestore para ID:', idStr);
          alert('❌ El documento no existe en Firestore o el ID no coincide. Revisa la consola de Firebase para confirmar el nombre del documento.');
          return;
        }

        // Await delete in Firestore first — only on success we update UI
        await deleteDoc(docRef);

        // After successful delete, update local UI to match Firestore
        setProducts(prev => {
          const updated = prev.filter(p => String(p.id) !== idStr);
          handleNotify({ action: 'delete', id: idStr, products: updated, message: 'Producto eliminado' });
          return updated;
        });

        console.log(`Producto ${idStr} eliminado en Firestore.`);
        return;
      }

      // Non-Firestore: update UI and persist to localStorage immediately
      setProducts(prev => {
        const updated = prev.filter(p => String(p.id) !== idStr);
        localStorage.setItem('verzing_products', JSON.stringify(updated));
        handleNotify({ action: 'delete', id: idStr, products: updated, message: 'Producto eliminado' });
        return updated;
      });

      console.log(`Producto ${idStr} eliminado en local.`);
    } catch (err) {
      console.error('Error eliminando producto:', err);
      alert('❌ No se pudo eliminar el producto: ' + (err?.message || err));
      throw err;
    }
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

  // Catalog filtering is handled inside the new <CatalogSection /> component.

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-amber-100 selection:text-amber-900 relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .border-text { -webkit-text-stroke: 1px #1A1A1A; color: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* Mobile click & highlight fixes */
        button, a, input, select {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        /* Prevent filters being hidden under sticky navbar when scrolling */
        #catalog { scroll-margin-top: 96px; }
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
          <Hero onOpenAssistant={() => setIsAssistantOpen(true)} userRole={userRole} cmsTextos={cmsTextos} />

          {/* Sección de Promociones */}
          <PromoSection products={products} onProductClick={setSelectedProduct} />

          {userRole === 'admin' && (
            <AdminPanel products={products} setProducts={setProducts} onNotify={(msg) => handleNotify(msg)} createProduct={createProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} usingFirestore={usingFirestore} migrateProductsToFirestore={migrateProductsToFirestore} cmsTextos={cmsTextos} setCmsTextos={setCmsTextos} />
          )}

          <CatalogSection 
            products={products} 
            onProductClick={setSelectedProduct} 
            activeBrand={activeBrand} setActiveBrand={setActiveBrand}
            activeStyle={activeStyle} setActiveStyle={setActiveStyle}
            activeGender={activeGender} setActiveGender={setActiveGender}
          />
        </>
      )}

      {activeTab === 'about' && (
        <AboutUs cmsTextos={cmsTextos} />
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
        <button onClick={() => setIsAssistantOpen(true)} className="fixed bottom-10 right-10 z-[40] bg-black text-white p-5 rounded-full shadow-2xl hover:bg-amber-600 transition-all hover:scale-110 active:scale-95 group">
          <Sparkles size={24} className="group-hover:animate-spin" />
        </button>
      )}
    </div>
  );
}