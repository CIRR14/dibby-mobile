import React, { useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { ThemeColors } from "../constants/Colors";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faCaretDown,
  faCaretUp,
  faFilter,
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

const Selector: React.FC<{
  icon: any;
  label: string;
  valueLabel?: string;
  open: boolean;
  onPress: () => void;
  triggerRef: React.RefObject<View>;
}> = ({ icon, label, valueLabel, open, onPress, triggerRef }) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);

  return (
    <View ref={triggerRef} collapsable={false}>
      <Pressable
        onPress={onPress}
        style={styles.selectorButton}
      >
        <View style={styles.selectorRow}>
          <FontAwesomeIcon icon={icon} size={12} color={colors.textSecondary} />
          <Text style={styles.selectorLabel}>{label}</Text>
          <Text style={styles.selectorValue}>{valueLabel}</Text>
          <FontAwesomeIcon
            icon={open ? faCaretUp : faCaretDown}
            size={12}
            color={colors.textSecondary}
          />
        </View>
      </Pressable>
    </View>
  );
};

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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [openMenu, setOpenMenu] = useState<"filter" | "sort" | null>(null);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const filterRef = useRef<View>(null);
  const sortRef = useRef<View>(null);

  const selectedFilterLabel = useMemo(
    () =>
      filterOptions.find((option) => option.value === selectedFilter)?.label ??
      filterOptions[0]?.label,
    [filterOptions, selectedFilter],
  );
  const selectedSortLabel = useMemo(
    () =>
      sortOptions.find((option) => option.value === selectedSort)?.label ??
      sortOptions[0]?.label,
    [sortOptions, selectedSort],
  );

  const activeOptions = openMenu === "filter" ? filterOptions : sortOptions;
  const openSelector = (menu: "filter" | "sort") => {
    const node = menu === "filter" ? filterRef.current : sortRef.current;
    if (!node) {
      setAnchor(null);
      setOpenMenu(menu);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpenMenu(menu);
    });
  };

  const closeSelector = () => {
    setOpenMenu(null);
  };

  const MENU_WIDTH = 196;
  const EDGE_GUTTER = 12;
  const top = anchor
    ? Math.max(
        EDGE_GUTTER,
        Math.min(anchor.y + anchor.height + 6, windowHeight - EDGE_GUTTER - 280),
      )
    : EDGE_GUTTER + 54;
  const left = anchor
    ? Math.max(
        EDGE_GUTTER,
        Math.min(anchor.x + anchor.width - MENU_WIDTH, windowWidth - MENU_WIDTH - EDGE_GUTTER),
      )
    : Math.max(EDGE_GUTTER, windowWidth - MENU_WIDTH - EDGE_GUTTER);

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Selector
          icon={faFilter}
          label={filterLabel}
          valueLabel={selectedFilterLabel}
          open={openMenu === "filter"}
          onPress={() =>
            openMenu === "filter" ? closeSelector() : openSelector("filter")
          }
          triggerRef={filterRef}
        />
        <Selector
          icon={faSort}
          label={sortLabel}
          valueLabel={selectedSortLabel}
          open={openMenu === "sort"}
          onPress={() =>
            openMenu === "sort" ? closeSelector() : openSelector("sort")
          }
          triggerRef={sortRef}
        />
      </View>

      {openMenu && (
        <Modal
          transparent
          visible
          animationType="fade"
          onRequestClose={closeSelector}
        >
          <Pressable style={styles.backdrop} onPress={closeSelector} />
          <View style={styles.modalLayer} pointerEvents="box-none">
            <View
              style={[
                styles.dropdown,
                {
                  top,
                  left,
                  width: MENU_WIDTH,
                },
              ]}
            >
              {activeOptions.map((option) => {
                const isActive =
                  openMenu === "filter"
                    ? option.value === selectedFilter
                    : option.value === selectedSort;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      if (openMenu === "filter") {
                        onFilterChange(option.value);
                      } else {
                        onSortChange(option.value);
                      }
                      closeSelector();
                    }}
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
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default SortFilterBar;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      gap: NeumoTokens.spacing.xs,
    },
    row: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: NeumoTokens.spacing.xs,
    },
    selectorContainer: {
      minWidth: 124,
      maxWidth: 180,
    },
    selectorButton: {
      minHeight: NeumoTokens.touch.minTarget,
      paddingHorizontal: NeumoTokens.spacing.sm,
    },
    selectorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    selectorLabel: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      textTransform: "uppercase",
      letterSpacing: Typography.tracking.normal,
    },
    selectorValue: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
      marginRight: 2,
    },
    dropdown: {
      position: "absolute",
      zIndex: 1000,
      elevation: 30,
      gap: 4,
    },
    dropdownItem: {
      minHeight: 36,
      justifyContent: "center",
    },
    dropdownText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.medium as any,
    },
    dropdownTextActive: {
      color: colors.textPrimary,
      fontWeight: Typography.weight.semibold as any,
    },
    modalLayer: {
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "transparent",
    },
  });
