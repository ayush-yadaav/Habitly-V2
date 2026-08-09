export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        bgTop: "rgb(var(--bg-top) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surfaceRaised: "rgb(var(--surface-raised) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        cream: "rgb(var(--cream) / <alpha-value>)",
        creamDim: "rgb(var(--cream-dim) / <alpha-value>)",
        textPrimary: "rgb(var(--text-primary) / <alpha-value>)",
        textSecondary: "rgb(var(--text-secondary) / <alpha-value>)",
        textMuted: "rgb(var(--text-muted) / <alpha-value>)",
        teal: "rgb(var(--teal) / <alpha-value>)",
        lavender: "rgb(var(--lavender) / <alpha-value>)",
        pink: "rgb(var(--pink) / <alpha-value>)",
        yellow: "rgb(var(--yellow) / <alpha-value>)",
        accentSoft: "rgb(var(--accent-soft) / <alpha-value>)",
      },
      fontFamily: {
        display: ["Airone", "Playfair Display", "serif"],
        body: ["Built", "Lato", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
