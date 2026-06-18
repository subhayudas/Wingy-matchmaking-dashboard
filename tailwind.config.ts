import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#f6f1ea",
        "cream-alt": "#ece5db",
        ink: "#0d1510",
        "ink-soft": "#253c31",
        muted: "#2c4839",
        dark: "#06120b",
        forest: "#2c4839",
        "forest-light": "#324a36",
        gold: "#c8933a",
        rust: "#b84c2b",
        chip: {
          blue: "#dbf7ff",
          green: "#dcffdb",
          purple: "#dedbff",
          yellow: "#faffdb",
          red: "#ffdbdb",
          orange: "#ffefdb",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Cormorant Garamond", "serif"],
        editorial: ["var(--font-editorial)", "Playfair Display", "serif"],
        body: ["var(--font-body)", "DM Sans", "sans-serif"],
        mono: ["var(--font-mono)", "DM Mono", "monospace"],
      },
      borderRadius: {
        card: "16px",
        lg2: "32px",
        xl2: "36px",
      },
      boxShadow: {
        sm2: "0 1px 8px rgba(13,21,16,0.04)",
        md2: "0 4px 20px rgba(13,21,16,0.08)",
        lg2: "0 8px 40px rgba(13,21,16,0.12)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0,0,0.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
