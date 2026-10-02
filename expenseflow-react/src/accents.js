// Accent color presets. Each preset defines the core accent plus the derived
// tints/shades used across the UI, for both light and dark themes.
export const ACCENTS = {
  indigo: {
    label: "Indigo",
    swatch: "#4a5adf",
    light: { accent: "#4a5adf", light: "#7c8cff", bg: "#eef0ff", soft: "#c7ccf8", grad: "linear-gradient(135deg,#5a6bf0 0%,#7c8cff 100%)" },
    dark:  { accent: "#7c8cff", light: "#a0acff", bg: "#1a1e3b", soft: "#2b3160", grad: "linear-gradient(135deg,#6473f2 0%,#8b98ff 100%)" },
  },
  emerald: {
    label: "Emerald",
    swatch: "#0f9d6e",
    light: { accent: "#0f9d6e", light: "#34d399", bg: "#e5f7f0", soft: "#a7e8d0", grad: "linear-gradient(135deg,#0f9d6e 0%,#34d399 100%)" },
    dark:  { accent: "#34d399", light: "#6ee7b7", bg: "#0f2b22", soft: "#1c4d3c", grad: "linear-gradient(135deg,#10b981 0%,#34d399 100%)" },
  },
  ocean: {
    label: "Ocean",
    swatch: "#0e7cc4",
    light: { accent: "#0e7cc4", light: "#38bdf8", bg: "#e4f3fc", soft: "#a6dbf5", grad: "linear-gradient(135deg,#0e7cc4 0%,#38bdf8 100%)" },
    dark:  { accent: "#38bdf8", light: "#7dd3fc", bg: "#0c2634", soft: "#164559", grad: "linear-gradient(135deg,#0ea5e9 0%,#38bdf8 100%)" },
  },
  violet: {
    label: "Violet",
    swatch: "#7c3aed",
    light: { accent: "#7c3aed", light: "#a78bfa", bg: "#f1eafe", soft: "#d3c0f8", grad: "linear-gradient(135deg,#7c3aed 0%,#a78bfa 100%)" },
    dark:  { accent: "#a78bfa", light: "#c4b5fd", bg: "#241540", soft: "#3c2766", grad: "linear-gradient(135deg,#8b5cf6 0%,#a78bfa 100%)" },
  },
  rose: {
    label: "Rose",
    swatch: "#e11d63",
    light: { accent: "#e11d63", light: "#fb7185", bg: "#fdeaf1", soft: "#f8c0d3", grad: "linear-gradient(135deg,#e11d63 0%,#fb7185 100%)" },
    dark:  { accent: "#fb7185", light: "#fda4af", bg: "#3a1420", soft: "#5e2233", grad: "linear-gradient(135deg,#f43f5e 0%,#fb7185 100%)" },
  },
  amber: {
    label: "Amber",
    swatch: "#d97706",
    light: { accent: "#d97706", light: "#f59e0b", bg: "#fdf0dc", soft: "#f8d59a", grad: "linear-gradient(135deg,#d97706 0%,#f59e0b 100%)" },
    dark:  { accent: "#f59e0b", light: "#fbbf24", bg: "#332107", soft: "#573a12", grad: "linear-gradient(135deg,#f59e0b 0%,#fbbf24 100%)" },
  },
  teal: {
    label: "Teal",
    swatch: "#0d9488",
    light: { accent: "#0d9488", light: "#2dd4bf", bg: "#e0f5f2", soft: "#9de3da", grad: "linear-gradient(135deg,#0d9488 0%,#2dd4bf 100%)" },
    dark:  { accent: "#2dd4bf", light: "#5eead4", bg: "#0c2b28", soft: "#164e48", grad: "linear-gradient(135deg,#14b8a6 0%,#2dd4bf 100%)" },
  },
  slate: {
    label: "Graphite",
    swatch: "#475569",
    light: { accent: "#475569", light: "#64748b", bg: "#eef1f5", soft: "#c3ccda", grad: "linear-gradient(135deg,#475569 0%,#64748b 100%)" },
    dark:  { accent: "#94a3b8", light: "#cbd5e1", bg: "#1c2431", soft: "#33415a", grad: "linear-gradient(135deg,#64748b 0%,#94a3b8 100%)" },
  },
};

export const DEFAULT_ACCENT = "indigo";

// Apply the chosen accent's variables for the active theme onto :root.
export function applyAccent(accentKey, theme) {
  const preset = ACCENTS[accentKey] || ACCENTS[DEFAULT_ACCENT];
  const v = preset[theme === "dark" ? "dark" : "light"];
  const root = document.documentElement;
  root.style.setProperty("--accent", v.accent);
  root.style.setProperty("--accent-light", v.light);
  root.style.setProperty("--accent-bg", v.bg);
  root.style.setProperty("--accent-soft", v.soft);
  root.style.setProperty("--accent-grad", v.grad);
}
