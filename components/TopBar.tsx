import { StyleSheet, Text, View } from "react-native";
import React, { JSXElementConstructor, ReactElement } from "react";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useTheme } from "@react-navigation/native";

interface ITopBarProps {
  title: string;
  leftButton?: string | ReactElement<{}, string | JSXElementConstructor<any>>;
  rightButton?: string | ReactElement<{}, string | JSXElementConstructor<any>>;
}

const TopBar: React.FC<ITopBarProps> = ({ title, leftButton, rightButton }) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors);

  return (
    <View style={styles.container}>
      <View style={[styles.innerContainer, styles.leftContainer]}>
        {leftButton}
      </View>
      <View style={[styles.innerContainer, styles.middleContainer]}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={[styles.innerContainer, styles.rightContainer]}>
        {rightButton}
      </View>
    </View>
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
      color: colors.background.text,
      textTransform: "capitalize",
      fontSize: 22,
      flexWrap: "wrap",
      fontWeight: "bold",
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
