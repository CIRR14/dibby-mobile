import React, { JSXElementConstructor, ReactElement } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { ThemeColors } from "../constants/Colors";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";

export type ButtonType = "solid" | "clear" | "outline" | "danger";

interface IButtonProps {
  onPress: () => void;
  title?: string | ReactElement<{}, string | JSXElementConstructor<any>>;
  type?: ButtonType;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  loading?: boolean;
  add?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}

const DibbyButton: React.FC<IButtonProps> = ({
  onPress,
  title,
  type = "solid",
  accessibilityLabel,
  accessibilityHint,
  disabled,
  loading = false,
  add,
  fullWidth = false,
  size = "md",
}) => {
  const colors = useAppTheme();
  const resolvedType = type;
  const isIconOnly = !add && title !== undefined && typeof title !== "string";
  const effectiveSize: "sm" | "md" | "lg" =
    resolvedType === "clear" && isIconOnly && size === "md" ? "sm" : size;
  const sizeConfig = NeumoTokens.control.button[effectiveSize];
  const controlMinHeight =
    add
      ? 56
      : resolvedType === "clear" && isIconOnly
      ? 36
      : sizeConfig.minHeight;
  const controlPaddingHorizontal =
    resolvedType === "clear" && isIconOnly ? 6 : sizeConfig.paddingHorizontal;
  const styles = makeStyles(
    colors as unknown as ThemeColors,
    controlMinHeight,
    effectiveSize,
  );

  const isDisabled = disabled || loading;
  const resolvedAccessibilityLabel =
    accessibilityLabel ?? (typeof title === "string" ? title : add ? "Add" : undefined);
  const rippleColor =
    resolvedType === "solid" || resolvedType === "danger"
      ? "rgba(255,255,255,0.16)"
      : colors.strokeSubtle;
  const hitSlop =
    isIconOnly || add
      ? { top: 8, bottom: 8, left: 8, right: 8 }
      : undefined;

  const surfaceStyle =
    resolvedType === "solid"
      ? {
          backgroundColor: colors.primary.background,
          borderWidth: 0,
        }
      : resolvedType === "danger"
      ? {
          backgroundColor: colors.danger.background,
          borderWidth: 0,
        }
      : resolvedType === "outline"
      ? {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.outlinedButtonText,
        }
      : {
          backgroundColor: "transparent",
          borderWidth: 0,
        };

  const textColor =
    resolvedType === "danger"
      ? colors.danger.text
      : resolvedType === "solid"
      ? colors.primary.text
      : resolvedType === "outline"
      ? colors.outlinedButtonText
      : colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={resolvedAccessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      android_ripple={{ color: rippleColor, borderless: false }}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        add ? styles.addButton : styles.button,
        !add && surfaceStyle,
        {
          minHeight: controlMinHeight,
          paddingHorizontal: add ? 0 : controlPaddingHorizontal,
          width: add ? undefined : fullWidth ? "100%" : "auto",
          opacity: isDisabled ? 0.6 : pressed ? 0.9 : 1,
          transform: !isDisabled && pressed ? [{ scale: 0.98 }] : undefined,
        },
      ]}
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
    </Pressable>
  );
};

export default DibbyButton;

const makeStyles = (
  colors: ThemeColors,
  minHeight = 48,
  size: "sm" | "md" | "lg" = "md",
) =>
  StyleSheet.create({
    addButton: {
      alignItems: "center",
      justifyContent: "center",
      width: 56,
      minHeight: 56,
      borderRadius: NeumoTokens.radius.pill,
      backgroundColor: colors.primary.background,
      overflow: "hidden",
    },
    button: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: NeumoTokens.radius.md,
      overflow: "hidden",
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
