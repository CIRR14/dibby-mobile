import { StatusBar } from "expo-status-bar";

import useCachedResources from "./hooks/useCachedResources";
import useColorScheme from "./hooks/useColorScheme";
import Navigation from "./navigation";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import React from "react";
import { AutocompleteDropdownContextProvider } from "react-native-autocomplete-dropdown";

export default function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();

  if (!isLoadingComplete) {
    return <Text>Not yet loaded</Text>;
  } else {
    return (
      <AutocompleteDropdownContextProvider>
        <SafeAreaProvider>
          <StatusBar />
          <Navigation colorScheme={colorScheme} />
        </SafeAreaProvider>
      </AutocompleteDropdownContextProvider>
    );
  }
}
