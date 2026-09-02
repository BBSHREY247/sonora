/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sonora: {
          base: '#0B0D11',       // Deepest abyss background
          surface: '#12161F',    // Elevated cards / sidebar
          elevated: '#1A202C',   // Hover cards / menus
          card: '#161B26',       // Standard card surface
          border: '#232B3B',     // Subtle border
          accent: '#00E599',     // Sonora signature vibrant emerald / cyan glow
          accentHover: '#00FFAB',
          accentDim: 'rgba(0, 229, 153, 0.15)',
          muted: '#8E9AA8',      // Secondary text
          light: '#F1F5F9',      // Primary text
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'soundwave': 'soundwave 1.2s ease-in-out infinite alternate',
      },
      keyframes: {
        soundwave: {
          '0%': { height: '20%' },
          '100%': { height: '100%' },
        }
      }
    },
  },
  plugins: [],
}
