import React from "react";
import { Pressable, ViewStyle } from "react-native";

import NeumoSurface from "./NeumoSurface";
import {
  NeumoTokens,
  NeumoTone,
  NeumoVariant,
  resolveNeumoVariant,
} from "../constants/Neumo";

interface NeumoPressableProps {
  onPress?: () => void;
  disabled?: boolean;
  unstyled?: boolean;
  variant?: NeumoVariant;
  tone?: NeumoTone;
  radius?: number;
  padding?: number;
  gradient?: boolean;
  gradientColors?: string[];
  strokeIntensity?: "none" | "subtle" | "strong";
  style?: ViewStyle | ViewStyle[];
  containerStyle?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

const NeumoPressable: React.FC<NeumoPressableProps> = ({
  onPress,
  disabled,
  unstyled = false,
  variant = "raised",
  tone = "surface",
  radius = NeumoTokens.radius.md,
  padding = NeumoTokens.spacing.md,
  gradient,
  gradientColors,
  strokeIntensity,
  style,
  containerStyle,
  children,
}) => {
  const resolvedVariant = resolveNeumoVariant(variant);

  const getPressedVariant = (pressed: boolean): NeumoVariant => {
    if (!pressed || disabled) {
      return resolvedVariant;
    }
    if (resolvedVariant === "inset") {
      return "solid";
    }
    if (resolvedVariant === "solid") {
      return "inset";
    }
    return "inset";
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        {
          opacity: disabled ? 0.62 : 1,
          minHeight: NeumoTokens.touch.minTarget,
          justifyContent: "center",
        },
        unstyled ? (style as any) : null,
        pressed && !disabled ? { transform: [{ scale: 0.985 }] } : null,
        containerStyle as any,
      ]}
    >
      {({ pressed }) =>
        unstyled ? (
          <>{children}</>
        ) : (
          <NeumoSurface
            variant={getPressedVariant(pressed)}
            tone={tone}
            radius={radius}
            padding={padding}
            gradient={gradient}
            gradientColors={gradientColors}
            strokeIntensity={strokeIntensity}
            style={[style]}
          >
            {children}
          </NeumoSurface>
        )
      }
    </Pressable>
  );
};

export default NeumoPressable;
