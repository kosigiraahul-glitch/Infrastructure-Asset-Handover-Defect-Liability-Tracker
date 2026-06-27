/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // High-end enterprise theme palette
        brand: {
          50: '#f5f7fa',
          100: '#eaeef4',
          200: '#d0daf0',
          300: '#a6bbdc',
          400: '#7697c4',
          500: '#5377aa',
          600: '#3f5d8e',
          700: '#334b75',
          800: '#2c3e5f',
          900: '#283651',
          950: '#1b2336',
        },
        darkbg: {
          DEFAULT: '#0f172a', // slate-900
          card: '#1e293b',    // slate-800
          border: '#334155',  // slate-700
          hover: '#1e293b',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      }
    },
  },
  plugins: [],
}
