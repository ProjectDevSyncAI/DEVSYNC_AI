/** @type {import("tailwindcss").Config} */

const config = {
  darkMode: "class",

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.25rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "2.5rem",
      },
      screens: {
        "2xl": "1440px",
      },
    },

    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },

      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },

        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },

        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },

        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },

        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },

        info: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
      },

      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        88: "22rem",
        100: "25rem",
        112: "28rem",
        128: "32rem",
      },

      minHeight: {
        screen: "100vh",
        "screen-safe":
          "calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
      },

      maxWidth: {
        "8xl": "90rem",
        "9xl": "100rem",
      },

      borderRadius: {
        "4xl": "2rem",
      },

      boxShadow: {
        soft:
          "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 8px 30px -12px rgb(15 23 42 / 0.12)",
        card:
          "0 1px 3px 0 rgb(15 23 42 / 0.06), 0 8px 24px -12px rgb(15 23 42 / 0.12)",
        elevated:
          "0 10px 40px -16px rgb(15 23 42 / 0.20)",
        brand:
          "0 10px 30px -12px rgb(79 70 229 / 0.35)",
      },

      transitionTimingFunction: {
        "out-expo":
          "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-expo":
          "cubic-bezier(0.87, 0, 0.13, 1)",
      },

      transitionDuration: {
        400: "400ms",
        600: "600ms",
        800: "800ms",
      },

      keyframes: {
        "fade-in": {
          from: {
            opacity: "0",
          },
          to: {
            opacity: "1",
          },
        },

        "fade-up": {
          from: {
            opacity: "0",
            transform: "translateY(10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },

        "fade-down": {
          from: {
            opacity: "0",
            transform: "translateY(-10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },

        "scale-in": {
          from: {
            opacity: "0",
            transform: "scale(0.96)",
          },
          to: {
            opacity: "1",
            transform: "scale(1)",
          },
        },

        "slide-in-right": {
          from: {
            opacity: "0",
            transform: "translateX(16px)",
          },
          to: {
            opacity: "1",
            transform: "translateX(0)",
          },
        },

        "slide-in-left": {
          from: {
            opacity: "0",
            transform: "translateX(-16px)",
          },
          to: {
            opacity: "1",
            transform: "translateX(0)",
          },
        },

        shimmer: {
          "0%": {
            backgroundPosition: "-200% 0",
          },
          "100%": {
            backgroundPosition: "200% 0",
          },
        },

        "pulse-soft": {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.65",
          },
        },
      },

      animation: {
        "fade-in":
          "fade-in 250ms ease-out both",
        "fade-up":
          "fade-up 350ms ease-out both",
        "fade-down":
          "fade-down 350ms ease-out both",
        "scale-in":
          "scale-in 200ms ease-out both",
        "slide-in-right":
          "slide-in-right 300ms ease-out both",
        "slide-in-left":
          "slide-in-left 300ms ease-out both",
        shimmer:
          "shimmer 2s linear infinite",
        "pulse-soft":
          "pulse-soft 2s ease-in-out infinite",
      },

      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)",
        "subtle-gradient":
          "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        "dark-gradient":
          "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
      },
    },
  },

  plugins: [],
};

export default config;