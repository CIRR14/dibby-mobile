import { StatusBar } from "expo-status-bar";

import useCachedResources from "./hooks/useCachedResources";
import Navigation from "./navigation";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import React from "react";
import { AutocompleteDropdownContextProvider } from "react-native-autocomplete-dropdown";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

export default function App() {
  const isLoadingComplete = useCachedResources();

  if (!isLoadingComplete) {
    return <Text></Text>;
  } else {
    return (
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    );
  }
}

const AppShell = () => {
  const { scheme } = useTheme();
  return (
    <AutocompleteDropdownContextProvider>
      <SafeAreaProvider>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <Navigation />
      </SafeAreaProvider>
    </AutocompleteDropdownContextProvider>
  );
};
