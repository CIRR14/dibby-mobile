import React from "react";
import { Platform, View, ViewStyle, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import {
  getNeumoShadow,
  getSurfaceColor,
  NeumoTokens,
  NeumoTone,
  NeumoVariant,
  resolveNeumoVariant,
} from "../constants/Neumo";
import useAppTheme from "../hooks/useAppTheme";

interface NeumoSurfaceProps {
  children?: React.ReactNode;
  variant?: NeumoVariant;
  tone?: NeumoTone;
  radius?: number;
  padding?: number;
  clipContent?: boolean;
  gradient?: boolean;
  gradientColors?: string[];
  strokeIntensity?: "none" | "subtle" | "strong";
  style?: ViewStyle | ViewStyle[];
  pointerEvents?: "auto" | "none" | "box-none" | "box-only";
}

const NeumoSurface: React.FC<NeumoSurfaceProps> = ({
  children,
  variant = "raised",
  tone = "surface",
  radius = NeumoTokens.radius.md,
  padding = NeumoTokens.spacing.md,
  clipContent,
  gradient,
  gradientColors,
  strokeIntensity,
  style,
  pointerEvents,
}) => {
  const colors = useAppTheme();
  const resolvedVariant = resolveNeumoVariant(variant);
  const isGlass =
    resolvedVariant === "glass" || resolvedVariant === "glass-strong";
  const backgroundColor = isGlass
    ? resolvedVariant === "glass-strong"
      ? colors.surfaceGlassStrong
      : colors.surfaceGlass
    : getSurfaceColor(colors as any, tone);
  const borderMode =
    strokeIntensity ??
    (resolvedVariant === "inset"
      ? "strong"
      : isGlass
      ? "subtle"
      : "none");
  const borderStyle =
    borderMode === "none"
      ? { borderWidth: 0, borderColor: "transparent" }
      : borderMode === "strong"
      ? { borderWidth: 1, borderColor: colors.strokeSubtle }
      : { borderWidth: Platform.OS === "web" ? 1 : 0.6, borderColor: colors.strokeSubtle };
  const shouldUseGradient =
    gradient ??
    ((resolvedVariant === "glass-strong" || resolvedVariant === "glass") &&
      tone === "surface");
  const resolvedGradientColors =
    gradientColors ??
    (tone === "accent"
      ? colors.gradient
      : resolvedVariant === "glass-strong"
      ? [colors.surfaceGlassStrong, colors.surface]
      : [colors.surfaceGlass, colors.surface]);
  const Container: any = shouldUseGradient ? LinearGradient : View;
  const shouldClipContent = clipContent ?? shouldUseGradient;
  const containerProps = shouldUseGradient
    ? {
        colors: resolvedGradientColors,
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
      }
    : {};
  const normalizeChildren = (child: React.ReactNode): React.ReactNode => {
    if (typeof child === "string" || typeof child === "number") {
      const content = String(child);
      if (!content.trim()) {
        return null;
      }
      return <Text style={{ color: colors.textPrimary }}>{content}</Text>;
    }

    if (Array.isArray(child)) {
      return child.map((item) => normalizeChildren(item));
    }

    if (!React.isValidElement(child)) {
      return child;
    }

    if (child.type === React.Fragment) {
      return (
        <React.Fragment>
          {React.Children.map(child.props.children, normalizeChildren)}
        </React.Fragment>
      );
    }

    return child;
  };

  const safeChildren = React.Children.map(children, normalizeChildren);

  return (
    <Container
      {...containerProps}
      pointerEvents={pointerEvents}
      style={[
        {
          backgroundColor,
          borderRadius: radius,
          padding,
          ...borderStyle,
          ...(shouldClipContent ? { overflow: "hidden" } : { overflow: "visible" }),
          ...(Platform.OS === "web" && isGlass
            ? ({
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
              } as any)
            : {}),
        },
        getNeumoShadow(colors as any, resolvedVariant),
        style,
      ]}
    >
      {safeChildren}
    </Container>
  );
};

export default NeumoSurface;
