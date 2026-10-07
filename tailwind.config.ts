import type { Config } from "tailwindcss";

// All design tokens live here (colors reference CSS variables in src/app/globals.css).
// Changing a color is a one-line change in globals.css.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: v("paper"),
        surface: v("surface"),
        ink: v("ink"),
        slate: v("slate"),
        line: v("line"),
        lagoon: { DEFAULT: v("lagoon"), dark: v("lagoon-dark"), tint: v("lagoon-tint") },
        marigold: { DEFAULT: v("marigold"), tint: v("marigold-tint") },
        brick: { DEFAULT: v("brick"), tint: v("brick-tint") },
        fern: v("fern"),
      },
      fontFamily: {
        sans: ['"Schibsted Grotesk Variable"', "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
        serif: ['"Newsreader Variable"', "Georgia", '"Times New Roman"', "serif"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["20px", { lineHeight: "28px" }],
        xl: ["24px", { lineHeight: "32px" }],
        "2xl": ["32px", { lineHeight: "40px" }],
        source: ["17px", { lineHeight: "28px" }],
      },
      borderRadius: { card: "10px", control: "8px" },
      boxShadow: { pop: "0 8px 24px rgba(23, 33, 43, 0.12)" },
      maxWidth: { page: "1120px", prose: "75ch" },
      keyframes: {
        slide: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(300%)" } },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
        flash: { "0%": { backgroundColor: "rgb(var(--marigold-tint))" }, "100%": { backgroundColor: "transparent" } },
      },
      animation: {
        slide: "slide 1.2s ease-in-out infinite",
        fade: "fade 150ms ease-out",
        flash: "flash 600ms ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
