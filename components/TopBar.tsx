import { Platform, StyleSheet, Text, View } from "react-native";
import React, { JSXElementConstructor, ReactElement } from "react";
import { ThemeColors } from "../constants/Colors";
import NeumoSurface from "./NeumoSurface";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";
import { changeOpacity } from "../helpers/GenerateColor";

interface ITopBarProps {
  title: string;
  leftButton?: string | ReactElement<{}, string | JSXElementConstructor<any>>;
  rightButton?: string | ReactElement<{}, string | JSXElementConstructor<any>>;
  withSurface?: boolean;
}

const TopBar: React.FC<ITopBarProps> = ({
  title,
  leftButton,
  rightButton,
  withSurface = true,
}) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const renderSlot = (
    content?: string | ReactElement<{}, string | JSXElementConstructor<any>>,
  ) => {
    if (content == null) {
      return null;
    }

    if (typeof content === "string") {
      const trimmed = content.trim();
      if (!trimmed) {
        return null;
      }
      return <Text style={styles.slotText}>{trimmed}</Text>;
    }

    return content;
  };

  const content = (
    <>
      <View style={[styles.innerContainer, styles.leftContainer]}>
        {renderSlot(leftButton)}
      </View>
      <View style={[styles.innerContainer, styles.middleContainer]}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={[styles.innerContainer, styles.rightContainer]}>
        {renderSlot(rightButton)}
      </View>
    </>
  );

  if (!withSurface) {
    return (
      <NeumoSurface
        variant="glass-strong"
        tone="surface"
        radius={NeumoTokens.radius.lg}
        padding={NeumoTokens.spacing.sm}
        style={[styles.container, styles.containerFlatBlur, styles.containerFloating]}
        gradient={false}
        strokeIntensity="none"
      >
        {content}
      </NeumoSurface>
    );
  }

  return (
    <NeumoSurface
      variant="glass"
      tone="surface"
      radius={NeumoTokens.radius.lg}
      padding={NeumoTokens.spacing.sm}
      style={styles.container}
    >
      {content}
    </NeumoSurface>
  );
};

export default TopBar;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 64,
      justifyContent: "space-between",
      gap: 8,
    },
    containerFlatBlur: {
      backgroundColor: changeOpacity(colors.surfaceGlassStrong, 0.38),
      shadowOpacity: 0,
      elevation: 0,
      paddingHorizontal: NeumoTokens.spacing.xs,
      paddingVertical: 2,
      ...(Platform.OS === "web"
        ? ({
            backdropFilter: "blur(28px) saturate(155%)",
            WebkitBackdropFilter: "blur(28px) saturate(155%)",
          } as any)
        : {}),
    },
    containerFloating: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
    },
    title: {
      color: colors.textPrimary,
      textTransform: "capitalize",
      fontSize: Typography.size.lg,
      flexWrap: "wrap",
      fontWeight: Typography.weight.bold as any,
      textAlign: "center",
      overflow: "hidden",
    },
    slotText: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
    innerContainer: {
      minHeight: 36,
      justifyContent: "center",
    },
    leftContainer: {
      alignItems: "flex-start",
      minWidth: 56,
    },
    middleContainer: {
      alignItems: "center",
      flex: 1,
      paddingHorizontal: 8,
    },
    rightContainer: {
      alignItems: "flex-end",
      minWidth: 56,
    },
  });
