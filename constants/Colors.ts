import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";

interface ColorProps {
  background: string;
  text: string;
  button: string;
  card?: string;
}

export interface ThemeColors {
  primary: ColorProps;
  secondary: ColorProps;
  success: ColorProps;
  danger: ColorProps;
  warning: ColorProps;
  info: ColorProps;
  light: ColorProps;
  dark: ColorProps;
  background: {
    default: string;
    text: string;
    paper: string;
    gradient: string[];
  };
  disabled: ColorProps;
  input: ColorProps;
  gradient: string[];
  transparent: string;
  outlinedButtonText: string;
  card: string[];
  surface: string;
  surfaceAlt: string;
  surfaceSolid: string;
  surfaceGlass: string;
  surfaceGlassStrong: string;
  overlay: string;
  strokeSubtle: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  shadowLight: string;
  shadowDark: string;
  shadowSoft: string;
  focusRing: string;
  status: {
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
}

const accentColor = "#2DB34C";
const accentColorComplimentary = "#1DB271";

export const lightTheme: ThemeColors = {
  surface: "#EAF0F7",
  surfaceAlt: "#DCE4EE",
  surfaceSolid: "#E3EAF3",
  surfaceGlass: "rgba(255, 255, 255, 0.56)",
  surfaceGlassStrong: "rgba(255, 255, 255, 0.74)",
  overlay: "rgba(16, 24, 40, 0.44)",
  strokeSubtle: "rgba(255, 255, 255, 0.54)",
  textPrimary: "#222A35",
  textSecondary: "#5B6574",
  accent: accentColor,
  shadowLight: "rgba(255,255,255,0.9)",
  shadowDark: "rgba(143, 158, 182, 0.38)",
  shadowSoft: "rgba(51, 69, 96, 0.22)",
  focusRing: "#3B82F6",
  status: {
    success: "#26A864",
    warning: "#D98F18",
    danger: "#D35252",
    info: "#4284F2",
  },
  primary: {
    background: accentColor,
    text: "#ffffff",
    button: accentColor,
  },
  secondary: {
    background: "#C8D0DB",
    text: "#222A35",
    button: "#B9C3CF",
  },
  success: {
    background: "#2FAD70",
    text: "#ffffff",
    button: "#27965F",
  },
  danger: {
    background: "#DF5A5A",
    text: "#ffffff",
    button: "#C84A4A",
    card: "#B13B3B",
  },
  warning: {
    background: "#F1B447",
    text: "#ffffff",
    button: "#DC9E33",
  },
  info: {
    background: "#4C8BF5",
    text: "#ffffff",
    button: "#3E76D1",
    card: "#2F5FB5",
  },
  light: {
    background: "#F4F7FB",
    text: "#222A35",
    button: "#E7EDF5",
  },
  dark: {
    background: "#1F2630",
    text: "#F4F7FB",
    button: "#1A2029",
  },
  background: {
    default: "#E7EDF5",
    text: "#222A35",
    paper: "#E7EDF5",
    gradient: ["#ECF1F8", "#E7EDF5"],
  },
  disabled: {
    background: "#D0D8E3",
    text: "#909AA8",
    button: "#C3CCD8",
  },
  input: {
    background: "#DFE7F0",
    text: "#222A35",
    button: "#D8E0EA",
  },
  gradient: [accentColor, accentColorComplimentary],
  transparent: "transparent",
  outlinedButtonText: accentColor,
  card: ["#EEF3FA", "#E7EDF6", "#DFE7F1"],
};

export const darkTheme: ThemeColors = {
  surface: "#1A2431",
  surfaceAlt: "#222F3D",
  surfaceSolid: "#1F2A39",
  surfaceGlass: "rgba(38, 53, 73, 0.56)",
  surfaceGlassStrong: "rgba(40, 56, 78, 0.76)",
  overlay: "rgba(2, 8, 17, 0.68)",
  strokeSubtle: "rgba(222, 234, 250, 0.14)",
  textPrimary: "#F3F7FF",
  textSecondary: "#B8C5D6",
  accent: accentColor,
  shadowLight: "rgba(50, 66, 86, 0.62)",
  shadowDark: "rgba(3, 8, 18, 0.84)",
  shadowSoft: "rgba(4, 11, 22, 0.74)",
  focusRing: "#5E9BFF",
  status: {
    success: "#39CE7E",
    warning: "#F2B94E",
    danger: "#F06A6A",
    info: "#69A3FF",
  },
  primary: {
    background: accentColor,
    text: "#122017",
    button: accentColor,
  },
  secondary: {
    background: "#3A4554",
    text: "#F7FAFF",
    button: "#303A47",
  },
  success: {
    background: "#35BC7A",
    text: "#062112",
    button: "#2EA96D",
  },
  danger: {
    background: "#E86666",
    text: "#ffffff",
    button: "#D45454",
  },
  warning: {
    background: "#F0B755",
    text: "#251C08",
    button: "#DEA445",
  },
  info: {
    background: "#5E97F8",
    text: "#ffffff",
    button: "#4D84E5",
    card: "#426FD4",
  },
  light: {
    background: "#242F3E",
    text: "#F7FAFF",
    button: "#2A3646",
  },
  dark: {
    background: "#0D141D",
    text: "#F7FAFF",
    button: "#121B26",
  },
  background: {
    default: "#121A24",
    text: "#F3F7FF",
    paper: "#121A24",
    gradient: ["#1A2431", "#121A24", "#0E151E"],
  },
  disabled: {
    background: "#2A3544",
    text: "#8A97AA",
    button: "#242E3B",
  },
  input: {
    background: "#1E2835",
    text: "#F3F7FF",
    button: "#202D3B",
  },
  gradient: [accentColor, accentColorComplimentary],
  transparent: "transparent",
  outlinedButtonText: "#63D68E",
  card: ["#1D2836", "#172230", "#141D2A"],
};

export const blushLightTheme: ThemeColors = {
  ...lightTheme,
  surface: "#F8EDEA",
  surfaceAlt: "#EFDAD6",
  surfaceSolid: "#F2E4E1",
  surfaceGlass: "rgba(255, 247, 245, 0.62)",
  surfaceGlassStrong: "rgba(255, 247, 245, 0.8)",
  textPrimary: "#4E3A37",
  textSecondary: "#8C6A66",
  accent: "#E68D82",
  shadowLight: "rgba(255, 255, 255, 0.78)",
  shadowDark: "rgba(178, 132, 124, 0.4)",
  shadowSoft: "rgba(170, 112, 102, 0.2)",
  focusRing: "#C46F64",
  status: {
    success: "#52B67D",
    warning: "#D68E42",
    danger: "#D96C6C",
    info: "#C87B70",
  },
  primary: {
    background: "#E68D82",
    text: "#ffffff",
    button: "#E68D82",
  },
  secondary: {
    background: "#E9C9C4",
    text: "#4E3A37",
    button: "#E2B9B3",
  },
  background: {
    default: "#F4DCD7",
    text: "#4E3A37",
    paper: "#F4DCD7",
    gradient: ["#F6E1DC", "#F2D7D2"],
  },
  input: {
    background: "#EFD6D1",
    text: "#4E3A37",
    button: "#E7C7C1",
  },
  gradient: ["#F2A49A", "#E58379"],
  outlinedButtonText: "#E68D82",
  card: ["#FAF1EE", "#F6E5E1", "#F2D9D4"],
};

export const blushDarkTheme: ThemeColors = {
  ...darkTheme,
  surface: "#2A2121",
  surfaceAlt: "#221919",
  surfaceSolid: "#271E1E",
  surfaceGlass: "rgba(52, 39, 39, 0.62)",
  surfaceGlassStrong: "rgba(52, 39, 39, 0.78)",
  textPrimary: "#F7ECEA",
  textSecondary: "#CBAEAA",
  accent: "#E89A90",
  shadowLight: "rgba(77, 56, 56, 0.58)",
  shadowDark: "rgba(17, 10, 10, 0.84)",
  shadowSoft: "rgba(14, 8, 8, 0.72)",
  focusRing: "#E8AAA1",
  status: {
    success: "#6EC790",
    warning: "#E5A25D",
    danger: "#DB7F7F",
    info: "#D98B80",
  },
  primary: {
    background: "#E89A90",
    text: "#1E1515",
    button: "#E89A90",
  },
  secondary: {
    background: "#3A2C2C",
    text: "#F7ECEA",
    button: "#302424",
  },
  background: {
    default: "#201818",
    text: "#F7ECEA",
    paper: "#201818",
    gradient: ["#231B1B", "#1E1616", "#1C1414"],
  },
  input: {
    background: "#241B1B",
    text: "#F7ECEA",
    button: "#2B2020",
  },
  gradient: ["#EAA49A", "#D87A70"],
  outlinedButtonText: "#E89A90",
  card: ["#2D2323", "#261D1D", "#221A1A"],
};

const buildNavigationTheme = (
  baseTheme: Theme,
  appColors: ThemeColors,
): Theme => ({
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    primary: appColors.accent,
    background: appColors.background.default,
    card: appColors.surface,
    text: appColors.textPrimary,
    border: appColors.strokeSubtle,
    notification: appColors.accent,
  },
});

export const CustomLightTheme: Theme = buildNavigationTheme(
  DefaultTheme,
  lightTheme,
);

export const CustomDarkTheme: Theme = buildNavigationTheme(DarkTheme, darkTheme);
