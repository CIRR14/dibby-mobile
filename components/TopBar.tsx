import { StyleSheet, Text, View } from "react-native";
import React, { JSXElementConstructor, ReactElement } from "react";
import { ThemeColors } from "../constants/Colors";
import NeumoSurface from "./NeumoSurface";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";

interface ITopBarProps {
  title: string;
  leftButton?: string | ReactElement<{}, string | JSXElementConstructor<any>>;
  rightButton?: string | ReactElement<{}, string | JSXElementConstructor<any>>;
}

const TopBar: React.FC<ITopBarProps> = ({ title, leftButton, rightButton }) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);

  return (
    <NeumoSurface
      variant="solid"
      tone="base"
      radius={NeumoTokens.radius.lg}
      padding={NeumoTokens.spacing.sm}
      style={styles.container}
    >
      <View style={[styles.innerContainer, styles.leftContainer]}>
        {leftButton}
      </View>
      <View style={[styles.innerContainer, styles.middleContainer]}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={[styles.innerContainer, styles.rightContainer]}>
        {rightButton}
      </View>
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
    title: {
      color: colors.textPrimary,
      textTransform: "capitalize",
      fontSize: Typography.size.lg,
      flexWrap: "wrap",
      fontWeight: Typography.weight.bold as any,
      textAlign: "center",
      overflow: "hidden",
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
