import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { FloatingTabBar } from "../constants/Neumo";
import useResponsiveLayout from "../hooks/useResponsiveLayout";
import useAppTheme from "../hooks/useAppTheme";
import { ThemeColors } from "../constants/Colors";

interface ScreenLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  contentStyle?: ViewStyle | ViewStyle[];
  withBottomNavSpacing?: boolean;
  withHorizontalPadding?: boolean;
}

const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  style,
  contentStyle,
  withBottomNavSpacing = false,
  withHorizontalPadding = true,
}) => {
  const colors = useAppTheme();
  const layout = useResponsiveLayout();
  const styles = makeStyles(colors as unknown as ThemeColors, layout.gutter);

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.content,
          {
            maxWidth: layout.contentMaxWidth,
            paddingHorizontal: withHorizontalPadding ? layout.gutter : 0,
            paddingBottom: withBottomNavSpacing ? FloatingTabBar.spacer : 0,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

export default ScreenLayout;

const makeStyles = (colors: ThemeColors, gutter: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: "100%",
      alignItems: "center",
      backgroundColor: colors.background.default,
      overflow: "visible",
    },
    content: {
      width: "100%",
      flex: 1,
      overflow: "visible",
      paddingTop: 0,
    },
  });
