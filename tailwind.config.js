/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        taktak: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316', // Vibrant Orange
          600: '#ea580c',
          700: '#c2410c',
          900: '#7c2d12',
          dark: '#12141d',
          card: '#1e2230',
        }
      },
      animation: {
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-short': 'bounce 0.8s infinite',
      }
    },
  },
  plugins: [],
}
