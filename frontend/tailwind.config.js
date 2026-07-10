/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#131B3A",
        fog: "#F8FAFC",
        surface: "#FFFFFF",
        border: "#E2E8F0",
        ink: "#131B3A",
        "ink-muted": "#64748B",
        "ink-faint": "#94A3B8",

        teal: {
          DEFAULT: "#0D9488",
          dark: "#0F766E",
          soft: "#CCFBF1",
        },

        status: {
          todo: "#94A3B8",
          "todo-soft": "#F1F5F9",
          progress: "#F59E0B",
          "progress-soft": "#FEF3C7",
          done: "#16A34A",
          "done-soft": "#DCFCE7",
        },

        priority: {
          low: "#3B82F6",
          "low-soft": "#DBEAFE",
          medium: "#F59E0B",
          "medium-soft": "#FEF3C7",
          high: "#DC2626",
          "high-soft": "#FEE2E2",
        },

        danger: {
          DEFAULT: "#DC2626",
          soft: "#FEF2F2",
        },
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(19, 27, 58, 0.06), 0 1px 2px rgba(19, 27, 58, 0.04)",
        raised: "0 4px 12px rgba(19, 27, 58, 0.08)",
      },
    },
  },
  plugins: [],
};