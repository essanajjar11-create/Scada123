/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          darkest: '#0f1115',
          bg: '#16191f',
          surface: '#1e222a',
          card: '#252a35',
          border: '#333a47',
          steel: '#4b5563',
          crimson: '#dc2626',
          amber: '#ea580c',
          green: '#16a34a',
          cyan: '#0284c7',
        }
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'Consolas', 'monospace'],
        sans: ['Inter', 'Cairo', 'Segoe UI', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
