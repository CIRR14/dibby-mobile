import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import useAppTheme from "../hooks/useAppTheme";
import { ThemeColors } from "../constants/Colors";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";

export interface ActionMenuItem {
  key: string;
  label: string;
  icon: IconDefinition;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  align?: "left" | "right";
  compact?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const MENU_WIDTH = 172;
const MENU_OFFSET = 6;
const EDGE_GUTTER = 12;

const ActionMenu: React.FC<ActionMenuProps> = ({
  items,
  align = "right",
  compact = false,
  onOpenChange,
}) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors, align, compact);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const activeItems = useMemo(() => items.filter((item) => !item.disabled), [items]);

  const close = useCallback(() => {
    setOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const openMenu = useCallback(() => {
    const node = triggerRef.current;
    if (!node) {
      setOpen(true);
      onOpenChange?.(true);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
      onOpenChange?.(true);
    });
  }, [onOpenChange]);

  const toggle = useCallback(() => {
    if (open) {
      close();
      return;
    }
    openMenu();
  }, [open, close, openMenu]);

  if (activeItems.length === 0) {
    return null;
  }

  const menuPosition = (() => {
    const fallbackTop = compact ? 38 : 44;
    if (!anchor) {
      return {
        top: fallbackTop,
        left:
          align === "right"
            ? Math.max(EDGE_GUTTER, windowWidth - MENU_WIDTH - EDGE_GUTTER)
            : EDGE_GUTTER,
      };
    }

    const top = Math.max(
      EDGE_GUTTER,
      Math.min(
        anchor.y + anchor.height + MENU_OFFSET,
        windowHeight - EDGE_GUTTER - 220,
      ),
    );
    const rawLeft =
      align === "right" ? anchor.x + anchor.width - MENU_WIDTH : anchor.x;
    const left = Math.max(
      EDGE_GUTTER,
      Math.min(rawLeft, windowWidth - MENU_WIDTH - EDGE_GUTTER),
    );
    return { top, left };
  })();

  return (
    <View style={styles.wrapper}>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          onPress={toggle}
          style={styles.trigger}
        >
          <FontAwesomeIcon
            icon={faEllipsis}
            size={compact ? 12 : 14}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.modalLayer} pointerEvents="box-none">
          <View
            style={[
              styles.menu,
              {
                top: menuPosition.top,
                left: menuPosition.left,
                width: MENU_WIDTH,
              },
            ]}
          >
            {activeItems.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => {
                  close();
                  item.onPress();
                }}
                style={styles.item}
              >
                <View style={styles.row}>
                  <FontAwesomeIcon
                    icon={item.icon}
                    size={12}
                    color={
                      item.destructive
                        ? colors.danger.background
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.label,
                      item.destructive && styles.destructiveLabel,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ActionMenu;

const makeStyles = (
  colors: ThemeColors,
  align: "left" | "right",
  compact: boolean,
) =>
  StyleSheet.create({
    wrapper: {
      position: "relative",
      minHeight: NeumoTokens.touch.minTarget,
      alignItems: align === "right" ? "flex-end" : "flex-start",
      justifyContent: "center",
    },
    trigger: {
      minHeight: compact ? 32 : NeumoTokens.touch.minTarget,
      minWidth: compact ? 32 : NeumoTokens.touch.minTarget,
      alignItems: "center",
      justifyContent: "center",
    },
    menu: {
      position: "absolute",
      zIndex: 1000,
      elevation: 30,
      gap: 4,
    },
    modalLayer: {
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "transparent",
    },
    item: {
      minHeight: 36,
      justifyContent: "center",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    label: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.medium as any,
    },
    destructiveLabel: {
      color: colors.danger.background,
    },
  });
