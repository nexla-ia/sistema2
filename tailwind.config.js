/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta baseada na fachada do Centro Terapêutico Bem-Estar
        clinic: {
          50: '#f0f9ff',   // Azul muito claro
          100: '#e0f2fe',  // Azul claro
          200: '#bae6fd',  // Azul suave
          300: '#7dd3fc',  // Azul médio claro
          400: '#38bdf8',  // Azul médio
          500: '#0ea5e9',  // Azul principal (similar à fachada)
          600: '#0284c7',  // Azul forte
          700: '#0369a1',  // Azul escuro
          800: '#075985',  // Azul muito escuro
          900: '#0c4a6e',  // Azul profundo
        },
        therapeutic: {
          50: '#f8fafc',   // Branco azulado
          100: '#f1f5f9',  // Cinza muito claro
          200: '#e2e8f0',  // Cinza claro
          300: '#cbd5e1',  // Cinza médio
          400: '#94a3b8',  // Cinza
          500: '#64748b',  // Cinza escuro
          600: '#475569',  // Cinza muito escuro
          700: '#334155',  // Quase preto azulado
          800: '#1e293b',  // Preto azulado
          900: '#0f172a',  // Preto
        }
      }
    },
  },
  plugins: [],
};
