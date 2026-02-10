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
  size?: "sm" | "md" | "lg";
}

const DibbyButton: React.FC<IButtonProps> = ({
  onPress,
  title,
  type = "solid",
  disabled,
  add,
  fullWidth = false,
  size = "md",
}) => {
  const colors = useAppTheme();
  const sizeConfig = {
    sm: {
      padding: NeumoTokens.control.button.sm.padding,
      minHeight: NeumoTokens.control.button.sm.minHeight,
      fontSize: Typography.size.sm,
    },
    md: {
      padding: NeumoTokens.control.button.md.padding,
      minHeight: NeumoTokens.control.button.md.minHeight,
      fontSize: Typography.size.md,
    },
    lg: {
      padding: NeumoTokens.control.button.lg.padding,
      minHeight: NeumoTokens.control.button.lg.minHeight,
      fontSize: Typography.size.lg,
    },
  } as const;
  const resolvedSize = sizeConfig[size];
  const styles = makeStyles(
    colors as unknown as ThemeColors,
    type,
    fullWidth,
    resolvedSize.minHeight,
    resolvedSize.fontSize,
  );
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
      padding={add ? NeumoTokens.spacing.sm : resolvedSize.padding}
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
  minHeight = 40,
  fontSize = Typography.size.md,
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
    addButton: {},
    button: {},
    content: {
      alignItems: "center",
      justifyContent: "center",
      minHeight,
    },
    buttonText: {
      color: type === "clear" ? colors.accent : colors.textPrimary,
      fontWeight: Typography.weight.semibold as any,
      fontSize,
      textTransform: "uppercase",
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonTextDisabled: {
      color: colors.disabled.text,
    },
  });
