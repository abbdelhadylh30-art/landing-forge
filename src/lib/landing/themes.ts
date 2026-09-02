import type { ThemeId } from "./types"

export interface ThemeDef {
  id: ThemeId
  name: string
  swatch: string[]
  mode: "dark" | "light"
  /** CSS custom properties applied to the preview root */
  vars: {
    bg: string
    bgAlt: string
    surface: string
    text: string
    textMuted: string
    accent: string
    accentText: string
    accentSoft: string // translucent accent for chips/badges
    border: string
    gradient: string
  }
}

export const THEMES: ThemeDef[] = [
  {
    id: "nebula",
    name: "Nebula",
    swatch: ["#0a0a0f", "#1a0a2e", "#A78BFA"],
    mode: "dark",
    vars: {
      bg: "#0a0a0f",
      bgAlt: "#120a1f",
      surface: "rgba(167,139,250,0.06)",
      text: "#f5f3ff",
      textMuted: "#a7a2b8",
      accent: "#A78BFA",
      accentText: "#12101c",
      accentSoft: "rgba(167,139,250,0.14)",
      border: "rgba(167,139,250,0.18)",
      gradient: "linear-gradient(135deg, #A78BFA 0%, #f5f3ff 100%)",
    },
  },
  {
    id: "ember",
    name: "Ember",
    swatch: ["#120803", "#241005", "#fb923c"],
    mode: "dark",
    vars: {
      bg: "#120803",
      bgAlt: "#1e0d04",
      surface: "rgba(251,146,60,0.06)",
      text: "#fff7ed",
      textMuted: "#c4b0a0",
      accent: "#fb923c",
      accentText: "#1a0d02",
      accentSoft: "rgba(251,146,60,0.14)",
      border: "rgba(251,146,60,0.18)",
      gradient: "linear-gradient(135deg, #fb923c 0%, #fde68a 100%)",
    },
  },
  {
    id: "emerald",
    name: "Emerald",
    swatch: ["#04120c", "#07231a", "#34d399"],
    mode: "dark",
    vars: {
      bg: "#04120c",
      bgAlt: "#062016",
      surface: "rgba(52,211,153,0.06)",
      text: "#ecfdf5",
      textMuted: "#9fbcae",
      accent: "#34d399",
      accentText: "#03150e",
      accentSoft: "rgba(52,211,153,0.14)",
      border: "rgba(52,211,153,0.18)",
      gradient: "linear-gradient(135deg, #34d399 0%, #d1fae5 100%)",
    },
  },
  {
    id: "rose",
    name: "Rosé",
    swatch: ["#120509", "#220a12", "#fb7185"],
    mode: "dark",
    vars: {
      bg: "#120509",
      bgAlt: "#1d0910",
      surface: "rgba(251,113,133,0.06)",
      text: "#fff1f2",
      textMuted: "#c3a3ab",
      accent: "#fb7185",
      accentText: "#210509",
      accentSoft: "rgba(251,113,133,0.14)",
      border: "rgba(251,113,133,0.18)",
      gradient: "linear-gradient(135deg, #fb7185 0%, #fda4af 100%)",
    },
  },
  {
    id: "mono",
    name: "Mono",
    swatch: ["#0a0a0a", "#161616", "#fafafa"],
    mode: "dark",
    vars: {
      bg: "#0a0a0a",
      bgAlt: "#141414",
      surface: "rgba(255,255,255,0.04)",
      text: "#fafafa",
      textMuted: "#a3a3a3",
      accent: "#fafafa",
      accentText: "#0a0a0a",
      accentSoft: "rgba(255,255,255,0.10)",
      border: "rgba(255,255,255,0.14)",
      gradient: "linear-gradient(135deg, #fafafa 0%, #a3a3a3 100%)",
    },
  },
  {
    id: "paper",
    name: "Paper",
    swatch: ["#faf9f7", "#f1efe9", "#6d28d9"],
    mode: "light",
    vars: {
      bg: "#faf9f7",
      bgAlt: "#f1efe9",
      surface: "rgba(109,40,217,0.05)",
      text: "#1c1917",
      textMuted: "#78716c",
      accent: "#6d28d9",
      accentText: "#faf9f7",
      accentSoft: "rgba(109,40,217,0.10)",
      border: "rgba(28,25,23,0.12)",
      gradient: "linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)",
    },
  },
]

export function getTheme(id: ThemeId): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

/** style object with CSS vars for a theme, spread onto the preview root element */
export function themeStyle(id: ThemeId): React.CSSProperties {
  const t = getTheme(id)
  return {
    ["--lf-bg" as string]: t.vars.bg,
    ["--lf-bg-alt" as string]: t.vars.bgAlt,
    ["--lf-surface" as string]: t.vars.surface,
    ["--lf-text" as string]: t.vars.text,
    ["--lf-muted" as string]: t.vars.textMuted,
    ["--lf-accent" as string]: t.vars.accent,
    ["--lf-accent-contrast" as string]: t.vars.accentText,
    ["--lf-accent-soft" as string]: t.vars.accentSoft,
    ["--lf-border" as string]: t.vars.border,
    ["--lf-gradient" as string]: t.vars.gradient,
    background: t.vars.bg,
    color: t.vars.text,
  }
}
