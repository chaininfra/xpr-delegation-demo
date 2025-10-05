/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6ff',
          300: '#a5b8ff',
          400: '#8190ff',
          500: '#667eea',
          600: '#5a6fd8',
          700: '#4c5bc7',
          800: '#3f4bb0',
          900: '#2d3a8c',
        },
        secondary: {
          50: '#f8f5ff',
          100: '#f0ebff',
          200: '#e1d7ff',
          300: '#c9b8ff',
          400: '#a78bff',
          500: '#764ba2',
          600: '#6a4190',
          700: '#5e387e',
          800: '#522f6c',
          900: '#46265a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'medium': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'large': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}