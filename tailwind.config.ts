import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        hot: "var(--hot)",
        "hot-ink": "var(--hot-ink)",
        live: "var(--live)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        shell: "1.75rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
