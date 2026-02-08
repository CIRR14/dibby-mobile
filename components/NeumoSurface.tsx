import React from "react";
import { View, ViewStyle, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import {
  getNeumoShadow,
  getSurfaceColor,
  NeumoTokens,
  NeumoTone,
  NeumoVariant,
} from "../constants/Neumo";
import useAppTheme from "../hooks/useAppTheme";

interface NeumoSurfaceProps {
  children?: React.ReactNode;
  variant?: NeumoVariant;
  tone?: NeumoTone;
  radius?: number;
  padding?: number;
  gradient?: boolean;
  gradientColors?: string[];
  style?: ViewStyle | ViewStyle[];
  pointerEvents?: "auto" | "none" | "box-none" | "box-only";
}

const NeumoSurface: React.FC<NeumoSurfaceProps> = ({
  children,
  variant = "raised",
  tone = "surface",
  radius = NeumoTokens.radius.md,
  padding = NeumoTokens.spacing.md,
  gradient,
  gradientColors,
  style,
  pointerEvents,
}) => {
  const colors = useAppTheme();
  const backgroundColor = getSurfaceColor(colors as any, tone);
  const isInset = variant === "inset";
  const borderStyle = isInset
    ? { borderWidth: 1, borderColor: colors.shadowDark }
    : { borderWidth: 0, borderColor: "transparent" };
  const shouldUseGradient =
    gradient ?? (variant === "raised" && tone === "surface");
  const resolvedGradientColors =
    gradientColors ?? (tone === "accent" ? colors.gradient : colors.card);
  const Container: any = shouldUseGradient ? LinearGradient : View;
  const containerProps = shouldUseGradient
    ? { colors: resolvedGradientColors, start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }
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
          ...(shouldUseGradient ? { overflow: "hidden" } : {}),
        },
        getNeumoShadow(colors as any, variant),
        style,
      ]}
    >
      {safeChildren}
    </Container>
  );
};

export default NeumoSurface;
