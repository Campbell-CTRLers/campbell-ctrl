/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        background: "rgb(var(--color-background) / <alpha-value>)",
        slate: "rgb(var(--color-slate) / <alpha-value>)",
        contrast: {
          bg: "rgb(var(--color-contrast-bg) / <alpha-value>)",
          text: "rgb(var(--color-contrast-text) / <alpha-value>)"
        },
        campbell: "rgb(var(--color-campbell) / <alpha-value>)"
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
        display: ["Outfit", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
        drama: ["Playfair Display", "serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}
