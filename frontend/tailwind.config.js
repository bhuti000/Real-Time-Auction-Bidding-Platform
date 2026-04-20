/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#005eb8",
        "primary-dim": "#0052a2",
        "primary-container": "#609efc",
        "surface": "#f8f9ff",
        "on-surface": "#1d344d",
        "on-surface-variant": "#4b617c",
        "surface-container-low": "#eef4ff",
        "surface-container-highest": "#d2e4ff",
        "surface-container-lowest": "#ffffff",
        "secondary": "#006d4a",
        "secondary-container": "#6ffbbe",
        "on-secondary-container": "#002114",
        "on-secondary": "#ffffff",
        "secondary-fixed": "#a8f5d9",
        "tertiary-container": "#deccfd",
        "on-tertiary-container": "#50426b",
        "inverse-surface": "#050f1a",
        "outline-variant": "#7da8d0",
        "error": "#ba1a1a",
      },
      fontFamily: {
        "headline": ["Manrope", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"],
      },
      boxShadow: {
        "premium": "0 20px 40px rgba(29, 52, 77, 0.06)",
      }
    },
  },
  plugins: [],
}
