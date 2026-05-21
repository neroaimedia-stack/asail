export const designTokens = {
  accent: {
    base: "#3B82F6",
    border: "rgba(59,130,246,0.35)",
    bright: "#60A5FA",
    dim: "rgba(59,130,246,0.15)",
    glow: "0 0 24px rgba(59,130,246,0.22)",
  },
  dark: {
    bg: {
      app: "#111114",
      page: "#1f1f20",
      panel: "#18181c",
      panelElevated: "#1d1d22",
      panelSunken: "#0b0b0d",
      sidebar: "#151518",
    },
    border: {
      default: "#29292f",
      subtle: "#202024",
    },
    text: {
      muted: "#74747d",
      primary: "#f4f4f5",
      secondary: "#b5b5bd",
    },
  },
  light: {
    bg: {
      app: "#ffffff",
      page: "#f3f4f6",
      panel: "#ffffff",
      panelElevated: "#f9fafb",
      panelSunken: "#f1f5f9",
      sidebar: "#f8fafc",
    },
    border: {
      default: "#e5e7eb",
      subtle: "#f1f5f9",
    },
    text: {
      muted: "#6b7280",
      primary: "#111827",
      secondary: "#4b5563",
    },
  },
  radius: {
    button: "8px",
    card: "10px",
    input: "8px",
    pill: "999px",
  },
  shadow: {
    inner: "inset 0 1px 0 rgba(255,255,255,0.04)",
    panel: "0 18px 60px rgba(0,0,0,0.45)",
  },
  status: {
    danger: "#ef4444",
    dangerSurface: "rgba(239,68,68,0.16)",
    info: "#0ea5e9",
    infoSurface: "rgba(14,165,233,0.16)",
    success: "#16a34a",
    successSurface: "rgba(22,163,74,0.16)",
    warning: "#f59e0b",
    warningSurface: "rgba(245,158,11,0.16)",
  },
  typography: {
    sizes: {
      base: "14px",
      lg: "18px",
      sm: "12px",
      xl: "22px",
      xs: "11px",
    },
    weights: {
      bold: 700,
      medium: 500,
      regular: 400,
      semibold: 600,
    },
  },
} as const;

export type DesignTokens = typeof designTokens;
