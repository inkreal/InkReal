/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', "ui-serif", "Georgia", "serif"],
        display: ['"Cormorant Garamond"', "ui-serif", "Georgia", "serif"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Warm amber accent — signature across both modes
        amber: {
          50: "#fdf8ed",
          100: "#faedcd",
          200: "#f4d99a",
          300: "#edc264",
          400: "#e6ad3b",
          500: "#d99a23",
          600: "#b87a1c",
          700: "#925b18",
          800: "#6f4519",
          900: "#4d3014",
        },
        // Cinematic dark surface ramp
        ink: {
          950: "#07070a",
          900: "#0c0c11",
          850: "#111118",
          800: "#16161f",
          700: "#1d1d28",
          600: "#262634",
          500: "#34344a",
          400: "#4a4a63",
        },
        // Warm cream editorial surface ramp (light mode)
        paper: {
          50: "#fbf8f1",
          100: "#f7f1e6",
          200: "#efe6d4",
          300: "#e4d6ba",
          400: "#d2bd97",
        },
        charcoal: {
          900: "#1c1a17",
          800: "#2a2723",
          700: "#3a3631",
          600: "#524c45",
          500: "#6b635a",
        },
        success: {
          500: "#3f9d6b",
          600: "#2f7d54",
        },
        warning: {
          500: "#d9a441",
          600: "#b87a1c",
        },
        error: {
          500: "#c84a4a",
          600: "#a83a3a",
        },
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slow-zoom": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.08)" },
        },
        "ambient-drift": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(2%, -2%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 1.2s ease forwards",
        "scale-in": "scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slow-zoom": "slow-zoom 20s ease-in-out infinite alternate",
        "ambient-drift": "ambient-drift 18s ease-in-out infinite",
        "pulse-soft": "pulse-soft 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
