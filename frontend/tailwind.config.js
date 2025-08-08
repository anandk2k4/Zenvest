/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'exo': ['"Exo 2"', 'sans-serif'],
        'josefin': ['"Josefin Sans"', 'sans-serif'],
        'karla': ['"Karla"', 'sans-serif'],
        'open-sans': ['Open Sans', 'sans-serif'],
        'atkinson': ['Atkinson Hyperlegible Mono', 'monospace'],
        'kanit':['"Kanit"','sans-serif'],
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out",
      },
      colors: {
        sidebar: "#ffffff",
        "sidebar-foreground": "#1f2937",
        "sidebar-accent": "#10b981",
        "sidebar-accent-foreground": "#ffffff",
        "sidebar-border": "#e5e7eb",
      },
    },
  },
  plugins: [],
} 