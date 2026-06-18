import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          dark: '#0a0000',
          darker: '#000000',
          card: '#1a0a0a',
        },
        blood: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        accent: {
          amber: '#fbbf24',
          gold: '#f59e0b',
        },
        dark: {
          card: '#1a0a0a',
          border: '#3d0a0a',
        },
      },
      fontFamily: {
        fa: ['Vazirmatn', 'Tahoma', 'sans-serif'],
        cinzel: ['Cinzel', 'serif'],
        creepster: ['Creepster', 'cursive'],
        horror: ['Creepster', 'cursive'],
        vazir: ['Vazirmatn', 'sans-serif'],
      },
      animation: {
        flicker: 'flicker 4s ease-in-out infinite',
        heartbeat: 'heartbeat 1.5s ease-in-out infinite',
        drip: 'drip 4s ease-in infinite',
        fog: 'fog 10s ease-in-out infinite',
        'skull-glow': 'skullGlow 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-blood': 'pulseBlood 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        flicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': {
            opacity: '1',
            filter: 'drop-shadow(0 0 12px #dc2626)',
          },
          '20%, 24%, 55%': {
            opacity: '0.4',
            filter: 'none',
          },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.15)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.10)' },
          '70%': { transform: 'scale(1)' },
        },
        drip: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(100vh)', opacity: '0' },
        },
        fog: {
          '0%, 100%': { transform: 'translateX(0) translateY(0)', opacity: '0.6' },
          '33%': { transform: 'translateX(2%) translateY(-1%)', opacity: '0.8' },
          '66%': { transform: 'translateX(-2%) translateY(1%)', opacity: '0.5' },
        },
        skullGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px #dc2626)' },
          '50%': { filter: 'drop-shadow(0 0 20px #dc2626) drop-shadow(0 0 40px #7f1d1d)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseBlood: {
          '0%, 100%': { boxShadow: '0 0 8px #dc2626' },
          '50%': { boxShadow: '0 0 20px #dc2626, 0 0 40px #7f1d1d' },
        },
      },
      backgroundImage: {
        'gradient-blood': 'linear-gradient(135deg, #0a0000 0%, #1a0505 50%, #0a0000 100%)',
        'gradient-card': 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        blood: '0 0 20px rgba(220, 38, 38, 0.3)',
        'blood-lg': '0 0 40px rgba(220, 38, 38, 0.5)',
        gothic: '0 4px 30px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(220, 38, 38, 0.2)',
      },
    },
  },
  plugins: [
    require('tailwindcss-rtl'),
  ],
}

export default config
