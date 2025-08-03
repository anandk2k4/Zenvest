/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'josefin': ['Josefin Sans', 'sans-serif'],
        'karla': ['Karla', 'sans-serif'],
        'open-sans': ['Open Sans', 'sans-serif'],
        'atkinson': ['Atkinson Hyperlegible Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} 