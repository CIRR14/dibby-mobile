import React, { JSXElementConstructor, ReactElement } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { ThemeColors } from "../constants/Colors";
import NeumoPressable from "./NeumoPressable";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";

type LegacyButtonType = "solid" | "clear" | "outline" | "danger";
type DibbyButtonTone = "primary" | "danger" | "neutral";

interface IButtonProps {
  onPress: () => void;
  title?: string | ReactElement<{}, string | JSXElementConstructor<any>>;
  type?: LegacyButtonType;
  tone?: DibbyButtonTone;
  disabled?: boolean;
  loading?: boolean;
  add?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}

const resolveTone = (type: LegacyButtonType, tone?: DibbyButtonTone) => {
  if (tone) {
    return tone;
  }
  if (type === "danger") {
    return "danger";
  }
  if (type === "clear" || type === "outline") {
    return "neutral";
  }
  return "primary";
};

const DibbyButton: React.FC<IButtonProps> = ({
  onPress,
  title,
  type = "solid",
  tone,
  disabled,
  loading = false,
  add,
  fullWidth = false,
  size = "md",
}) => {
  const colors = useAppTheme();
  const isIconOnly = !add && title !== undefined && typeof title !== "string";
  const effectiveSize: "sm" | "md" | "lg" =
    type === "clear" && isIconOnly && size === "md" ? "sm" : size;
  const resolvedTone = resolveTone(type, tone);
  const sizeConfig = NeumoTokens.control.button[effectiveSize];
  const controlMinHeight =
    add ? 56 : type === "clear" && isIconOnly ? 36 : sizeConfig.minHeight;
  const controlPaddingHorizontal =
    type === "clear" && isIconOnly ? 6 : sizeConfig.paddingHorizontal;
  const styles = makeStyles(
    colors as unknown as ThemeColors,
    fullWidth,
    controlMinHeight,
    effectiveSize,
  );

  const isDisabled = disabled || loading;
  const useGradient = resolvedTone === "primary" || resolvedTone === "danger";
  const gradientColors =
    resolvedTone === "danger"
      ? [colors.danger.background, colors.danger.button]
      : colors.gradient;
  const surfaceTone =
    type === "clear"
      ? "base"
      : resolvedTone === "danger"
      ? "danger"
      : resolvedTone === "neutral"
      ? "surface"
      : "accent";
  const surfaceVariant =
    type === "clear"
      ? "flat"
      : resolvedTone === "neutral"
      ? "glass"
      : "glass-strong";

  const textColor =
    resolvedTone === "primary"
      ? colors.primary.text
      : resolvedTone === "danger"
      ? colors.danger.text
      : type === "clear"
      ? colors.textSecondary
      : colors.textPrimary;

  return (
    <NeumoPressable
      onPress={onPress}
      disabled={isDisabled}
      tone={surfaceTone}
      variant={surfaceVariant}
      gradient={type === "clear" ? false : useGradient}
      gradientColors={type === "clear" ? undefined : gradientColors}
      radius={
        add
          ? NeumoTokens.radius.lg
          : type === "clear" && isIconOnly
          ? NeumoTokens.radius.pill
          : NeumoTokens.radius.md
      }
      padding={0}
      style={[
        add ? styles.addButton : styles.button,
        {
          minHeight: controlMinHeight,
          paddingHorizontal: add ? 0 : controlPaddingHorizontal,
        },
      ]}
      containerStyle={add ? styles.addButtonContainer : styles.buttonContainer}
      strokeIntensity={type === "clear" ? "none" : "subtle"}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={textColor}
          />
        ) : add ? (
          <FontAwesomeIcon
            icon={faCirclePlus}
            size={24}
            color={colors.primary.text}
          />
        ) : typeof title === "string" ? (
          <Text
            style={[
              styles.buttonText,
              { color: textColor },
              isDisabled && styles.buttonTextDisabled,
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
  fullWidth?: boolean,
  minHeight = 48,
  size: "sm" | "md" | "lg" = "md",
) =>
  StyleSheet.create({
    buttonContainer: {
      width: fullWidth ? "100%" : "auto",
      borderRadius: NeumoTokens.radius.md,
      minHeight,
    },
    addButtonContainer: {
      position: "absolute",
      bottom: 16,
      width: "100%",
      zIndex: 2000,
      paddingHorizontal: 16,
    },
    addButton: {
      alignItems: "center",
      justifyContent: "center",
    },
    button: {
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      minHeight,
      gap: 8,
    },
    buttonText: {
      color: colors.textPrimary,
      fontWeight: Typography.weight.semibold as any,
      fontSize:
        size === "sm"
          ? Typography.size.sm
          : size === "lg"
          ? Typography.size.md
          : Typography.size.sm,
      letterSpacing: Typography.tracking.normal,
      textTransform: "uppercase",
    },
    buttonTextDisabled: {
      color: colors.disabled.text,
    },
  });
