import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import React from "react";
import { DibbyParticipant } from "../constants/DibbyTypes";
import { NeumoTokens } from "../constants/Neumo";
import { Pressable, StyleSheet, Text, View } from "react-native";
import useAppTheme from "../hooks/useAppTheme";

interface IDibbyChipProps {
  item: DibbyParticipant;
  onRemove: (item: DibbyParticipant) => void;
  disabled: boolean;
}

export const DibbyChip: React.FC<IDibbyChipProps> = ({
  item,
  onRemove,
  disabled,
}) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors);
  const isGuest = Boolean((item as any).createdUser);

  return (
    <Pressable
      onPress={() => onRemove(item)}
      disabled={disabled}
      style={{ paddingHorizontal: NeumoTokens.control.pill.paddingHorizontal }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text
          style={[
            styles.label,
            { color: isGuest ? colors.success.text : colors.textPrimary },
          ]}
        >
          {`${!item.createdUser ? "@" : ""} ${
            item.createdUser ? item.name : item.username
          }`}
        </Text>
        {isGuest && (
          <View style={styles.guestBadge}>
            <Text style={styles.guestBadgeText}>Guest</Text>
          </View>
        )}
        {!disabled && (
          <FontAwesomeIcon
            icon={faCircleXmark}
            style={{
              color: colors.danger.button,
            }}
          />
        )}
      </View>
    </Pressable>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    label: {
      fontWeight: "500",
      fontSize: 13,
    },
    guestBadge: {
      backgroundColor: colors.success.background,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 999,
    },
    guestBadgeText: {
      color: colors.success.text,
      fontSize: 10,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
  });
