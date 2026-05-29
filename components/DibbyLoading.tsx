import React from "react";
import { View, ActivityIndicator } from "react-native";
import useAppTheme from "../hooks/useAppTheme";

const DibbyLoading: React.FC = () => {
  const colors = useAppTheme();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        position: "absolute",
        height: "100%",
        width: "100%",
        zIndex: 3000,
        backgroundColor: "rgba(0,0,0,0.15)",
        alignItems: "center",
      }}
    >
      <View>
        <ActivityIndicator size="large" color={colors.primary.background} />
      </View>
    </View>
  );
};

export default DibbyLoading;
