/** @type {import('tailwindcss').Config} */
const flowbite = require('flowbite-react/tailwind')
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    flowbite.content(),
  ],
  theme: {
    extend: {
      colors: {
        'acm-blue': '#39B5FB',
        'rectBox': '#E2EBF6',
        'acm-gray': '#2B2B2C',
        'acm-light-gray': '#FBFBFB'
      },
      fontFamily: {
        archivo: ["Archivo", "arial"]
      },

    },
  },
  plugins: [
    flowbite.plugin(),
  ],
}

