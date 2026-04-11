import { ThemeColors } from "./Colors";

export type NeumoVariant =
  | "glass"
  | "glass-strong"
  | "solid"
  | "inset"
  | "raised"
  | "flat";
export type NeumoTone =
  | "base"
  | "surface"
  | "surface-strong"
  | "accent"
  | "danger"
  | "success"
  | "info";

export const NeumoTokens = {
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 22,
    xl: 28,
    pill: 999,
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  motion: {
    fast: 180,
    normal: 220,
    slow: 260,
  },
  touch: {
    minTarget: 44,
  },
  control: {
    button: {
      sm: { paddingHorizontal: 14, paddingVertical: 10, minHeight: 44 },
      md: { paddingHorizontal: 16, paddingVertical: 12, minHeight: 48 },
      lg: { paddingHorizontal: 18, paddingVertical: 14, minHeight: 52 },
    },
    pill: {
      padding: 8,
      minHeight: 36,
      paddingHorizontal: 12,
    },
  },
};

export const FloatingTabBar = {
  height: 74,
  inset: NeumoTokens.spacing.md,
  spacer:
    74 + NeumoTokens.spacing.md + NeumoTokens.spacing.md + NeumoTokens.spacing.xs,
};

export const resolveNeumoVariant = (
  variant: NeumoVariant,
): "glass" | "glass-strong" | "solid" | "inset" => {
  if (variant === "raised") {
    return "glass";
  }
  if (variant === "flat") {
    return "solid";
  }
  return variant;
};

export const getSurfaceColor = (colors: ThemeColors, tone: NeumoTone) => {
  switch (tone) {
    case "accent":
      return colors.accent;
    case "danger":
      return colors.danger.background;
    case "success":
      return colors.success.background;
    case "info":
      return colors.info.background;
    case "surface-strong":
      return colors.surfaceGlassStrong;
    case "surface":
      return colors.surfaceGlass;
    case "base":
    default:
      return colors.background.default;
  }
};

export const getNeumoShadow = (colors: ThemeColors, variant: NeumoVariant) => {
  return {};
};
