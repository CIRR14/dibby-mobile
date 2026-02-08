import React from "react";
import { View, Text, Platform } from "react-native";
import { REACT_APP_VERSION } from "@env";
import useAppTheme from "../hooks/useAppTheme";

const DibbyVersion: React.FC<{ bottom?: number }> = ({ bottom = 0 }) => {
  const colors = useAppTheme();
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
          color: colors.accent,
          opacity: 0.8,
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
