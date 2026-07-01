/**
 * HMI mobile design tokens — mirror the web @theme tokens in
 * apps/web/app/globals.css VERBATIM so className strings stay portable between
 * web (Tailwind v4) and mobile (NativeWind v4 / Tailwind v3). globals.css is the
 * source of truth; keep these values in sync. Chrome tokens (bg/glass/text/
 * positive/negative) are CSS variables defined in ./global.css — light under
 * `:root`, dark under `.dark:root` — so a single className works in both
 * modes; see src/lib/theme.tsx for the runtime mode switch. Gradient tokens
 * (solar/energy/accent/revenue) are intentionally mode-independent.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Backgrounds (see global.css for the light/dark values)
        "bg-base": "var(--bg-base)",

        // Glass surfaces (native uses translucent fills; real blur via expo-blur)
        "glass-fill": "var(--glass-fill)",
        "glass-fill-strong": "var(--glass-fill-strong)",
        "glass-fill-subtle": "var(--glass-fill-subtle)",
        "glass-border": "var(--glass-border)",
        "glass-border-strong": "var(--glass-border-strong)",

        // Text
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "text-inverse": "#0a1124",

        // Solar gold
        solar: "#f59e0b",
        "solar-light": "#fbbf24",
        "solar-soft": "rgba(245, 158, 11, 0.14)",

        // Energy teal/green
        energy: "#10b981",
        "energy-light": "#34d399",
        "energy-soft": "rgba(45, 212, 191, 0.14)",

        // Accent violet/indigo
        accent: "#6366f1",
        "accent-light": "#818cf8",
        "accent-soft": "rgba(129, 140, 248, 0.14)",

        // Revenue gold-lime
        revenue: "#eab308",
        "revenue-light": "#facc15",
        "revenue-soft": "rgba(234, 179, 8, 0.14)",

        // Status
        positive: "var(--positive)",
        negative: "var(--negative)",
      },
      borderRadius: {
        sm: "12px",
        md: "18px",
        lg: "24px",
        xl: "30px",
        pill: "999px",
      },
    },
  },
  plugins: [],
};
