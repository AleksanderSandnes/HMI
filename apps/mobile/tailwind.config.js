/**
 * HMI mobile design tokens — mirror the web @theme tokens in
 * apps/web/app/globals.css VERBATIM so className strings stay portable between
 * web (Tailwind v4) and mobile (NativeWind v4 / Tailwind v3). globals.css is the
 * source of truth; keep these values in sync.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        "bg-base": "#070b16",
        "bg-grad-1": "#0a1124",
        "bg-grad-2": "#080d1b",
        "bg-grad-3": "#06080f",

        // Glass surfaces (native uses translucent fills; real blur via expo-blur)
        "glass-fill": "rgba(255, 255, 255, 0.045)",
        "glass-fill-strong": "rgba(255, 255, 255, 0.075)",
        "glass-fill-subtle": "rgba(255, 255, 255, 0.025)",
        "glass-border": "rgba(255, 255, 255, 0.09)",
        "glass-border-strong": "rgba(255, 255, 255, 0.16)",

        // Text
        "text-primary": "#f6f8fc",
        "text-secondary": "#aeb8cc",
        "text-muted": "#71809a",
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
        positive: "#34d399",
        negative: "#fb7185",
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
