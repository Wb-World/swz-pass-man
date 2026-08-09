/** @type {import('tailwindcss').Config} */

function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variableName}) / ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  withOpacity('--color-brand-400'),
          100: withOpacity('--color-brand-400'),
          200: withOpacity('--color-brand-400'),
          300: withOpacity('--color-brand-400'),
          400: withOpacity('--color-brand-400'),
          500: withOpacity('--color-brand-500'),
          600: withOpacity('--color-brand-600'),
          700: withOpacity('--color-brand-600'),
          800: withOpacity('--color-brand-600'),
          900: withOpacity('--color-brand-600'),
          950: withOpacity('--color-brand-600'),
        },
        dark: {
          50:  '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e3',
          300: '#b2bace',
          400: '#8997b3',
          500: '#6a7a9a',
          600: '#556180',
          700: '#454f68',
          800: withOpacity('--bg-dark-800'),
          900: withOpacity('--bg-dark-900'),
          950: withOpacity('--bg-dark-950'),
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.05)',
          border: 'rgba(255,255,255,0.08)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 8s ease infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundSize: {
        '300%': '300%',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.4)',
        'glow': '0 0 20px rgb(var(--color-brand-500) / 0.4)',
        'glow-sm': '0 0 10px rgb(var(--color-brand-500) / 0.3)',
      },
    },
  },
  plugins: [],
}
