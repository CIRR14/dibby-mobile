import React, { JSXElementConstructor, ReactElement } from "react";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Button } from "@rneui/themed";
import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";

interface IButtonProps {
  onPress: () => void;
  title?: string | ReactElement<{}, string | JSXElementConstructor<any>>;
  type?: "solid" | "clear" | "outline" | undefined;
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
  const styles = makeStyles(colors as unknown as ThemeColors, fullWidth);

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
      radius={10}
      size={"lg"}
    />
  );
};

export default DibbyButton;

const makeStyles = (colors: ThemeColors, fullWidth?: boolean) =>
  StyleSheet.create({
    buttonContainer: {
      width: fullWidth ? "100%" : "auto",
      margin: 8,
    },
    button: {
      backgroundColor: colors.primary.button,
    },
    buttonOutline: {
      borderColor: colors.primary.button,
    },
    buttonText: {
      color: colors.primary.text,
      fontWeight: "700",
      fontSize: 16,
    },
    addButton: {
      backgroundColor: colors.info.button,
      paddingVertical: 16,
    },
    addButtonContainer: {
      position: "absolute",
      bottom: 16,
      width: "100%",
      borderWidth: 2,
      borderStyle: "solid",
      borderColor: colors.info.background,
      zIndex: 2000,
    },
    buttonDisabled: {
      backgroundColor: colors.disabled.button,
      opacity: 0.5,
    },
    buttonTextDisabled: {
      color: colors.disabled.text,
    },
  });
