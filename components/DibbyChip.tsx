import { faCircleXmark, faRemove } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { Chip } from "@rneui/themed";
import React from "react";
import { TAutocompleteDropdownItem } from "react-native-autocomplete-dropdown";
import { ColorTheme } from "../constants/Colors";
import { DibbyParticipant } from "../constants/DibbyTypes";

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
  const { colors } = useTheme() as unknown as ColorTheme;

  return (
    <Chip
      type={(item as any).createdUser ? "solid" : "outline"}
      onPress={() => onRemove(item)}
      titleStyle={{
        color: colors.background.text,
      }}
      buttonStyle={{
        borderColor: (item as any).createdUser
          ? colors.success.button
          : colors.background.text,
        backgroundColor: (item as any).createdUser
          ? colors.success.button
          : "transparent",
      }}
      disabledTitleStyle={{ color: colors.background.text }}
      disabledStyle={{ borderColor: colors.background.text }}
      iconRight
      title={`${!item.createdUser ? "@" : ""} ${
        item.createdUser ? item.name : item.username
      }`}
      icon={
        disabled ? (
          <></>
        ) : (
          <FontAwesomeIcon
            icon={faCircleXmark}
            style={{
              color: colors.danger.button,
              marginLeft: 8,
            }}
          />
        )
      }
      disabled={disabled}
    />
  );
};
