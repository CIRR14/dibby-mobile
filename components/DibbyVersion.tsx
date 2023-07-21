import React from "react";
import { View, Text, Platform } from "react-native";
import { REACT_APP_VERSION } from "@env";
import { useTheme } from "@react-navigation/native";
import { ColorTheme, ThemeColors } from "../constants/Colors";

const DibbyVersion: React.FC<{ bottom: number }> = ({ bottom = 0 }) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  return (
    <View
      style={{
        position: "absolute",
        bottom: bottom,
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
