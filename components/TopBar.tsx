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
      variant="flat"
      tone="base"
      radius={NeumoTokens.radius.lg}
      padding={NeumoTokens.spacing.md}
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
      width: "25%",
    },
    leftContainer: {
      alignItems: "flex-start",
    },
    middleContainer: {
      alignItems: "center",
      width: "50%",
    },
    rightContainer: {
      alignItems: "flex-end",
    },
  });
