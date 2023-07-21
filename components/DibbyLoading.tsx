import { useTheme } from "@react-navigation/native";
import React from "react";
import { View, ActivityIndicator } from "react-native";
import { ColorTheme } from "../constants/Colors";

const DibbyLoading: React.FC = () => {
  const { colors } = useTheme() as unknown as ColorTheme;
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        position: "absolute",
        height: "100%",
        width: "100%",
        zIndex: 3000,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary.background} />
    </View>
  );
};

export default DibbyLoading;
