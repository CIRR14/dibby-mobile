import { ColorSchemeName } from "react-native";
import useColorScheme from "./useColorScheme";
import {
  blushDarkTheme,
  blushLightTheme,
  darkTheme,
  lightTheme,
  ThemeColors,
} from "../constants/Colors";

export type AppThemeVariant = "default" | "blush";

const themeMap: Record<
  AppThemeVariant,
  { light: ThemeColors; dark: ThemeColors }
> = {
  default: {
    light: lightTheme,
    dark: darkTheme,
  },
  blush: {
    light: blushLightTheme,
    dark: blushDarkTheme,
  },
};

export const getAppTheme = (
  scheme: ColorSchemeName,
  variant: AppThemeVariant = "default"
): ThemeColors => {
  const mode = scheme === "dark" ? "dark" : "light";
  return themeMap[variant][mode];
};

const useAppTheme = (variant: AppThemeVariant = "default"): ThemeColors => {
  const scheme = useColorScheme();
  return getAppTheme(scheme, variant);
};

export default useAppTheme;
