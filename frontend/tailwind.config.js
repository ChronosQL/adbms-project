/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary:   "#EF8354", // Coral
          hover:     "#4F5D75", // Payne's gray
          light:     "#BFC0C0", // Silver
          dark:      "#2D3142", // Gunmetal
          white:     "#FFFFFF",
        },
      },
      fontFamily: {
        heading: ["Montserrat", "sans-serif"],
        body:    ["Open Sans", "sans-serif"],
        sans:    ["Open Sans", "sans-serif"],
      },
      keyframes: {
        shimmer: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        fadeIn: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite",
        fadeIn:  "fadeIn 0.3s ease forwards",
      },
    },
  },
  plugins: [],
};
