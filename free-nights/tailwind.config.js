/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Hanken Grotesk"', "system-ui", "sans-serif"],
        mono: ['"Space Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        ink: "#241D2B",
        paper: "#F7F1F3",
        card: "#FFFFFF",
        mist: "#EBE3E7",
        muted: "#8B8090",
        mulberry: {
          DEFAULT: "#B24468",
          soft: "#F4DEE6",
          deep: "#8A3050",
        },
        dawn: "#5F9EC0",
        gold: "#E0982A",
        dusk: "#8A5AA6",
      },
      boxShadow: {
        card: "0 1px 2px rgba(36,29,43,0.04), 0 8px 24px rgba(36,29,43,0.06)",
        glow: "0 0 0 1px rgba(178,68,104,0.15), 0 6px 20px rgba(178,68,104,0.18)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 0.28s ease-out both",
      },
    },
  },
  plugins: [],
};
