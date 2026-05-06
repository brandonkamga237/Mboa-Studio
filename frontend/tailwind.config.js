/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Lora", "Georgia", "serif"],
        body: ["Source Sans 3", "Helvetica Neue", "Arial", "sans-serif"],
      },
      colors: {
        navy:    "#1E2D4A",
        "navy-light": "#2B3F62",
        blue:    "#2B4C7E",
        gold:    "#C9952A",
        "gold-pale": "#F5E9C8",
        cream:   "#F7F3EE",
        "warm-white": "#FDFAF7",
        stone:   "#E8E2D9",
        "stone-dark": "#D1C9BE",
      },
      maxWidth: {
        content: "720px",
      },
      width: {
        sidebar: "240px",
      },
    },
  },
  plugins: [],
};
