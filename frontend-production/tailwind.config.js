/** @type {import('tailwindcss').Config} */
const flowbite = require("flowbite-react/tailwind");
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", flowbite.content()],
  theme: {
    extend: {
      colors: {
        "acm-blue": "#39B5FB",
        rectBox: "#E2EBF6",
        "acm-gray": "#2B2B2C",
        "acm-light-gray": "#FBFBFB",
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in",
        typing: "typing 3s steps(50, end)",
        carousel: "carousel 9s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        typing: {
          from: { width: "0" },
          to: { width: "100%" },
        },
        carousel: {
          "0%, 33%": { transform: "translateY(0)" },
          "33%, 66%": { transform: "translateY(-33.33%)" },
          "66%, 100%": { transform: "translateY(-66.66%)" },
        },
      },
      fontFamily: {
        archivo: ["Archivo", "arial"],
      },
    },
  },
  plugins: [flowbite.plugin()],
};
