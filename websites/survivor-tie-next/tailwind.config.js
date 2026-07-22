/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#090d16',
          surface: '#111726',
          card: '#182032',
          border: 'rgba(255, 255, 255, 0.08)',
          hover: '#1e293d',
        },
        brand: {
          primary: '#3b82f6',
          accent: '#10b981',
          gold: '#fbbf24',
          danger: '#ef4444',
          neon: '#06b6d4',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass-glow': '0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 0 20px 0 rgba(59, 130, 246, 0.15)',
        'card-glow': '0 0 15px rgba(59, 130, 246, 0.1)',
      },
    },
  },
  plugins: [],
};
