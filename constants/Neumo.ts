import { Platform } from "react-native";
import { ThemeColors } from "./Colors";

export type NeumoVariant = "raised" | "inset" | "flat";
export type NeumoTone =
  | "base"
  | "surface"
  | "accent"
  | "danger"
  | "success"
  | "info";

export const NeumoTokens = {
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
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
    case "surface":
      return colors.surface;
    case "base":
    default:
      return colors.background.default;
  }
};

export const getNeumoShadow = (
  colors: ThemeColors,
  variant: NeumoVariant
) => {
  if (variant === "flat") {
    return {};
  }

  const dark = colors.shadowDark;

  if (Platform.OS === "web") {
    const inset = variant === "inset" ? "inset " : "";
    const offset = variant === "inset" ? 2 : 6;
    const blur = variant === "inset" ? 6 : 14;
    return {
      boxShadow: `${inset}${offset}px ${offset}px ${blur}px ${dark}`,
    } as any;
  }

  return {
    shadowColor: dark,
    shadowOffset: {
      width: variant === "inset" ? -2 : 6,
      height: variant === "inset" ? -2 : 6,
    },
    shadowOpacity: variant === "inset" ? 0.18 : 0.2,
    shadowRadius: variant === "inset" ? 6 : 14,
    elevation: variant === "inset" ? 1 : 8,
  };
};
