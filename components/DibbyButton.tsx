import React, { JSXElementConstructor, ReactElement } from "react";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Button } from "@rneui/themed";
import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { LinearGradient } from "expo-linear-gradient";

interface IButtonProps {
  onPress: () => void;
  title?: string | ReactElement<{}, string | JSXElementConstructor<any>>;
  type?: "solid" | "clear" | "outline";
  disabled?: boolean;
  add?: boolean;
  fullWidth?: boolean;
}

const DibbyButton: React.FC<IButtonProps> = ({
  onPress,
  title,
  type = "solid",
  disabled,
  add,
  fullWidth = false,
}) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors, type, fullWidth);

  return (
    <Button
      type={type}
      onPress={onPress}
      title={
        add ? (
          <FontAwesomeIcon
            icon={faCirclePlus}
            size={24}
            color={colors.info.text}
          />
        ) : (
          title
        )
      }
      titleStyle={add ? {} : styles.buttonText}
      containerStyle={add ? styles.addButtonContainer : styles.buttonContainer}
      disabled={disabled}
      disabledStyle={styles.buttonDisabled}
      disabledTitleStyle={styles.buttonTextDisabled}
      buttonStyle={
        add
          ? styles.addButton
          : type === "solid"
          ? styles.button
          : type === "outline"
          ? styles.buttonOutline
          : {}
      }
      uppercase
      radius={7}
      size={"lg"}
      ViewComponent={LinearGradient}
      linearGradientProps={
        type === "solid"
          ? {
              colors: [...colors.gradient],
              start: { x: 0, y: 0.5 },
              end: { x: 1, y: 0.5 },
            }
          : {
              colors: ["transparent"],
            }
      }
    />
  );
};

export default DibbyButton;

const makeStyles = (
  colors: ThemeColors,
  type: "solid" | "clear" | "outline",
  fullWidth?: boolean
) =>
  StyleSheet.create({
    buttonContainer: {
      width: fullWidth ? "100%" : "auto",
      margin: 8,
      borderColor: colors.dark.background,
      borderWidth: type === "solid" ? 1 : 0,
      borderBottomWidth: type !== "clear" ? 4 : 0,
      borderLeftWidth: type !== "clear" ? 4 : 0,
      borderRadius: type !== "clear" ? 13 : 0,
    },
    addButtonContainer: {
      position: "absolute",
      bottom: 16,
      width: "100%",
      zIndex: 2000,
      borderWidth: 1,
      borderColor: colors.dark.background,
    },
    addButton: {
      backgroundColor: colors.info.button,
    },
    button: {
      backgroundColor: colors.primary.button,
    },
    buttonOutline: {
      borderColor: colors.primary.button,
      borderTopWidth: 1,
      borderRightWidth: 1,
      borderLeftWidth: 0,
      borderBottomWidth: 0,
    },
    buttonText: {
      color:
        type === "solid" ? colors.light.background : colors.outlinedButtonText,
      fontWeight: "700",
      fontSize: 16,
    },
    buttonDisabled: {
      backgroundColor: colors.disabled.button,
      opacity: 0.3,
    },
    buttonTextDisabled: {
      color: colors.disabled.text,
    },
  });
