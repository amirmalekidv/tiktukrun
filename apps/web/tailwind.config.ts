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
          dark: '#05070a',
          darker: '#000000',
          card: '#0e121a',
        },
        red: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#00f5ff',
          500: '#00d9ff',
          600: '#00b3ff',
          700: '#b026ff',
          800: '#6d1ad6',
          900: '#30104f',
          950: '#13091f',
        },
        blood: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#00f5ff',
          500: '#00d9ff',
          600: '#00b3ff',
          700: '#b026ff',
          800: '#6d1ad6',
          900: '#30104f',
          950: '#13091f',
        },
        accent: {
          amber: '#fbbf24',
          gold: '#f59e0b',
        },
        dark: {
          card: '#0e121a',
          border: 'rgba(255,255,255,0.08)',
        },
      },
      fontFamily: {
        fa: ['Vazirmatn', 'Tahoma', 'Segoe UI', 'system-ui', 'sans-serif'],
        cinzel: ['Orbitron', 'Vazirmatn', 'Tahoma', 'Segoe UI', 'system-ui', 'sans-serif'],
        creepster: ['Orbitron', 'Vazirmatn', 'Tahoma', 'Segoe UI', 'system-ui', 'sans-serif'],
        horror: ['Orbitron', 'Vazirmatn', 'Tahoma', 'Segoe UI', 'system-ui', 'sans-serif'],
        vazir: ['Vazirmatn', 'Tahoma', 'Segoe UI', 'system-ui', 'sans-serif'],
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
            filter: 'drop-shadow(0 0 12px #00f5ff)',
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
          '0%, 100%': { filter: 'drop-shadow(0 0 8px #00f5ff)' },
          '50%': { filter: 'drop-shadow(0 0 20px #00f5ff) drop-shadow(0 0 40px #b026ff)' },
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
          '0%, 100%': { boxShadow: '0 0 8px #00f5ff' },
          '50%': { boxShadow: '0 0 20px #00f5ff, 0 0 40px #b026ff' },
        },
      },
      backgroundImage: {
        'gradient-blood': 'linear-gradient(135deg, #05070a 0%, #0a0d16 50%, #05070a 100%)',
        'gradient-card': 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        blood: '0 0 20px rgba(0, 245, 255, 0.3)',
        'blood-lg': '0 0 40px rgba(176, 38, 255, 0.5)',
        gothic: '0 4px 30px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(0, 245, 255, 0.18)',
      },
    },
  },
  plugins: [
    require('tailwindcss-rtl'),
  ],
}

export default config
