import React from "react";
import { View, Text, Platform } from "react-native";
import { REACT_APP_VERSION } from "@env";
import { useTheme } from "@react-navigation/native";
import { ColorTheme, ThemeColors } from "../constants/Colors";

const DibbyVersion = () => {
  const { colors } = useTheme() as unknown as ColorTheme;
  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        width: "100%",
        alignItems: "center",
        zIndex: 1999,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          color: colors.background.text,
        }}
      >
        {Platform.OS === "web"
          ? process.env.REACT_APP_VERSION
          : REACT_APP_VERSION}
      </Text>
    </View>
  );
};

export default DibbyVersion;
