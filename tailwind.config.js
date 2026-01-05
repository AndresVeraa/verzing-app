/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.css",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        verzing: {
          bg: '#FDFCFB',    // Neutro cálido
          dark: '#1A1A1A',  // Negro profundo
          accent: '#D97706' // Ámbar Verzing
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}