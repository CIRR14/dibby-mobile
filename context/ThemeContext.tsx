import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ColorSchemeName } from "react-native";
import useColorScheme from "../hooks/useColorScheme";

export type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  themeMode: ThemeMode;
  scheme: ColorSchemeName;
  setThemeMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = "dibby-theme-mode";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    systemScheme === "dark" ? "dark" : "light",
  );
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!mounted) {
          return;
        }
        if (stored === "light" || stored === "dark") {
          setThemeModeState(stored);
        }
      })
      .finally(() => {
        if (mounted) {
          setHasLoaded(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, themeMode).catch(() => null);
  }, [themeMode, hasLoaded]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const value = useMemo(
    () => ({
      themeMode,
      scheme: themeMode,
      setThemeMode,
    }),
    [themeMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  const fallbackScheme = useColorScheme();
  if (!context) {
    return {
      themeMode: fallbackScheme === "dark" ? "dark" : "light",
      scheme: fallbackScheme,
      setThemeMode: () => null,
    };
  }
  return context;
};
