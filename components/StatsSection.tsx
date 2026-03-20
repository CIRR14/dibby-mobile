import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ThemeColors } from "../constants/Colors";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";
import { StatItem } from "../helpers/StatsHelpers";
import StatsGrid from "./StatsGrid";
import NeumoPressable from "./NeumoPressable";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

interface StatsSectionProps {
  title?: string;
  compactItems: StatItem[];
  fullItems: StatItem[];
  compactColumns?: number;
  expandedColumns?: number;
  defaultExpanded?: boolean;
  maxExpandedItems?: number;
}

const StatsSection: React.FC<StatsSectionProps> = ({
  title,
  compactItems,
  fullItems,
  compactColumns = 2,
  expandedColumns = 2,
  defaultExpanded = false,
  maxExpandedItems = 2,
}) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showAll, setShowAll] = useState(false);
  const compactIds = new Set(
    compactItems.map((item) => item.id).filter(Boolean) as string[],
  );
  const extraItems = fullItems.filter(
    (item) => !item.id || !compactIds.has(item.id),
  );
  const hasMore = extraItems.length > 0;
  const effectiveMax = maxExpandedItems > 0 ? maxExpandedItems : extraItems.length;
  const hasOverflow = extraItems.length > effectiveMax;
  const visibleExtraItems = expanded
    ? showAll
      ? extraItems
      : extraItems.slice(0, effectiveMax)
    : [];
  const remainingCount = expanded
    ? Math.max(extraItems.length - visibleExtraItems.length, 0)
    : 0;

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      if (!next) {
        setShowAll(false);
      }
      return next;
    });
  };

  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <StatsGrid items={compactItems} columns={compactColumns} />
      {hasMore && (
        <NeumoPressable
          variant="solid"
          tone="base"
          radius={NeumoTokens.radius.pill}
          padding={NeumoTokens.control.pill.padding}
          onPress={toggleExpanded}
          containerStyle={styles.toggleContainer}
          style={styles.toggleButton}
        >
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>
              {expanded ? "Hide insights" : "View insights"}
            </Text>
            <FontAwesomeIcon
              icon={expanded ? faChevronUp : faChevronDown}
              size={12}
              color={colors.textSecondary}
            />
          </View>
        </NeumoPressable>
      )}
      {expanded && (
        <View style={styles.expanded}>
          <StatsGrid items={visibleExtraItems} columns={expandedColumns} />
          {hasOverflow && (
            <NeumoPressable
              variant="flat"
              tone="base"
              radius={NeumoTokens.radius.pill}
              padding={NeumoTokens.control.pill.padding}
              onPress={() => setShowAll((prev) => !prev)}
              containerStyle={styles.moreToggleContainer}
              style={styles.moreToggleButton}
            >
              <Text style={styles.moreText}>
                {showAll ? "Show fewer insights" : `Show all insights (+${remainingCount})`}
              </Text>
            </NeumoPressable>
          )}
        </View>
      )}
    </View>
  );
};

export default StatsSection;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: 10,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
    },
    toggleContainer: {
      alignSelf: "center",
    },
    toggleButton: {
      paddingHorizontal: NeumoTokens.control.pill.paddingHorizontal,
      minHeight: NeumoTokens.control.pill.minHeight,
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    toggleText: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    expanded: {
      marginTop: 4,
      gap: 8,
    },
    moreToggleContainer: {
      alignSelf: "center",
    },
    moreToggleButton: {
      minHeight: NeumoTokens.control.pill.minHeight,
      paddingHorizontal: NeumoTokens.control.pill.paddingHorizontal,
    },
    moreText: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      fontWeight: Typography.weight.semibold as any,
    },
  });
