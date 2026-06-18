import type { Config } from 'tailwindcss';

/**
 * TIK TAK RUN — Shadow Realm Gothic Theme
 * رنگ‌ها و فونت‌های مشترک برای همه اپلیکیشن‌ها
 */
export const shadowRealmTheme: NonNullable<Config['theme']> = {
  extend: {
    colors: {
      background: '#0a0000',
      'background-secondary': '#1a0a0a',
      primary: '#dc2626',
      'primary-dark': '#7f1d1d',
      'primary-light': '#ef4444',
      accent: '#fbbf24',
      'accent-dark': '#d97706',
      'text-primary': '#d4d4d4',
      'text-secondary': '#a3a3a3',
      'text-muted': '#737373',
      card: 'rgba(20,5,5,0.9)',
      'card-border': 'rgba(127,29,29,0.4)',
      glass: 'rgba(10,0,0,0.95)',
      success: '#16a34a',
      warning: '#d97706',
      danger: '#dc2626',
      info: '#2563eb',
      'admin-bg': '#0f172a',
      'admin-sidebar': '#1e293b',
      'admin-card': '#1e293b',
    },
    fontFamily: {
      sans: ['Vazirmatn', 'Tahoma', 'Arial', 'sans-serif'],
      display: ['Estedad', 'Vazirmatn', 'sans-serif'],
      number: ['VazirFD', 'Vazirmatn', 'sans-serif'],
      cinzel: ['Cinzel', 'serif'],
      creepster: ['Creepster', 'cursive'],
    },
    backgroundImage: {
      'shadow-realm': 'radial-gradient(ellipse at center, #1a0a0a 0%, #0a0000 70%)',
      'card-gradient': 'linear-gradient(145deg, rgba(20,5,5,0.9), rgba(10,0,0,0.95))',
      'blood-gradient': 'linear-gradient(135deg, #7f1d1d, #dc2626)',
    },
    boxShadow: {
      blood: '0 0 20px rgba(220, 38, 38, 0.4)',
      'blood-lg': '0 0 40px rgba(220, 38, 38, 0.6)',
      gold: '0 0 20px rgba(251, 191, 36, 0.4)',
      dark: '0 4px 20px rgba(0, 0, 0, 0.8)',
    },
    borderColor: {
      blood: 'rgba(127, 29, 29, 0.4)',
      'blood-active': 'rgba(220, 38, 38, 0.7)',
    },
    animation: {
      flicker: 'flicker 3s infinite',
      heartbeat: 'heartbeat 1.5s ease-in-out infinite',
      drip: 'drip 3s ease-in-out infinite',
      fog: 'fog 8s ease-in-out infinite',
      'skull-glow': 'skullGlow 2s ease-in-out infinite',
      float: 'float 3s ease-in-out infinite',
    },
    keyframes: {
      flicker: {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.85' },
        '75%': { opacity: '0.95' },
      },
      heartbeat: {
        '0%, 100%': { transform: 'scale(1)' },
        '14%': { transform: 'scale(1.05)' },
        '28%': { transform: 'scale(1)' },
        '42%': { transform: 'scale(1.03)' },
        '70%': { transform: 'scale(1)' },
      },
      drip: {
        '0%': { backgroundPosition: '0% 0%' },
        '50%': { backgroundPosition: '0% 10%' },
        '100%': { backgroundPosition: '0% 0%' },
      },
      fog: {
        '0%, 100%': { opacity: '0.3', transform: 'translateX(0)' },
        '50%': { opacity: '0.6', transform: 'translateX(10px)' },
      },
      skullGlow: {
        '0%, 100%': { filter: 'drop-shadow(0 0 5px rgba(220,38,38,0.5))' },
        '50%': { filter: 'drop-shadow(0 0 20px rgba(220,38,38,0.9))' },
      },
      float: {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-10px)' },
      },
    },
  },
};

export default {
  darkMode: 'class' as const,
  theme: shadowRealmTheme,
  plugins: [],
} satisfies Partial<Config>;
