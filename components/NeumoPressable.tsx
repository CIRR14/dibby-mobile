import React from "react";
import { Pressable, ViewStyle } from "react-native";

import NeumoSurface from "./NeumoSurface";
import { NeumoTokens, NeumoTone, NeumoVariant } from "../constants/Neumo";

interface NeumoPressableProps {
  onPress?: () => void;
  disabled?: boolean;
  variant?: NeumoVariant;
  tone?: NeumoTone;
  radius?: number;
  padding?: number;
  gradient?: boolean;
  gradientColors?: string[];
  style?: ViewStyle | ViewStyle[];
  containerStyle?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

const NeumoPressable: React.FC<NeumoPressableProps> = ({
  onPress,
  disabled,
  variant = "raised",
  tone = "surface",
  radius = NeumoTokens.radius.md,
  padding = NeumoTokens.spacing.md,
  gradient,
  gradientColors,
  style,
  containerStyle,
  children,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={containerStyle}
    >
      {({ pressed }) => (
        <NeumoSurface
          variant={
            variant === "flat"
              ? "flat"
              : pressed && !disabled
              ? variant === "raised"
                ? "inset"
                : "raised"
              : variant
          }
          tone={tone}
          radius={radius}
          padding={padding}
          gradient={gradient}
          gradientColors={gradientColors}
          style={[
            pressed && !disabled ? { transform: [{ scale: 0.98 }] } : null,
            style,
          ]}
        >
          {children}
        </NeumoSurface>
      )}
    </Pressable>
  );
};

export default NeumoPressable;
