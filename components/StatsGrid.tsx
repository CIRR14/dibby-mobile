import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ThemeColors } from "../constants/Colors";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";
import NeumoSurface from "./NeumoSurface";
import { StatItem, StatTone } from "../helpers/StatsHelpers";

interface StatsGridProps {
  items: StatItem[];
  columns?: number;
}

const resolveToneColor = (colors: ThemeColors, tone?: StatTone) => {
  switch (tone) {
    case "success":
      return colors.success.background;
    case "danger":
      return colors.danger.background;
    case "accent":
      return colors.accent;
    case "info":
      return colors.info.background;
    default:
      return colors.textPrimary;
  }
};

const StatsGrid: React.FC<StatsGridProps> = ({ items, columns = 2 }) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const basis =
    columns <= 1 ? "100%" : `${Math.max(44, 100 / columns - 2)}%`;

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <NeumoSurface
          key={item.id || `${item.label}-${item.value}`}
          variant="flat"
          tone="surface"
          radius={NeumoTokens.radius.md}
          padding={NeumoTokens.spacing.sm}
          style={[styles.card, { flexBasis: basis }]}
        >
          <Text style={styles.label}>{item.label}</Text>
          <Text
            style={[
              styles.value,
              { color: resolveToneColor(colors as ThemeColors, item.tone) },
            ]}
          >
            {item.value}
          </Text>
          {item.helper ? <Text style={styles.helper}>{item.helper}</Text> : null}
        </NeumoSurface>
      ))}
    </View>
  );
};

export default StatsGrid;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: NeumoTokens.spacing.sm,
    },
    card: {
      flexGrow: 1,
      minWidth: 140,
    },
    label: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    value: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
      marginTop: 4,
    },
    helper: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      marginTop: 2,
    },
  });
