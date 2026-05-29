import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import useAppTheme from "../hooks/useAppTheme";
import { ThemeColors } from "../constants/Colors";
import { Typography } from "../constants/Typography";

const DEFAULT_EMOJIS = [
  "✈️",
  "🧳",
  "🏝️",
  "🏖️",
  "🏔️",
  "🏙️",
  "🏕️",
  "🚗",
  "🚆",
  "🚢",
  "🎒",
  "🗺️",
  "📸",
  "🏨",
  "🍕",
  "🍜",
  "🍻",
  "🍷",
  "🎉",
  "🎟️",
  "🛍️",
  "🧾",
  "💳",
  "💸",
];

interface EmojiSelectorProps {
  value?: string | null;
  onChange: (emoji: string | null) => void;
  label?: string;
  size?: number;
  emojis?: string[];
}

const EmojiSelector: React.FC<EmojiSelectorProps> = ({
  value,
  onChange,
  label = "Choose an emoji",
  size = 44,
  emojis = DEFAULT_EMOJIS,
}) => {
  const colors = useAppTheme();
  const styles = useMemo(
    () => makeStyles(colors as unknown as ThemeColors, size),
    [colors, size],
  );
  const [open, setOpen] = useState(false);
  const currentValue = value?.trim() || "";

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        style={styles.trigger}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.triggerText}>{currentValue || "✈️"}</Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable
            style={styles.modalWrapper}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label}</Text>
                {currentValue ? (
                  <Pressable
                    onPress={handleClear}
                  >
                    <Text style={styles.clearText}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>
              <ScrollView contentContainerStyle={styles.emojiGrid}>
                {emojis.map((emoji) => {
                  const isActive = emoji === currentValue;
                  return (
                    <Pressable
                      key={emoji}
                      style={styles.emojiButton}
                      onPress={() => handleSelect(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Pressable
                onPress={() => setOpen(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const makeStyles = (colors: ThemeColors, size: number) =>
  StyleSheet.create({
    trigger: {
      width: size,
      height: size,
      alignItems: "center",
      justifyContent: "center",
    },
    triggerText: {
      fontSize: size * 0.48,
    },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    modalCard: {
      width: "100%",
      maxWidth: 420,
      gap: 12,
    },
    modalWrapper: {
      width: "100%",
      maxWidth: 420,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    modalTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
    },
    clearText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
    emojiGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    emojiButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    emojiText: {
      fontSize: 22,
    },
    closeButton: {
      alignSelf: "flex-end",
      paddingHorizontal: 16,
    },
    closeText: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
  });

export default EmojiSelector;
