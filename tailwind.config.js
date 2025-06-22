/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'saucier-blue': '#1F4A66',
        'saucier-blue-light': '#2A5A7A',
        'saucier-blue-dark': '#1A3D55',
      },
    },
  },
  plugins: [],
}