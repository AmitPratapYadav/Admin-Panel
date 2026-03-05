/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#9BCBBF",
        "primary-dark": "#86B8AD",
      },
    },
  },
  plugins: [],
};