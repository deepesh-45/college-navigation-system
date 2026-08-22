/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1d4ed8',     // Royal Blue (Namaskaram start)
          indigo: '#4338ca',   // Electric Indigo (Hello accent)
          purple: '#6d28d9',   // Deep Purple (Namaskaram middle)
          rose: '#be185d',     // Rose Pink (Namaskaram end)
          cyan: '#0284c7',     // Sky Cyan (Hello start)
          emerald: '#059669',  // Navigation Active Green
          slateBg: '#f8fafc',  // Solid Warm Canvas Background
        }
      },
      fontFamily: {
        patua: ['"Patua One"', 'serif'],
        alkatra: ['"Alkatra"', 'system-ui', 'sans-serif'],
        level1: ['Space Grotesk', 'sans-serif'],
        level2: ['Outfit', 'sans-serif'],
        level3: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-brand': 'glowBrand 2.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glowBrand: {
          '0%': { boxShadow: '0 0 20px rgba(29, 78, 216, 0.25), 0 0 40px rgba(109, 40, 217, 0.15)' },
          '100%': { boxShadow: '0 0 40px rgba(29, 78, 216, 0.45), 0 0 70px rgba(109, 40, 217, 0.3)' },
        }
      }
    },
  },
  plugins: [],
}
