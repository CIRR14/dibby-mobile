import React, { JSXElementConstructor, ReactElement } from "react";
import { ThemeColors } from "../constants/Colors";
import { StyleSheet, Text, View } from "react-native";
import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import NeumoPressable from "./NeumoPressable";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";

interface IButtonProps {
  onPress: () => void;
  title?: string | ReactElement<{}, string | JSXElementConstructor<any>>;
  type?: "solid" | "clear" | "outline" | "danger";
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
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors, type, fullWidth);
  const tone =
    type === "danger"
      ? "danger"
      : type === "solid"
        ? "accent"
        : type === "clear"
          ? "base"
          : "surface";
  const variant =
    type === "outline" ? "raised" : type === "clear" ? "flat" : "raised";
  const useGradient = type === "solid";
  const gradientColors = type === "solid" ? colors.gradient : undefined;
  const textColor =
    type === "solid"
      ? colors.primary.text
      : type === "danger"
        ? colors.danger.text
        : type === "clear"
          ? colors.accent
          : colors.textPrimary;

  return (
    <NeumoPressable
      onPress={onPress}
      disabled={disabled}
      tone={tone}
      variant={variant as any}
      gradient={useGradient}
      gradientColors={gradientColors}
      radius={add ? NeumoTokens.radius.lg : NeumoTokens.radius.md}
      padding={add ? NeumoTokens.spacing.sm : NeumoTokens.spacing.md}
      style={[
        add ? styles.addButton : styles.button,
        disabled ? styles.buttonDisabled : null,
      ]}
      containerStyle={add ? styles.addButtonContainer : styles.buttonContainer}
    >
      <View style={styles.content}>
        {add ? (
          <FontAwesomeIcon
            icon={faCirclePlus}
            size={24}
            color={colors.background.text}
          />
        ) : typeof title === "string" ? (
          <Text
            style={[
              styles.buttonText,
              { color: textColor },
              disabled && styles.buttonTextDisabled,
            ]}
          >
            {title}
          </Text>
        ) : (
          title
        )}
      </View>
    </NeumoPressable>
  );
};

export default DibbyButton;

const makeStyles = (
  colors: ThemeColors,
  type: "solid" | "clear" | "outline" | "danger",
  fullWidth?: boolean,
) =>
  StyleSheet.create({
    buttonContainer: {
      width: fullWidth ? "100%" : "auto",
      borderRadius: NeumoTokens.radius.md,
    },
    addButtonContainer: {
      position: "absolute",
      bottom: 16,
      width: "100%",
      zIndex: 2000,
      paddingHorizontal: 16,
    },
    addButton: {
      backgroundColor: colors.surface,
    },
    button: {
      backgroundColor: type === "clear" ? "transparent" : colors.surface,
    },
    content: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 44,
    },
    buttonText: {
      color: type === "clear" ? colors.accent : colors.textPrimary,
      fontWeight: Typography.weight.semibold as any,
      fontSize: Typography.size.md,
      textTransform: "uppercase",
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonTextDisabled: {
      color: colors.disabled.text,
    },
  });
