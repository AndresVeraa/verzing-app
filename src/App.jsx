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
  Menu,
  Gift,
  Check,
  ChevronRight,
  Award
} from 'lucide-react';

import { db, firebaseConfigured, auth, loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword, logout, updateUserProfile, onAuthStateChanged } from './firebase';
import { collection, query, orderBy, onSnapshot, addDoc, setDoc, deleteDoc, doc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
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
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
      setSuccess('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateEmail = (e) => /\S+@\S+\.\S+/.test(e);
  const validatePhone = (p) => /^\+?\d{7,15}$/.test(p);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      const user = result.user;
      
      // Extraer datos del usuario de Google
      const displayName = user.displayName || 'Usuario';
      const nameParts = displayName.split(' ');
      const googleFirstName = nameParts[0] || '';
      const googleLastName = nameParts.slice(1).join(' ') || '';
      
      const userData = {
        username: user.uid,
        uid: user.uid,
        email: user.email,
        firstName: googleFirstName,
        lastName: googleLastName,
        phone: user.phoneNumber || '',
        role: 'user',
        isGoogleUser: true
      };
      
      onLogin(userData);
      
      // Mostrar bienvenida para nuevos usuarios de Google
      if (result._tokenResponse?.isNewUser) {
        alert(`¡Bienvenido/a ${googleFirstName}! 🎉\n\nTu cuenta ha sido creada con Google.\n\n🎁 Completa la encuesta en "Mi Perfil" para obtener un cupón de 15% OFF en tu primera compra.`);
      }
      
      onClose();
    } catch (err) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Inicio de sesión cancelado');
      } else if (err.code === 'auth/popup-blocked') {
        setError('El navegador bloqueó la ventana emergente. Permite ventanas emergentes e intenta de nuevo.');
      } else {
        setError(err.message || 'Error al iniciar con Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico');
      setLoading(false);
      return;
    }
    
    if (!validateEmail(email.trim())) {
      setError('Correo electrónico no válido');
      setLoading(false);
      return;
    }
    
    try {
      await resetPassword(email.trim());
      setSuccess('📧 Se ha enviado un enlace de recuperación a tu correo electrónico. Revisa tu bandeja de entrada (y spam).');
      setEmail('');
    } catch (err) {
      console.error('Reset password error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este correo');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Espera unos minutos.');
      } else {
        setError(err.message || 'Error al enviar correo de recuperación');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          setError('Completa correo y contraseña');
          setLoading(false);
          return;
        }
        
        if (!validateEmail(email.trim())) {
          setError('Correo electrónico no válido');
          setLoading(false);
          return;
        }
        
        const userCredential = await loginWithEmail(email.trim(), password);
        const user = userCredential.user;
        
        // Obtener displayName del usuario
        const displayName = user.displayName || '';
        const nameParts = displayName.split(' ');
        
        const userData = {
          username: user.uid,
          uid: user.uid,
          email: user.email,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          role: 'user'
        };
        
        onLogin(userData);
        onClose();
        
      } else if (mode === 'register') {
        // Validar todos los campos
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !password) {
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
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }
        if (password !== confirm) {
          setError('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }
        
        // Crear usuario en Firebase Auth
        const userCredential = await registerWithEmail(email.trim(), password);
        const user = userCredential.user;
        
        // Actualizar el perfil con nombre y apellido
        await updateUserProfile(user, {
          displayName: `${firstName.trim()} ${lastName.trim()}`
        });
        
        const userData = {
          username: user.uid,
          uid: user.uid,
          email: user.email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          role: 'user'
        };
        
        // Mostrar aviso de registro exitoso
        alert(`¡Bienvenido/a ${firstName.trim()}! 🎉\n\nTu cuenta ha sido creada exitosamente.\n\n🎁 Completa la encuesta en "Mi Perfil" para obtener un cupón de 15% OFF en tu primera compra.`);
        onLogin(userData);
        onClose();
      }
    } catch (err) {
      console.error('Auth error:', err);
      // Mapear errores de Firebase a mensajes en español
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado');
      } else if (err.code === 'auth/invalid-email') {
        setError('Correo electrónico no válido');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es muy débil (mínimo 6 caracteres)');
      } else if (err.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este correo');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Credenciales incorrectas');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Espera unos minutos.');
      } else {
        setError(err?.message || 'Error de autenticación');
      }
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
          <h2 className="text-2xl font-black uppercase tracking-tighter">
            {mode === 'login' ? 'Acceso' : mode === 'register' ? 'Registro' : 'Recuperar Contraseña'}
          </h2>
          <p className="text-sm text-neutral-400 mt-1 font-medium">
            {mode === 'login' ? 'Ingresa con tu correo' : mode === 'register' ? 'Crea una cuenta segura' : 'Te enviaremos un enlace'}
          </p>
        </div>
        
        {/* Modo: Olvidé mi contraseña */}
        {mode === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); setSuccess(''); }}
              className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-all"
              placeholder="Correo electrónico"
              autoFocus
            />
            
            {error && <p className="text-rose-500 text-xs text-center font-bold uppercase">{error}</p>}
            {success && <p className="text-emerald-600 text-xs text-center font-medium">{success}</p>}
            
            <button type="submit" disabled={loading} className="w-full bg-black text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-600 transition-all disabled:opacity-50">
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
            
            <div className="text-center text-xs text-neutral-500 mt-2">
              <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="underline">
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        ) : (
          /* Modo: Login o Registro */
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
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-all"
              placeholder="Correo electrónico"
              autoFocus
            />

            {mode === 'register' && (
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(''); }}
                className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-all"
                placeholder="Teléfono (ej +573xx...)"
              />
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

            <button type="submit" disabled={loading} className="w-full bg-black text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-600 transition-all disabled:opacity-50">
              {loading ? 'Procesando...' : (mode === 'login' ? 'Iniciar sesión' : 'Registrarme')}
            </button>
            
            {mode === 'login' && (
              <button 
                type="button" 
                onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                className="w-full text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
            
            {/* Separador */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-neutral-200"></div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">o continúa con</span>
              <div className="flex-1 h-px bg-neutral-200"></div>
            </div>
            
            {/* Botón de Google */}
            <button 
              type="button" 
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-neutral-200 py-3 rounded-2xl text-sm font-semibold hover:bg-neutral-50 hover:border-neutral-300 transition-all disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>

            <div className="text-center text-xs text-neutral-500 mt-2">
              {mode === 'login' ? (
                <button type="button" onClick={() => { setMode('register'); setError(''); }} className="underline">¿No tienes cuenta? Regístrate</button>
              ) : (
                <button type="button" onClick={() => { setMode('login'); setError(''); }} className="underline">¿Ya tienes cuenta? Ingresa</button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// --- PREGUNTAS DE LA ENCUESTA ---
const SURVEY_QUESTIONS = [
  {
    id: 1,
    question: "¿Cuál es tu rango de edad?",
    options: ["18-24 años", "25-34 años", "35-44 años", "45+ años"]
  },
  {
    id: 2,
    question: "¿Cuál es tu género?",
    options: ["Hombre", "Mujer", "Prefiero no decir", "Otro"]
  },
  {
    id: 3,
    question: "¿En qué ciudad vives?",
    options: ["Bogotá", "Medellín", "Cali", "Barranquilla", "Otra ciudad"]
  },
  {
    id: 4,
    question: "¿Qué estilo de sneakers prefieres?",
    options: ["Streetwear/Urban", "Retro/Vintage", "Deportivo", "Casual/Elegante", "Limited Edition"]
  },
  {
    id: 5,
    question: "¿Cuál es tu marca favorita?",
    options: ["Nike", "Adidas", "Jordan", "New Balance", "Otra"]
  },
  {
    id: 6,
    question: "¿Con qué frecuencia compras sneakers?",
    options: ["Cada mes", "Cada 3 meses", "Cada 6 meses", "Una vez al año", "Ocasionalmente"]
  },
  {
    id: 7,
    question: "¿Cuánto sueles invertir en un par de sneakers?",
    options: ["Menos de $300.000", "$300.000 - $500.000", "$500.000 - $800.000", "Más de $800.000"]
  },
  {
    id: 8,
    question: "¿Qué es lo más importante al comprar sneakers?",
    options: ["Diseño/Estética", "Comodidad", "Exclusividad", "Precio", "Marca"]
  },
  {
    id: 9,
    question: "¿Cómo conociste Verzing?",
    options: ["Instagram", "TikTok", "Recomendación", "Google", "Otro"]
  },
  {
    id: 10,
    question: "¿Qué tipo de contenido te gustaría ver?",
    options: ["Lanzamientos exclusivos", "Outfits/Combinaciones", "Historia de sneakers", "Ofertas y promos"]
  },
  {
    id: 11,
    question: "¿Prefieres comprar online o en tienda física?",
    options: ["100% Online", "Mayormente online", "Mitad y mitad", "Prefiero tienda física"]
  },
  {
    id: 12,
    question: "¿Te gustaría recibir notificaciones de drops exclusivos?",
    options: ["Sí, por WhatsApp", "Sí, por Email", "Sí, ambos", "No, gracias"]
  }
];

// --- COMPONENTE DE ENCUESTA ---
const SurveyModal = ({ isOpen, onClose, onComplete, userProfile }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentQuestion(0);
      setAnswers({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const question = SURVEY_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / SURVEY_QUESTIONS.length) * 100;

  const handleAnswer = (answer) => {
    setAnswers(prev => ({ ...prev, [question.id]: answer }));
    
    if (currentQuestion < SURVEY_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < SURVEY_QUESTIONS.length) {
      alert('Por favor responde todas las preguntas');
      return;
    }
    
    setIsSubmitting(true);
    await onComplete(answers);
    setIsSubmitting(false);
    onClose();
  };

  const isLastQuestion = currentQuestion === SURVEY_QUESTIONS.length - 1;
  const canSubmit = Object.keys(answers).length === SURVEY_QUESTIONS.length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header con progreso */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Gift size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">¡Obtén 15% OFF!</h2>
                <p className="text-white/80 text-xs">Completa la encuesta</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          
          {/* Barra de progreso */}
          <div className="w-full bg-white/30 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/80 text-[10px] mt-2 uppercase tracking-widest">
            Pregunta {currentQuestion + 1} de {SURVEY_QUESTIONS.length}
          </p>
        </div>

        {/* Contenido de la pregunta */}
        <div className="p-6">
          <h3 className="text-xl font-black mb-6 text-center">{question.question}</h3>
          
          <div className="space-y-3">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                className={`w-full p-4 rounded-2xl text-sm font-bold transition-all border-2 flex items-center justify-between ${
                  answers[question.id] === option
                    ? 'bg-amber-50 border-amber-500 text-amber-700'
                    : 'bg-neutral-50 border-transparent hover:border-neutral-200'
                }`}
              >
                <span>{option}</span>
                {answers[question.id] === option && <Check size={18} className="text-amber-600" />}
              </button>
            ))}
          </div>

          {/* Navegación */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                currentQuestion === 0 
                  ? 'text-neutral-300 cursor-not-allowed' 
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Anterior
            </button>

            {isLastQuestion && canSubmit ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-amber-600 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center gap-2"
              >
                {isSubmitting ? 'Procesando...' : (
                  <>
                    <Gift size={16} />
                    Obtener Cupón
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(prev => Math.min(SURVEY_QUESTIONS.length - 1, prev + 1))}
                disabled={!answers[question.id]}
                className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                  answers[question.id]
                    ? 'bg-black text-white hover:bg-amber-600'
                    : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                }`}
              >
                Siguiente <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE DE PERFIL DE USUARIO ---
const UserProfileModal = ({ isOpen, onClose, userProfile, onUpdateProfile, onOpenSurvey }) => {
  const [displayName, setDisplayName] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && userProfile) {
      setDisplayName(userProfile.displayName || '');
      setInstagramHandle(userProfile.instagram || '');
      setSaveSuccess(false);
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdateProfile({
      displayName: displayName.trim(),
      instagram: instagramHandle.trim().replace('@', '')
    });
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-black p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <User size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">Mi Perfil</h2>
                <p className="text-white/60 text-xs">Personaliza tu experiencia</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Estado del cupón */}
          <div className={`p-4 rounded-2xl border-2 ${
            userProfile?.hasCoupon 
              ? 'bg-green-50 border-green-200' 
              : userProfile?.surveyCompletedAt
                ? 'bg-neutral-50 border-neutral-200'
                : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  userProfile?.hasCoupon 
                    ? 'bg-green-500' 
                    : userProfile?.surveyCompletedAt
                      ? 'bg-neutral-400'
                      : 'bg-amber-500'
                } text-white`}>
                  {userProfile?.hasCoupon ? <Award size={20} /> : userProfile?.surveyCompletedAt ? <Check size={20} /> : <Gift size={20} />}
                </div>
                <div>
                  <p className={`text-sm font-black uppercase ${
                    userProfile?.hasCoupon 
                      ? 'text-green-700' 
                      : userProfile?.surveyCompletedAt
                        ? 'text-neutral-600'
                        : 'text-amber-700'
                  }`}>
                    {userProfile?.hasCoupon 
                      ? '¡Tienes 15% OFF!' 
                      : userProfile?.surveyCompletedAt
                        ? 'Encuesta realizada'
                        : 'Cupón Disponible'}
                  </p>
                  <p className={`text-xs ${
                    userProfile?.hasCoupon 
                      ? 'text-green-600' 
                      : userProfile?.surveyCompletedAt
                        ? 'text-neutral-500'
                        : 'text-amber-600'
                  }`}>
                    {userProfile?.hasCoupon 
                      ? 'Aplica en tu próxima compra por WhatsApp' 
                      : userProfile?.surveyCompletedAt
                        ? userProfile?.couponUsedAt 
                          ? 'Cupón ya utilizado' 
                          : 'Gracias por completar la encuesta'
                        : 'Completa la encuesta para obtenerlo'}
                  </p>
                </div>
              </div>
              {!userProfile?.hasCoupon && !userProfile?.surveyCompletedAt && (
                <button
                  onClick={onOpenSurvey}
                  className="bg-amber-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all"
                >
                  Obtener
                </button>
              )}
            </div>
          </div>

          {/* Campos editables */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">
                Nombre para mostrar
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">
                Instagram
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">@</span>
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value.replace('@', ''))}
                  placeholder="tu_usuario"
                  className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Botón guardar */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
              saveSuccess 
                ? 'bg-green-500 text-white' 
                : 'bg-black text-white hover:bg-amber-600'
            }`}
          >
            {isSaving ? 'Guardando...' : saveSuccess ? (
              <>
                <Check size={16} /> ¡Guardado!
              </>
            ) : (
              <>
                <Save size={16} /> Guardar Cambios
              </>
            )}
          </button>

          {/* Info adicional */}
          {userProfile?.couponUsedAt && (
            <p className="text-center text-xs text-neutral-400">
              Cupón usado el {new Date(userProfile.couponUsedAt).toLocaleDateString('es-CO')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminPanel = ({ products, setProducts, onNotify, createProduct, updateProduct, deleteProduct, usingFirestore, migrateProductsToFirestore, cmsTextos, setCmsTextos, heroImage, setHeroImage, handleUpdateHero, announcementConfig, setAnnouncementConfig }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [adminTab, setAdminTab] = useState('inventario'); // 'inventario' | 'diseno'
  const [designData, setDesignData] = useState(() => cmsTextos || DEFAULT_TEXTOS);
  const [heroImagePreview, setHeroImagePreview] = useState(heroImage || '');
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [announcementData, setAnnouncementData] = useState(announcementConfig || {});
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

    // Guardar configuración de barra de anuncios
    const handleSaveAnnouncement = async () => {
      try {
        if (usingFirestore) {
          await setDoc(doc(db, 'configuracion', 'announcement_bar'), announcementData, { merge: true });
          onNotify && onNotify('✅ Barra de anuncios actualizada');
        }
        setAnnouncementConfig && setAnnouncementConfig(announcementData);
      } catch (err) {
        console.error('Error saving announcement config:', err);
        onNotify && onNotify('❌ Error al guardar barra de anuncios');
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
              <p className="text-[10px] sm:text-xs text-neutral-400 mt-1">Edita los textos del Hero, barra de anuncios y la sección Sobre Nosotros</p>
            </div>

            {/* BARRA DE ANUNCIOS - NUEVA SECCIÓN */}
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-100">
              <label className="text-[10px] sm:text-xs font-black uppercase text-purple-700 mb-3 block flex items-center gap-2">
                📢 Barra de Anuncios Superior
              </label>
              <p className="text-[10px] text-neutral-500 mb-4">Esta barra aparece en la parte superior de la página. Ideal para promociones y mensajes importantes.</p>
              
              <div className="space-y-4">
                {/* Habilitar/Deshabilitar */}
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={announcementData.enabled !== false}
                      onChange={(e) => setAnnouncementData(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                  <span className="text-xs font-bold text-neutral-600">
                    {announcementData.enabled !== false ? 'Barra visible' : 'Barra oculta'}
                  </span>
                </div>

                {/* Texto del anuncio */}
                <div>
                  <label className="text-[9px] font-black uppercase text-neutral-400 mb-1.5 block">Mensaje del anuncio</label>
                  <textarea
                    value={announcementData.text || ''}
                    onChange={(e) => setAnnouncementData(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="🎁 15% OFF en tu primera compra..."
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-purple-500 outline-none text-sm resize-none"
                    rows={2}
                  />
                </div>

                {/* Colores */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase text-neutral-400 mb-1.5 block">Color de fondo</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={announcementData.bgColor || '#d97706'}
                        onChange={(e) => setAnnouncementData(prev => ({ ...prev, bgColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg border-2 border-neutral-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={announcementData.bgColor || '#d97706'}
                        onChange={(e) => setAnnouncementData(prev => ({ ...prev, bgColor: e.target.value }))}
                        className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 text-xs font-mono"
                        placeholder="#d97706"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-neutral-400 mb-1.5 block">Color del texto</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={announcementData.textColor || '#ffffff'}
                        onChange={(e) => setAnnouncementData(prev => ({ ...prev, textColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg border-2 border-neutral-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={announcementData.textColor || '#ffffff'}
                        onChange={(e) => setAnnouncementData(prev => ({ ...prev, textColor: e.target.value }))}
                        className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 text-xs font-mono"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>

                {/* Vista previa */}
                <div>
                  <label className="text-[9px] font-black uppercase text-neutral-400 mb-1.5 block">Vista previa</label>
                  <div 
                    className="py-2 px-4 rounded-lg text-center text-xs font-semibold overflow-hidden"
                    style={{ 
                      backgroundColor: announcementData.bgColor || '#d97706',
                      color: announcementData.textColor || '#ffffff'
                    }}
                  >
                    {announcementData.text || 'Tu mensaje aparecerá aquí...'}
                  </div>
                </div>

                {/* Botón guardar */}
                <button
                  onClick={handleSaveAnnouncement}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all"
                >
                  💾 Guardar Barra de Anuncios
                </button>
              </div>
            </div>

            {/* IMAGEN DEL HERO - AL INICIO */}
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-100">
              <label className="text-[10px] sm:text-xs font-black uppercase text-amber-700 mb-3 block flex items-center gap-2">
                🖼️ Imagen del Hero Principal
              </label>
              <p className="text-[10px] text-neutral-500 mb-4">Esta imagen se mostrará en la sección principal de la página de inicio. Se recomienda una imagen de alta calidad.</p>
              <input 
                type="file" 
                accept="image/*" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsUploadingHero(true);
                  try {
                    // Usar handleUpdateHero pasado desde App
                    const success = await handleUpdateHero(file);
                    if (success) {
                      // Leer archivo para preview local inmediato
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setHeroImagePreview(reader.result);
                      };
                      reader.readAsDataURL(file);
                      onNotify && onNotify('✅ Imagen del Hero actualizada');
                    } else {
                      onNotify && onNotify('❌ Error al subir imagen');
                    }
                  } catch (err) {
                    console.error('Error uploading hero image:', err);
                    onNotify && onNotify('❌ Error al subir imagen');
                  } finally {
                    setIsUploadingHero(false);
                  }
                }} 
                className="w-full text-sm mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-amber-600 file:text-white hover:file:bg-amber-700 file:cursor-pointer file:transition-colors" 
                disabled={isUploadingHero}
              />
              {isUploadingHero && (
                <div className="flex items-center gap-2 text-amber-600 text-xs font-bold mb-3">
                  <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                  Procesando imagen...
                </div>
              )}
              {(heroImagePreview || heroImage) && (
                <div className="mt-4 relative inline-block">
                  <img 
                    src={heroImagePreview || heroImage} 
                    alt="Hero Preview" 
                    className="w-48 sm:w-64 h-auto max-h-48 object-contain rounded-xl shadow-lg transition-all duration-500" 
                  />
                  <button 
                    type="button" 
                    onClick={async () => {
                      const defaultImg = 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=1000';
                      setHeroImagePreview(defaultImg);
                      setHeroImage(defaultImg);
                      if (usingFirestore) {
                        await setDoc(doc(db, 'configuracion', 'hero'), { imageUrl: defaultImg, updatedAt: new Date().toISOString() }, { merge: true });
                      } else {
                        localStorage.setItem('verzing_hero_image', defaultImg);
                      }
                      onNotify && onNotify('Imagen del Hero restaurada');
                    }} 
                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1.5 hover:bg-rose-600 transition-colors shadow-lg"
                    title="Restaurar imagen por defecto"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
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

const Navbar = ({ wishlistCount, onOpenAssistant, userRole, currentUser, onLogout, onOpenLogin, usingFirestore, activeTab, setActiveTab, onOpenCart, onOpenProfile, userProfile, hasAnnouncementBar }) => {
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
    // Hacer scroll al elemento específico o al top de la página
    setTimeout(() => {
      if (scrollId) {
        document.getElementById(scrollId)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <>
      {/* NAVBAR PRINCIPAL - GLASSMORPHISM */}
      <nav className={`fixed left-0 right-0 z-[100] transition-all duration-500 ${hasAnnouncementBar ? 'top-8' : 'top-0'} ${isScrolled ? 'bg-white/70 backdrop-blur-xl shadow-lg shadow-black/5' : 'bg-white'}`}>
        <div className="h-14 md:h-20 flex items-center justify-between px-3 sm:px-6 max-w-7xl mx-auto">
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
              onClick={() => navigateTo('sizes')}
              className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl transition-all ${activeTab === 'sizes' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'text-neutral-700 hover:text-amber-600'}`}
            >
              Guía de Tallas
            </button>
            {/* Mi Perfil - Solo para usuarios logueados */}
            {currentUser && (
              <button 
                onClick={onOpenProfile}
                className="text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-amber-600 flex items-center gap-2 text-neutral-700 relative"
              >
                <User size={14} /> Mi Perfil
                {userProfile?.hasCoupon && (
                  <span className="absolute -top-1 -right-3 bg-green-500 text-white text-[7px] rounded-full w-4 h-4 flex items-center justify-center font-black">%</span>
                )}
              </button>
            )}
          </div>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center space-x-4">
            <button onClick={onOpenCart} className="relative cursor-pointer p-2 hover:bg-neutral-100 rounded-full transition-colors">
              <ShoppingCart size={18} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[8px] rounded-full w-5 h-5 flex items-center justify-center font-black">{wishlistCount}</span>
              )}
            </button>

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
            <button onClick={onOpenCart} className="relative cursor-pointer p-2">
              <ShoppingCart size={18} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[7px] rounded-full w-4 h-4 flex items-center justify-center font-black">{wishlistCount}</span>
              )}
            </button>
            
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
              onClick={() => navigateTo('shop', 'catalog')}
              className={`w-full flex items-center justify-between p-5 rounded-2xl text-sm font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'shop' ? 'bg-black text-white' : 'bg-neutral-50 text-neutral-800 active:bg-neutral-100'}`}
            >
              Drops <TrendingUp size={18} />
            </button>

            <button 
              onClick={() => navigateTo('about')}
              className={`w-full flex items-center justify-between p-5 rounded-2xl text-sm font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'about' ? 'bg-amber-600 text-white' : 'bg-neutral-50 text-neutral-800 active:bg-neutral-100'}`}
            >
              Sobre Nosotros <User size={18} />
            </button>

            <button 
              onClick={() => navigateTo('sizes')}
              className={`w-full flex items-center justify-between p-5 rounded-2xl text-sm font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'sizes' ? 'bg-amber-600 text-white' : 'bg-neutral-50 text-neutral-800 active:bg-neutral-100'}`}
            >
              Guía de Tallas <Maximize2 size={18} />
            </button>

            {/* Mi Perfil - Solo para usuarios logueados */}
            {currentUser && (
              <button 
                onClick={() => { onOpenProfile(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-between p-5 rounded-2xl text-sm font-black uppercase tracking-[0.15em] transition-all bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 active:from-amber-100 active:to-amber-200"
              >
                <span className="flex items-center gap-2">
                  Mi Perfil 
                  {userProfile?.hasCoupon && (
                    <span className="bg-green-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black">15% OFF</span>
                  )}
                </span>
                <Gift size={18} />
              </button>
            )}
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
              onClick={() => navigateTo('shop', 'catalog')}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${activeTab === 'shop' ? 'text-amber-500' : 'text-white/70'}`}
            >
              <TrendingUp size={20} />
              <span className="text-[8px] font-black uppercase tracking-wider mt-1">Drops</span>
            </button>

            {/* Tallas */}
            <button 
              onClick={() => navigateTo('sizes')}
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
              onClick={() => navigateTo('about')}
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

// Skeleton de carga para el Hero
const HeroSkeleton = () => (
  <div className="animate-pulse">
    {/* Mobile skeleton */}
    <div className="md:hidden w-11/12 mx-auto bg-white p-2 rounded-2xl shadow-2xl">
      <div className="aspect-[4/5] bg-neutral-200 rounded-xl"></div>
    </div>
    {/* Desktop skeleton */}
    <div className="hidden md:block w-full bg-white p-2 rounded-[3rem] shadow-2xl">
      <div className="aspect-[4/5] bg-neutral-200 rounded-[2.5rem]"></div>
    </div>
  </div>
);

const Hero = ({ onOpenAssistant, cmsTextos, heroImage, isLoadingHero }) => {
  const textos = cmsTextos || DEFAULT_TEXTOS;
  const { dropText, titleMain, subtitle } = textos;
  
  // Si no hay imagen, no hay textos, o está cargando, mostrar skeleton
  const showSkeleton = isLoadingHero || !heroImage || !cmsTextos;
  
  // Skeleton completo para el Hero
  if (showSkeleton) {
    return (
      <section className="relative min-h-screen flex items-center pt-24 sm:pt-20 px-6 bg-[#FDFCFB] overflow-hidden">
        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center text-left">
          {/* Skeleton de textos */}
          <div className="animate-pulse z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-[1px] bg-neutral-300"></div>
              <div className="h-3 bg-neutral-200 rounded w-48"></div>
            </div>
            <div className="space-y-3 mb-6 sm:mb-10">
              <div className="h-10 sm:h-14 md:h-20 bg-neutral-200 rounded-lg w-full"></div>
              <div className="h-10 sm:h-14 md:h-20 bg-neutral-200 rounded-lg w-4/5"></div>
              <div className="h-10 sm:h-14 md:h-20 bg-neutral-200 rounded-lg w-3/5"></div>
            </div>
            <div className="h-4 bg-neutral-200 rounded w-full max-w-sm mb-2"></div>
            <div className="h-4 bg-neutral-200 rounded w-3/4 max-w-sm mb-6"></div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="h-12 sm:h-14 bg-neutral-200 rounded w-44"></div>
              <div className="h-12 sm:h-14 bg-neutral-200 rounded w-40"></div>
            </div>
            {/* Mobile image skeleton */}
            <div className="md:hidden mt-8 w-full flex justify-center">
              <div className="w-11/12 bg-white p-2 rounded-2xl shadow-2xl">
                <div className="aspect-[4/5] bg-neutral-200 rounded-xl"></div>
              </div>
            </div>
          </div>
          {/* Desktop image skeleton */}
          <div className="relative hidden md:flex items-center justify-center">
            <div className="w-full bg-white p-2 rounded-[3rem] shadow-2xl">
              <div className="aspect-[4/5] bg-neutral-200 rounded-[2.5rem]"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  return (
  <section className="relative min-h-screen flex items-center pt-24 sm:pt-20 px-6 bg-[#FDFCFB] overflow-hidden">
    <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center text-left">
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 z-10">
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
          <div className="w-11/12 bg-white p-2 rounded-2xl shadow-2xl animate-in fade-in duration-700">
            <img src={heroImage} alt="Verzing" className="w-full h-auto object-contain rounded-xl transition-all duration-700 ease-out" />
          </div>
        </div> 
      </div>
      <div className="relative hidden md:flex items-center justify-center">
        <div className="w-full relative bg-white p-2 rounded-[3rem] shadow-2xl animate-in fade-in duration-700">
          <img 
            src={heroImage} 
            alt="Verzing Sneakers Hero" 
            className="w-full h-auto object-contain rounded-[2.5rem] transition-all duration-700 ease-out"
          />
          <div className="absolute inset-2 bg-gradient-to-t from-black/10 to-transparent rounded-[2.5rem] pointer-events-none"></div>
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

// Skeleton de carga para productos del catálogo
const ProductSkeleton = () => (
  <div className="group animate-pulse">
    <div className="aspect-[4/5] bg-neutral-200 rounded-[2rem] sm:rounded-[2.5rem] mb-4"></div>
    <div className="flex justify-between items-start px-1">
      <div className="space-y-2 flex-1">
        <div className="h-4 sm:h-5 bg-neutral-200 rounded-lg w-3/4"></div>
        <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
      </div>
      <div className="h-4 sm:h-5 bg-neutral-200 rounded-lg w-20 ml-2"></div>
    </div>
  </div>
);

// Skeleton de carga para promociones
const PromoSkeleton = () => (
  <div className="animate-pulse bg-zinc-900 rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-4 border border-white/5">
    <div className="aspect-square rounded-xl sm:rounded-[2rem] bg-zinc-800 mb-4 sm:mb-6 relative overflow-hidden">
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-zinc-700 w-12 h-6 rounded-full"></div>
    </div>
    <div className="px-2 sm:px-4 pb-2 sm:pb-4 space-y-3">
      <div className="h-5 sm:h-6 bg-zinc-800 rounded-lg w-3/4"></div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="h-6 sm:h-8 bg-zinc-800 rounded-lg w-24"></div>
        <div className="h-4 bg-zinc-800 rounded w-16"></div>
      </div>
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/5 flex items-center justify-between">
        <div className="h-3 bg-zinc-800 rounded w-20"></div>
        <div className="flex gap-1 sm:gap-2">
          <div className="bg-zinc-800 w-8 h-6 rounded"></div>
          <div className="bg-zinc-800 w-8 h-6 rounded"></div>
          <div className="bg-zinc-800 w-8 h-6 rounded"></div>
          <div className="bg-zinc-800 w-8 h-6 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

const CatalogSection = ({ products, onProductClick, activeBrand, setActiveBrand, activeStyle, setActiveStyle, activeGender, setActiveGender, isLoading }) => {
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
          {isLoading ? (
            // Mostrar 6 skeletons mientras carga
            [...Array(6)].map((_, i) => <ProductSkeleton key={`skeleton-${i}`} />)
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((p) => (
              <div key={p.id} className="animate-in fade-in duration-500">
                <ProductCard product={p} onClick={onProductClick} />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 animate-in fade-in duration-300">
              <p className="text-neutral-400 font-bold text-sm">No hay productos con estos filtros</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const ProductModal = ({ product, onClose, addToCart, currentUser, onOpenLogin, userProfile, onUseCoupon, cart = [] }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showCouponToast, setShowCouponToast] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
    setAddedToCart(false);
    setShowCouponToast(false);
  }, [product]);

  if (!product) return null;

  // Verificar si ya hay un producto con cupón en el carrito
  const cartHasCouponItem = cart.some(item => item.hasCouponApplied);
  
  // Calcular precio con descuento si el usuario tiene cupón (NO aplica a productos en promoción)
  const isPromoProduct = product.isPromo && product.promoPrice;
  // El cupón está disponible si: tiene cupón, NO es promo, Y no hay otro item con cupón en el carrito
  const hasCoupon = userProfile?.hasCoupon === true && !isPromoProduct && !cartHasCouponItem;
  const originalPrice = isPromoProduct ? Number(product.promoPrice) : Number(product.price);
  const discountedPrice = hasCoupon ? Math.round(originalPrice * 0.85) : originalPrice;

  const handleGetStyleAdvice = async () => {
    setLoadingAI(true);
    const system = "Eres un estilista premium. Sugiere 3 outfits cortos (Casual, Urban, Sport) para estos sneakers en español. Sé conciso.";
    const prompt = `Outfits para: ${product.name} de estilo ${product.vibe}.`;
    const response = await callGemini(prompt, system);
    setAiAdvice(response);
    setLoadingAI(false);
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      alert('Por favor, selecciona una talla primero.');
      return;
    }

    // Nota: El cupón NO se gasta al agregar al carrito, solo se "reserva"
    // Solo se gasta cuando el usuario hace clic en WhatsApp desde el carrito

    const success = addToCart(product, selectedSize, hasCoupon); // Pasar si tiene cupón
    if (success) {
      setAddedToCart(true);
      if (hasCoupon) {
        setShowCouponToast(true);
        setTimeout(() => setShowCouponToast(false), 3000);
      }
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const handleWhatsAppChat = async () => {
    if (!selectedSize) { alert('Por favor, selecciona una talla primero.'); return; }
    if (isRedeeming) return; // Prevenir doble clic
    
    const phone = (WHATSAPP_NUMBER || '').toString().replace(/\D/g, '');
    if (!phone) { alert('Número de WhatsApp no configurado'); return; }
    
    // Calcular precio final para el mensaje
    const couponWasActive = hasCoupon; // Guardar estado antes de redimir
    const finalPrice = couponWasActive ? discountedPrice : originalPrice;
    const priceText = Number(finalPrice).toLocaleString('es-CO');
    
    // Si tiene cupón, redimirlo PRIMERO (antes de construir mensaje)
    if (couponWasActive && onUseCoupon) {
      setIsRedeeming(true);
      const redeemed = await onUseCoupon();
      setIsRedeeming(false);
      
      if (!redeemed) {
        alert('Tu cupón ya fue utilizado. Los precios han sido actualizados.');
        return; // No continuar si el cupón ya fue usado
      }
    }
    
    // Construir mensaje con información del cupón si aplica
    let message = `Hola Verzing! 👋\n\nEstoy interesado en el modelo *${product.name}*`;
    
    if (couponWasActive) {
      message += `\n\n🎟️ *CUPÓN DE BIENVENIDA APLICADO (15% OFF)*`;
      message += `\n💰 Precio original: $${Number(originalPrice).toLocaleString('es-CO')}`;
      message += `\n✨ *Precio con descuento: $${priceText}*`;
      message += `\n\n📝 Nota: Cupón de bienvenida aplicado`;
    } else if (product.isPromo) {
      message += ` que está en oferta a $${priceText}`;
    } else {
      message += `\n💰 Precio: $${priceText}`;
    }
    
    message += `\n*Talla:* ${selectedSize}\n\n¿Está disponible?`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    // Abrir WhatsApp solo una vez
    window.open(whatsappUrl, '_blank');
  };

  // Calcular nivel de hype dinámico basado en popularity o valor aleatorio
  const hypeLevel = product.popularity 
    ? Math.round(product.popularity.reduce((a, b) => a + b, 0) / product.popularity.length)
    : Math.floor(Math.random() * 25) + 75;

  const getHypeMessage = (level) => {
    if (level >= 90) return "¡Producto ultra solicitado! Se agota muy rápido.";
    if (level >= 75) return "Alta demanda. Disponibilidad limitada.";
    if (level >= 60) return "Producto popular entre coleccionistas.";
    return "Tendencia al alza. ¡Aprovecha ahora!";
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      
      {/* Toast de cupón aplicado */}
      {showCouponToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top duration-300">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Gift size={20} />
            </div>
            <div>
              <p className="font-black text-sm">¡Cupón reservado para este par!</p>
              <p className="text-xs text-white/80">Se aplicará al finalizar por WhatsApp</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="relative bg-white w-full max-w-5xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 sm:top-8 sm:right-8 z-10 p-2 bg-white/80 sm:bg-white/50 backdrop-blur rounded-full transition-colors">
          <X size={18} className="sm:hidden" />
          <X size={20} className="hidden sm:block" />
        </button>
        <div className="w-full md:w-1/2 bg-neutral-50 flex items-center justify-center p-4 sm:p-8 md:p-12">
          <div className="w-full max-w-md">
            <div className="aspect-square bg-white rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-inner relative overflow-hidden">
              <img src={(Array.isArray(product.image) ? product.image[activeImageIndex] : product.image)} className="w-full h-full object-cover" loading="lazy" />
              {/* Badge de cupón */}
              {hasCoupon && (
                <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                  <Gift size={12} /> 15% OFF
                </div>
              )}
            </div>
            {Array.isArray(product.image) && product.image.length > 1 && (
              <div className="mt-3 sm:mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {product.image.map((src, idx) => (
                  <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`flex-shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden border-2 ${activeImageIndex === idx ? 'border-amber-600' : 'border-transparent'}`}>
                    <img src={src} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="w-full md:w-1/2 p-5 sm:p-8 md:p-12 flex flex-col text-left">
          <span className="text-amber-600 font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-2 sm:mb-4">{product.vibe} Collection</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter mb-2 leading-none uppercase">{product.name}</h2>
          
          {/* Sección de precios con cupón */}
          <div className="mb-4 sm:mb-6">
            {hasCoupon ? (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-xl sm:text-2xl font-black text-green-600">$ {Number(discountedPrice).toLocaleString('es-CO')}</p>
                  <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-1 rounded-full uppercase">-15%</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 line-through">$ {Number(originalPrice).toLocaleString('es-CO')}</p>
                <p className="text-[10px] text-green-600 font-bold mt-1 flex items-center gap-1">
                  <Gift size={12} /> Tu cupón se aplicará a este par
                </p>
              </>
            ) : cartHasCouponItem && userProfile?.hasCoupon && !isPromoProduct ? (
              <>
                <p className="text-xl sm:text-2xl font-bold">$ {Number(originalPrice).toLocaleString('es-CO')}</p>
                <p className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1">
                  <Gift size={12} /> Tu cupón ya está reservado en otro producto del carrito
                </p>
              </>
            ) : product.isPromo && product.promoPrice ? (
              <>
                <p className="text-xl sm:text-2xl font-black mb-1 text-amber-600">$ {Number(product.promoPrice).toLocaleString('es-CO')}</p>
                <p className="text-xs sm:text-sm text-neutral-400 line-through">$ {Number(product.price).toLocaleString('es-CO')}</p>
              </>
            ) : (
              <p className="text-xl sm:text-2xl font-bold">$ {Number(product.price).toLocaleString('es-CO')}</p>
            )}
          </div>

          {/* Tallas - ahora debajo del precio */}
          <div className="mb-4 sm:mb-6">
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3 sm:mb-4">Tallas EU</p>
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {product.sizes.map(size => (
                <button key={size} onClick={() => setSelectedSize(size)} className={`py-2.5 sm:py-4 text-[10px] sm:text-xs font-bold rounded-xl sm:rounded-2xl border-2 transition-all ${selectedSize === size ? 'border-black bg-black text-white' : 'border-neutral-100 hover:border-black'}`}>{size}</button>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 mb-4 sm:mb-8">
            <button 
              onClick={handleAddToCart}
              disabled={!selectedSize}
              className={`flex-1 py-4 sm:py-5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                addedToCart
                ? 'bg-green-500 text-white'
                : selectedSize 
                  ? 'bg-black text-white hover:bg-amber-600 shadow-xl' 
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <ShoppingCart size={16} />
              {addedToCart ? '¡Añadido!' : (selectedSize ? 'Añadir al Carrito' : 'Selecciona talla')}
            </button>
            <button 
              onClick={handleWhatsAppChat}
              disabled={!selectedSize}
              className={`px-4 sm:px-6 py-4 sm:py-5 rounded-xl sm:rounded-2xl transition-all ${
                selectedSize 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              }`}
              title="Consultar por WhatsApp"
            >
              <MessageCircle size={18} />
            </button>
          </div>

          {/* Sección de Tendencia - Nivel de Hype */}
          <div className="mb-4 sm:mb-8 bg-orange-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-orange-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl sm:text-3xl animate-bounce">🔥</span>
              <div className="flex-1">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-orange-800">Nivel de Hype</p>
                <p className="text-[10px] sm:text-xs text-orange-600 font-medium mt-0.5">{getHypeMessage(hypeLevel)}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-orange-600">{hypeLevel}%</span>
              </div>
            </div>
            {/* Barra de progreso */}
            <div className="w-full bg-orange-200 rounded-full h-2.5 sm:h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 rounded-full transition-all duration-700"
                style={{ width: `${hypeLevel}%` }}
              />
            </div>
            <p className="text-[8px] sm:text-[9px] text-orange-700 font-bold uppercase tracking-wider mt-2 sm:mt-3 text-center">
              ⚠️ Este producto es muy solicitado — ¡No esperes más!
            </p>
          </div>

          {/* Conserje de Estilo AI - de último */}
          <div className="p-4 sm:p-6 bg-amber-50 rounded-2xl sm:rounded-3xl border border-amber-100">
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
        </div>
      </div>
    </div>
  );
};

// --- CART DRAWER ---
const CartDrawer = ({ isOpen, onClose, cart, removeFromCart, clearCart, currentUser, userProfile, onUseCoupon }) => {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  if (!isOpen) return null;

  // Calcular si hay un item con cupón
  const couponItem = cart.find(item => item.hasCouponApplied);
  const hasCouponInCart = !!couponItem;

  // Calcular total considerando el descuento del cupón
  const total = cart.reduce((sum, item) => {
    const basePrice = item.isPromo && item.promoPrice ? item.promoPrice : item.price;
    // Si este item tiene cupón, aplicar 15% de descuento
    const finalPrice = item.hasCouponApplied ? Math.round(Number(basePrice) * 0.85) : Number(basePrice);
    return sum + finalPrice;
  }, 0);

  // Total sin descuento (para mostrar el ahorro)
  const totalWithoutDiscount = cart.reduce((sum, item) => {
    const basePrice = item.isPromo && item.promoPrice ? item.promoPrice : item.price;
    return sum + Number(basePrice);
  }, 0);

  const savings = totalWithoutDiscount - total;

  const handleCheckoutWhatsApp = async () => {
    if (cart.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }

    if (isRedeeming || isProcessing) return; // Prevenir doble clic

    setIsProcessing(true); // Bloquear múltiples clics

    const phone = (WHATSAPP_NUMBER || '').toString().replace(/\D/g, '');
    if (!phone) {
      alert('Número de WhatsApp no configurado');
      setIsProcessing(false);
      return;
    }

    // Si hay un item con cupón, redimir el cupón ANTES de continuar
    if (hasCouponInCart && onUseCoupon) {
      setIsRedeeming(true);
      const redeemed = await onUseCoupon();
      setIsRedeeming(false);
      
      if (!redeemed) {
        alert('Tu cupón ya fue utilizado. Por favor, actualiza tu carrito.');
        setIsProcessing(false);
        return; // No continuar si el cupón ya fue usado
      }
    }

    // Construir mensaje detallado
    let message = `¡Hola Verzing! 👋\n\nQuiero finalizar mi compra:\n\n`;
    
    cart.forEach((item, index) => {
      const basePrice = item.isPromo && item.promoPrice ? item.promoPrice : item.price;
      const finalPrice = item.hasCouponApplied ? Math.round(Number(basePrice) * 0.85) : Number(basePrice);
      
      message += `${index + 1}. *${item.name}*\n`;
      message += `   Talla: ${item.selectedSize}\n`;
      
      if (item.hasCouponApplied) {
        message += `   🎟️ CUPÓN 15% OFF APLICADO\n`;
        message += `   Precio original: $${Number(basePrice).toLocaleString('es-CO')}\n`;
        message += `   *Precio con descuento: $${finalPrice.toLocaleString('es-CO')}*\n\n`;
      } else {
        message += `   Precio: $${finalPrice.toLocaleString('es-CO')}\n\n`;
      }
    });

    message += `-------------------\n`;
    if (hasCouponInCart) {
      message += `Subtotal: $${totalWithoutDiscount.toLocaleString('es-CO')}\n`;
      message += `Descuento cupón: -$${savings.toLocaleString('es-CO')}\n`;
    }
    message += `*TOTAL: $${total.toLocaleString('es-CO')}*\n\n`;
    message += `👤 Cliente: ${currentUser || 'No registrado'}\n`;
    message += `¿Está disponible mi pedido?`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    // Abrir WhatsApp solo una vez
    window.open(whatsappUrl, '_blank');
    
    // Limpiar carrito después de enviar a WhatsApp
    if (clearCart) clearCart();
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter">Tu Carrito</h2>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{cart.length} {cart.length === 1 ? 'producto' : 'productos'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingCart size={48} className="text-neutral-200 mb-4" />
              <p className="text-neutral-400 font-bold uppercase text-xs tracking-widest">Tu carrito está vacío</p>
              <p className="text-neutral-300 text-[10px] mt-2">Explora nuestro catálogo y añade productos</p>
            </div>
          ) : (
            cart.map((item, index) => {
              const basePrice = item.isPromo && item.promoPrice ? item.promoPrice : item.price;
              const finalPrice = item.hasCouponApplied ? Math.round(Number(basePrice) * 0.85) : Number(basePrice);
              
              return (
                <div key={`${item.id}-${item.selectedSize}-${index}`} className={`flex gap-4 p-4 rounded-2xl group transition-colors relative ${item.hasCouponApplied ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200' : 'bg-neutral-50 hover:bg-neutral-100'}`}>
                  {/* Badge de cupón */}
                  {item.hasCouponApplied && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <Gift size={10} />
                      15% OFF
                    </div>
                  )}
                  
                  <div className="w-20 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0">
                    <img src={Array.isArray(item.image) ? item.image[0] : item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate uppercase">{item.name}</h4>
                    <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">{item.brand} • Talla {item.selectedSize}</p>
                    
                    {item.hasCouponApplied ? (
                      <div className="mt-1">
                        <p className="text-[10px] text-neutral-400 line-through">${Number(basePrice).toLocaleString('es-CO')}</p>
                        <p className="font-black text-amber-600">${finalPrice.toLocaleString('es-CO')}</p>
                      </div>
                    ) : (
                      <p className="font-black text-amber-600 mt-1">${finalPrice.toLocaleString('es-CO')}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => removeFromCart(index)}
                    className="p-2 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all self-start"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer con Total y Botón */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-neutral-100 space-y-4 bg-white">
            {/* Mostrar ahorro si hay cupón */}
            {hasCouponInCart && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                <Gift size={16} className="text-amber-600" />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-amber-700 uppercase">Cupón aplicado</p>
                  <p className="text-[9px] text-amber-600">Ahorras ${savings.toLocaleString('es-CO')} en este pedido</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold uppercase text-neutral-400">Total</span>
              <div className="text-right">
                {hasCouponInCart && (
                  <span className="text-sm text-neutral-400 line-through mr-2">${totalWithoutDiscount.toLocaleString('es-CO')}</span>
                )}
                <span className="text-2xl font-black text-amber-600">${total.toLocaleString('es-CO')}</span>
              </div>
            </div>
            <button 
              onClick={handleCheckoutWhatsApp}
              disabled={isRedeeming}
              className={`w-full bg-black text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-xl ${isRedeeming ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isRedeeming ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <MessageCircle size={16} />
                  Finalizar por WhatsApp
                </>
              )}
            </button>
            <p className="text-[9px] text-neutral-400 text-center">Te responderemos en minutos para confirmar disponibilidad</p>
          </div>
        )}
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

const PromoSection = ({ products, onProductClick, isLoading }) => {
  const promoProducts = products.filter(p => p.isPromo && p.promoUntil && new Date(p.promoUntil) > new Date());
  
  // Si está cargando, mostrar skeletons. Si no hay promos después de cargar, no mostrar nada.
  if (!isLoading && promoProducts.length === 0) return null;

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
          {isLoading ? (
            // Mostrar 3 skeletons mientras carga
            [...Array(3)].map((_, i) => <PromoSkeleton key={`promo-skeleton-${i}`} />)
          ) : (
            promoProducts.map(p => (
              <div key={p.id} className="animate-in fade-in duration-500">
                <PromoCard p={p} />
              </div>
            ))
          )}
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('verzing_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [activeTab, setActiveTab] = useState('shop');
  const [isLoading, setIsLoading] = useState(true); // Estado de carga para productos
  const [isLoadingHero, setIsLoadingHero] = useState(true); // Estado de carga para Hero (imagen + textos)

  // --- PERFIL DE USUARIO Y CUPONES ---
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [userUid, setUserUid] = useState(() => {
    const s = localStorage.getItem('verzing_session');
    return s ? JSON.parse(s).username : null;
  });

  // CMS texts loaded from Firestore (or defaults) - Inicializado como null hasta verificar storage
  const [cmsTextos, setCmsTextos] = useState(null);
  
  // Hero image URL (editable desde AdminPanel) - Inicializado como null hasta verificar storage
  const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=1000';
  const [heroImage, setHeroImage] = useState(null);

  // --- BARRA DE ANUNCIOS CONFIGURABLE ---
  const DEFAULT_ANNOUNCEMENT = {
    text: '🎁 15% OFF en tu primera compra • Regístrate y completa la encuesta en "Mi Perfil" • El cupón se aplica al contactar por WhatsApp',
    bgColor: '#d97706', // amber-600
    textColor: '#ffffff',
    enabled: true
  };
  const [announcementConfig, setAnnouncementConfig] = useState(DEFAULT_ANNOUNCEMENT);

  // Cargar heroImage y cmsTextos desde localStorage o Firestore al montar
  useEffect(() => {
    const loadHeroData = async () => {
      setIsLoadingHero(true);
      
      // Delay mínimo para que el skeleton sea visible (mejor UX)
      const minDelay = new Promise(resolve => setTimeout(resolve, 600));
      
      let loadedTextos = DEFAULT_TEXTOS;
      let loadedImage = DEFAULT_HERO_IMAGE;
      
      try {
        // Cargar textos desde localStorage primero
        const savedTextos = localStorage.getItem('verzing_textos');
        if (savedTextos) {
          loadedTextos = { ...DEFAULT_TEXTOS, ...JSON.parse(savedTextos) };
        }
        
        // Cargar imagen desde localStorage primero
        const savedImage = localStorage.getItem('verzing_hero_image');
        if (savedImage) {
          loadedImage = savedImage;
        }
        
        // Si usa Firestore, verificar si hay datos más recientes
        if (usingFirestore) {
          // Cargar textos desde Firestore
          const cfgRef = doc(db, 'configuracion', 'textos_web');
          const snap = await getDoc(cfgRef);
          if (snap && snap.exists()) {
            loadedTextos = { ...DEFAULT_TEXTOS, ...snap.data() };
          }
          
          // Cargar imagen desde Firestore
          const heroRef = doc(db, 'configuracion', 'hero');
          const heroSnap = await getDoc(heroRef);
          if (heroSnap && heroSnap.exists() && heroSnap.data().imageUrl) {
            loadedImage = heroSnap.data().imageUrl;
            // Guardar en localStorage para próximas cargas
            localStorage.setItem('verzing_hero_image', loadedImage);
          }
          
          // Cargar configuración de barra de anuncios desde Firestore
          const announcementRef = doc(db, 'configuracion', 'announcement_bar');
          const announcementSnap = await getDoc(announcementRef);
          if (announcementSnap && announcementSnap.exists()) {
            setAnnouncementConfig({ ...DEFAULT_ANNOUNCEMENT, ...announcementSnap.data() });
          }
        }
        
        // Esperar el delay mínimo antes de mostrar
        await minDelay;
        
        setCmsTextos(loadedTextos);
        setHeroImage(loadedImage);
      } catch (err) {
        console.error('Error loading hero data:', err);
        await minDelay;
        setCmsTextos(DEFAULT_TEXTOS);
        setHeroImage(DEFAULT_HERO_IMAGE);
      } finally {
        setIsLoadingHero(false);
      }
    };
    loadHeroData();
  }, [usingFirestore]);

  // Función para actualizar heroImage desde AdminPanel usando FileReader
  const handleUpdateHero = async (file) => {
    if (!file) return;
    setIsLoadingHero(true); // Activar estado de carga
    try {
      // Comprimir imagen antes de guardar
      const dataUrl = await compressImageFile(file, 1.5);
      setHeroImage(dataUrl);
      localStorage.setItem('verzing_hero_image', dataUrl);
      
      // Si usa Firestore, también guardar allá
      if (usingFirestore) {
        await setDoc(doc(db, 'configuracion', 'hero'), { 
          imageUrl: dataUrl, 
          updatedAt: new Date().toISOString() 
        }, { merge: true });
      }
      setIsLoadingHero(false); // Desactivar estado de carga
      return true;
    } catch (err) {
      console.error('Error updating hero image:', err);
      setIsLoadingHero(false); // Desactivar en caso de error
      return false;
    }
  };

  // Seed admin user on first run
  useEffect(() => { seedAdmin(); }, []);

  // --- SUSCRIPCIÓN EN TIEMPO REAL AL PERFIL DEL USUARIO (Firestore) ---
  useEffect(() => {
    if (!usingFirestore || !userUid) {
      setUserProfile(null);
      return;
    }

    const userDocRef = doc(db, 'users', userUid);
    const unsub = onSnapshot(userDocRef, async (snap) => {
      if (snap.exists()) {
        setUserProfile({ id: snap.id, ...snap.data() });
      } else {
        // Crear documento de usuario si no existe
        const newProfile = {
          displayName: currentUser || '',
          instagram: '',
          hasCoupon: false,
          couponUsedAt: null,
          surveyAnswers: null,
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile({ id: userUid, ...newProfile });
      }
    }, (err) => {
      console.error('Error subscribing to user profile:', err);
    });

    return () => unsub();
  }, [usingFirestore, userUid, currentUser]);

  // --- FUNCIONES DE PERFIL Y CUPÓN ---
  const updateUserProfile = async (updates) => {
    if (!usingFirestore || !userUid) return;
    try {
      const userDocRef = doc(db, 'users', userUid);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error updating user profile:', err);
    }
  };

  const completeSurvey = async (answers) => {
    if (!usingFirestore || !userUid) return;
    try {
      const userDocRef = doc(db, 'users', userUid);
      await updateDoc(userDocRef, {
        surveyAnswers: answers,
        hasCoupon: true,
        surveyCompletedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error completing survey:', err);
    }
  };

  // Ref para prevenir múltiples llamadas simultáneas (ej: dos pestañas)
  const couponRedemptionInProgress = useRef(false);

  // Función robusta para redimir cupón (protección contra doble uso)
  const redeemCoupon = async () => {
    // Verificaciones de seguridad
    if (!usingFirestore || !userUid) {
      console.warn('redeemCoupon: Firestore no disponible o usuario no logueado');
      return false;
    }
    
    // Prevenir ejecución simultánea en la misma pestaña
    if (couponRedemptionInProgress.current) {
      console.warn('redeemCoupon: Redención ya en progreso');
      return false;
    }
    
    // Verificar estado local antes de intentar actualizar
    if (!userProfile?.hasCoupon) {
      console.warn('redeemCoupon: Usuario no tiene cupón activo');
      return false;
    }
    
    couponRedemptionInProgress.current = true;
    
    try {
      const userDocRef = doc(db, 'users', userUid);
      
      // Verificar estado en Firestore antes de actualizar (protección contra dos pestañas)
      const currentDoc = await getDoc(userDocRef);
      if (!currentDoc.exists() || currentDoc.data().hasCoupon !== true) {
        console.warn('redeemCoupon: Cupón ya fue usado (verificación en Firestore)');
        couponRedemptionInProgress.current = false;
        return false;
      }
      
      // Actualizar Firestore: invalidar cupón
      await updateDoc(userDocRef, {
        hasCoupon: false,
        couponUsedAt: serverTimestamp(),
        couponUsedProduct: selectedProduct?.name || 'Producto no especificado'
      });
      
      console.log('✅ Cupón redimido exitosamente');
      couponRedemptionInProgress.current = false;
      return true;
    } catch (err) {
      console.error('Error redeeming coupon:', err);
      couponRedemptionInProgress.current = false;
      return false;
    }
  };

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
    if (!usingFirestore) {
      // Si no usa Firestore, los productos ya están cargados desde localStorage
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
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
      setIsLoading(false); // Datos listos, ocultar skeletons
    }, (err) => {
      // eslint-disable-next-line no-console
      console.error('Firestore onSnapshot error', err);
      setIsLoading(false); // Incluso en error, ocultar loading
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
    const displayName = (user.firstName || user.lastName) ? `${(user.firstName || '').trim()} ${(user.lastName || '').trim()}`.trim() : (user.email || user.username);
    const uid = user.uid || user.username;
    setCurrentUser(displayName);
    setUserRole(user.role || 'user');
    setUserUid(uid); // Usar uid de Firebase para el perfil en Firestore
    localStorage.setItem('verzing_session', JSON.stringify({ 
      username: uid, 
      uid: uid,
      role: user.role || 'user', 
      displayName,
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      isGoogleUser: user.isGoogleUser || false
    }));
  };

  const handleLogout = async () => {
    try {
      await logout(); // Firebase signOut
    } catch (err) {
      console.error('Logout error:', err);
    }
    setCurrentUser(null);
    setUserRole(null);
    setUserUid(null);
    setUserProfile(null);
    localStorage.removeItem('verzing_session');
  };

  // --- FUNCIONES DEL CARRITO ---
  const addToCart = (product, selectedSize, applyCoupon = false) => {
    if (!selectedSize) {
      alert('Por favor, selecciona una talla');
      return false;
    }

    // Permitir 1 producto sin registro, pero para más de 1 requiere login
    if (!currentUser && cart.length >= 1) {
      alert('🔐 Para añadir más productos necesitas registrarte.\n\nCrea una cuenta gratis y disfruta de todos los beneficios.');
      setIsLoginOpen(true);
      return false;
    }

    // Verificar si ya hay un producto con cupón en el carrito
    const cartHasCouponItem = cart.some(item => item.hasCouponApplied);
    
    // Solo aplicar cupón si: tiene cupón, no es promo, no hay otro item con cupón, y se pidió aplicar
    const isPromoProduct = product.isPromo && product.promoPrice;
    const shouldApplyCoupon = applyCoupon && userProfile?.hasCoupon && !isPromoProduct && !cartHasCouponItem;

    const cartItem = {
      ...product,
      selectedSize,
      addedAt: Date.now(),
      hasCouponApplied: shouldApplyCoupon
    };

    setCart(prev => {
      const updated = [...prev, cartItem];
      localStorage.setItem('verzing_cart', JSON.stringify(updated));
      return updated;
    });

    return true;
  };

  const removeFromCart = (index) => {
    setCart(prev => {
      const updated = prev.filter((_, i) => i !== index);
      localStorage.setItem('verzing_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('verzing_cart');
  }; 

  // Catalog filtering is handled inside the new <CatalogSection /> component.

  // Estado para la barra de anuncios (se oculta al hacer scroll)
  const [showAnnouncementBar, setShowAnnouncementBar] = useState(true);
  const [hideAnnouncementOnScroll, setHideAnnouncementOnScroll] = useState(false);

  // Ocultar barra de anuncios al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setHideAnnouncementOnScroll(true);
      } else {
        setHideAnnouncementOnScroll(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        
        /* Animación marquee para la barra de anuncios */
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Barra de Anuncios Superior - Configurable por Admin */}
      {showAnnouncementBar && announcementConfig?.enabled !== false && !hideAnnouncementOnScroll && (
        <div 
          className="fixed top-0 left-0 right-0 z-[110] overflow-hidden transition-transform duration-300"
          style={{ backgroundColor: announcementConfig?.bgColor || '#d97706' }}
        >
          <div className="flex items-center justify-center px-4 py-1.5">
            {/* Texto del anuncio */}
            <div className="flex-1 overflow-hidden">
              <div className="flex animate-marquee whitespace-nowrap">
                <span 
                  className="mx-8 text-[10px] sm:text-xs font-semibold"
                  style={{ color: announcementConfig?.textColor || '#ffffff' }}
                >
                  {announcementConfig?.text || '🎁 15% OFF en tu primera compra'}
                </span>
                {/* Repetir para loop continuo */}
                <span 
                  className="mx-8 text-[10px] sm:text-xs font-semibold"
                  style={{ color: announcementConfig?.textColor || '#ffffff' }}
                >
                  {announcementConfig?.text || '🎁 15% OFF en tu primera compra'}
                </span>
              </div>
            </div>
            {/* Botón cerrar */}
            <button 
              onClick={() => setShowAnnouncementBar(false)}
              className="ml-2 p-0.5 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
              style={{ color: announcementConfig?.textColor || '#ffffff' }}
              aria-label="Cerrar anuncio"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Spacer para compensar la barra fija */}
      {showAnnouncementBar && announcementConfig?.enabled !== false && !hideAnnouncementOnScroll && (
        <div className="h-8"></div>
      )}

      <Navbar 
        wishlistCount={cart.length} 
        onOpenAssistant={() => setIsAssistantOpen(true)} 
        userRole={userRole} 
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginOpen(true)}
        usingFirestore={usingFirestore}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        userProfile={userProfile}
        hasAnnouncementBar={showAnnouncementBar && announcementConfig?.enabled !== false && !hideAnnouncementOnScroll}
      />

      {activeTab === 'shop' && (
        <>
          <Hero onOpenAssistant={() => setIsAssistantOpen(true)} userRole={userRole} cmsTextos={cmsTextos} heroImage={heroImage} isLoadingHero={isLoadingHero} />

          {/* Sección de Promociones */}
          <PromoSection products={products} onProductClick={setSelectedProduct} isLoading={isLoading} />

          {userRole === 'admin' && (
            <AdminPanel products={products} setProducts={setProducts} onNotify={(msg) => handleNotify(msg)} createProduct={createProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} usingFirestore={usingFirestore} migrateProductsToFirestore={migrateProductsToFirestore} cmsTextos={cmsTextos} setCmsTextos={setCmsTextos} heroImage={heroImage} setHeroImage={setHeroImage} handleUpdateHero={handleUpdateHero} announcementConfig={announcementConfig} setAnnouncementConfig={setAnnouncementConfig} />
          )}

          <CatalogSection 
            products={products} 
            onProductClick={setSelectedProduct} 
            activeBrand={activeBrand} setActiveBrand={setActiveBrand}
            activeStyle={activeStyle} setActiveStyle={setActiveStyle}
            activeGender={activeGender} setActiveGender={setActiveGender}
            isLoading={isLoading}
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

      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          addToCart={addToCart}
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginOpen(true)}
          userProfile={userProfile}
          onUseCoupon={redeemCoupon}
          cart={cart}
        />
      )}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart} 
        removeFromCart={removeFromCart}
        clearCart={clearCart}
        currentUser={currentUser}
        userProfile={userProfile}
        onUseCoupon={redeemCoupon}
      />
      <AIAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} products={products} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLogin={(user) => { handleLogin(user); setIsLoginOpen(false); }} />
      
      {/* Modales de Perfil y Encuesta */}
      <UserProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        userProfile={userProfile}
        onUpdateProfile={updateUserProfile}
        onOpenSurvey={() => { setIsProfileOpen(false); setIsSurveyOpen(true); }}
      />
      <SurveyModal 
        isOpen={isSurveyOpen} 
        onClose={() => setIsSurveyOpen(false)} 
        onComplete={completeSurvey}
        userProfile={userProfile}
      />
    </div>
  );
}