/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0b1830",
        night: "#070f1f",
        gold: "#d6a84f",
        ember: "#c9413d",
        pitch: "#31d37f",
      },
      boxShadow: {
        glow: "0 18px 60px rgba(214, 168, 79, 0.18)",
      },
    },
  },
  plugins: [],
};
