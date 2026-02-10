import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import useAppTheme from "../hooks/useAppTheme";
import { ThemeColors } from "../constants/Colors";
import NeumoSurface from "./NeumoSurface";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import DibbyButton from "./DibbyButton";
import DibbyLoading from "./DibbyLoading";

export type ScreenStateStatus = "loading" | "empty" | "error" | "ready";

interface ScreenStateProps {
  status: ScreenStateStatus;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
  empty?: React.ReactNode;
  error?: React.ReactNode;
  loading?: React.ReactNode;
  containerStyle?: ViewStyle;
}

const ScreenState: React.FC<ScreenStateProps> = ({
  status,
  title,
  description,
  actionLabel,
  onAction,
  children,
  empty,
  error,
  loading,
  containerStyle,
}) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);

  if (status === "ready") {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <View style={[styles.center, containerStyle]}>
        {loading || <DibbyLoading />}
      </View>
    );
  }

  const fallback = status === "error" ? error : empty;

  if (fallback) {
    return <View style={[styles.center, containerStyle]}>{fallback}</View>;
  }

  return (
    <View style={[styles.center, containerStyle]}>
      <NeumoSurface
        variant="raised"
        tone="surface"
        radius={NeumoTokens.radius.lg}
        style={styles.card}
      >
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
        {actionLabel && onAction && (
          <DibbyButton title={actionLabel} onPress={onAction} fullWidth />
        )}
      </NeumoSurface>
    </View>
  );
};

export default ScreenState;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    card: {
      width: "100%",
      maxWidth: 420,
      gap: 12,
      alignItems: "center",
      padding: 16,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.size.lg,
      fontWeight: Typography.weight.semibold as any,
      textAlign: "center",
    },
    description: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      textAlign: "center",
    },
  });
