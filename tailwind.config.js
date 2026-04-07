/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  safelist: [
    "bg-white",
    "text-slate-800",
    "antialiased",
    "dark:bg-slate-950",
    "dark:text-slate-100",
  ],
  theme: {
    extend: {
      keyframes: {
        typeInOut: {
          "0%": { clipPath: "inset(0 100% 0 0)" },
          "55%": { clipPath: "inset(0 0 0 0)" },
          "80%": { clipPath: "inset(0 0 0 0)" },
          "100%": { clipPath: "inset(0 100% 0 0)" },
        },

        blink: {
          "0%, 49%": { borderColor: "currentColor" },
          "50%, 100%": { borderColor: "transparent" },
        },

        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },

      animation: {
        heroType: "typeInOut 9s ease-in-out infinite",
        heroBrand: "typeInOut 7s ease-in-out infinite",
        blinkSoft: "blink .75s step-end infinite",
        fadeUp: "fadeUp .6s ease-out .2s both",
      },

      fontFamily: {
        sans: [
          '"Outfit"',
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "Apple Color Emoji",
          "Segoe UI Emoji",
        ],
      },

      screens: {
        uw: "1600px",
        ultra: "1920px",
        "4k": "2160px",
      },

      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "1.25rem",
          lg: "2rem",
          xl: "2.5rem",
          "2xl": "3rem",
        },
      },

      maxWidth: {
        "8xl": "90rem",
        "9xl": "100rem",
        "10xl": "120rem",
      },

      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          cyan: "#2FD0D8",
        },
      },

      boxShadow: {
        card: "0 8px 30px rgba(0,0,0,.06)",
      },

      fontSize: {
        "fluid-3xl": [
          "clamp(1.75rem, 1.2rem + 2.2vw, 2.5rem)",
          { lineHeight: "1.1" },
        ],
        "fluid-4xl": [
          "clamp(2rem, 1.2rem + 3vw, 3rem)",
          { lineHeight: "1.1" },
        ],
        "fluid-5xl": [
          "clamp(2.25rem, 1rem + 4vw, 3.75rem)",
          { lineHeight: "1.05" },
        ],
      },
    },
  },
  plugins: [],
};