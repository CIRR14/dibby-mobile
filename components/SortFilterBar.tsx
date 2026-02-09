import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ThemeColors } from "../constants/Colors";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";
import NeumoPressable from "./NeumoPressable";
import NeumoSurface from "./NeumoSurface";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faCaretDown,
  faCaretUp,
  faFilter,
  faFilterCircleXmark,
  faSort,
} from "@fortawesome/free-solid-svg-icons";

export interface SortFilterOption {
  label: string;
  value: string;
}

interface SortFilterBarProps {
  filterLabel?: string;
  sortLabel?: string;
  filterOptions: SortFilterOption[];
  sortOptions: SortFilterOption[];
  selectedFilter: string;
  selectedSort: string;
  onFilterChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

const SortFilterBar: React.FC<SortFilterBarProps> = ({
  filterLabel = "Filter",
  sortLabel = "Sort",
  filterOptions,
  sortOptions,
  selectedFilter,
  selectedSort,
  onFilterChange,
  onSortChange,
}) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const [openMenu, setOpenMenu] = useState<"filter" | "sort" | null>(null);
  const selectedFilterLabel =
    filterOptions.find((option) => option.value === selectedFilter)?.label ??
    filterOptions[0]?.label;
  const selectedSortLabel =
    sortOptions.find((option) => option.value === selectedSort)?.label ??
    sortOptions[0]?.label;

  return (
    <NeumoSurface
      variant="flat"
      tone="surface"
      radius={NeumoTokens.radius.lg}
      padding={NeumoTokens.spacing.sm}
      style={styles.container}
    >
      <View style={styles.row}>
        <NeumoPressable
          onPress={() =>
            setOpenMenu((prev) => (prev === "filter" ? null : "filter"))
          }
          variant="raised"
          tone="surface"
          radius={NeumoTokens.radius.md}
          padding={NeumoTokens.spacing.xs}
          style={styles.selector}
        >
          <View style={styles.selectorContent}>
            <Text style={styles.selectorLabel}>
              <FontAwesomeIcon
                icon={faFilterCircleXmark}
                color={colors.textSecondary}
              />
            </Text>
            <Text style={styles.selectorValue}>{selectedFilterLabel}</Text>
            <Text style={styles.selectorChevron}>
              <FontAwesomeIcon
                color={colors.textSecondary}
                icon={openMenu === "filter" ? faCaretUp : faCaretDown}
              />
            </Text>
          </View>
        </NeumoPressable>

        <NeumoPressable
          onPress={() =>
            setOpenMenu((prev) => (prev === "sort" ? null : "sort"))
          }
          variant="raised"
          tone="surface"
          radius={NeumoTokens.radius.md}
          padding={NeumoTokens.spacing.xs}
          style={styles.selector}
        >
          <View style={styles.selectorContent}>
            <Text style={styles.selectorLabel}>
              <FontAwesomeIcon icon={faSort} color={colors.textSecondary} />
            </Text>
            <Text style={styles.selectorValue}>{selectedSortLabel}</Text>
            <Text style={styles.selectorChevron}>
              <FontAwesomeIcon
                icon={openMenu === "sort" ? faCaretUp : faCaretDown}
                color={colors.textSecondary}
              />
            </Text>
          </View>
        </NeumoPressable>
      </View>
      {openMenu && (
        <NeumoSurface
          variant="raised"
          tone="surface"
          radius={NeumoTokens.radius.md}
          padding={NeumoTokens.spacing.sm}
          style={styles.dropdown}
        >
          {(openMenu === "filter" ? filterOptions : sortOptions).map(
            (option) => {
              const isActive =
                openMenu === "filter"
                  ? option.value === selectedFilter
                  : option.value === selectedSort;
              return (
                <NeumoPressable
                  key={option.value}
                  onPress={() => {
                    if (openMenu === "filter") {
                      onFilterChange(option.value);
                    } else {
                      onSortChange(option.value);
                    }
                    setOpenMenu(null);
                  }}
                  variant={isActive ? "raised" : "flat"}
                  tone="surface"
                  radius={NeumoTokens.radius.md}
                  padding={NeumoTokens.spacing.sm}
                  style={styles.dropdownItem}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      isActive && styles.dropdownTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </NeumoPressable>
              );
            },
          )}
        </NeumoSurface>
      )}
    </NeumoSurface>
  );
};

export default SortFilterBar;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: NeumoTokens.spacing.sm,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: NeumoTokens.spacing.sm,
    },
    selector: {
      flex: 1,
    },
    selectorContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    selectorLabel: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    selectorValue: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
      flex: 1,
      textAlign: "center",
    },
    selectorChevron: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      marginLeft: 4,
    },
    dropdown: {
      marginTop: 8,
      gap: 6,
    },
    dropdownItem: {
      minHeight: 36,
    },
    dropdownText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
    dropdownTextActive: {
      color: colors.textPrimary,
    },
  });
