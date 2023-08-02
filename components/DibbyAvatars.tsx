import React from "react";
import { Avatar } from "@rneui/base";
import { Text, TouchableOpacity, View } from "react-native";
import { getInitials } from "../helpers/AppHelpers";
import { DibbyExpense, DibbyParticipant } from "../constants/DibbyTypes";
import { useTheme } from "@react-navigation/native";
import { ColorTheme } from "../constants/Colors";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { changeOpacity } from "../helpers/GenerateColor";
import { LinearGradient } from "expo-linear-gradient";
import {
  linearGradientEnd,
  linearGradientStart,
} from "../constants/DeviceWidth";

interface IDibbyAvatarsProps {
  onPress?: () => void;
  travelers?: DibbyParticipant[] | undefined[];
  expense?: DibbyExpense;
  maxNumberOfAvatars?: number;
  height?: number;
}

const DibbyAvatars: React.FC<IDibbyAvatarsProps> = ({
  onPress,
  travelers,
  expense,
  maxNumberOfAvatars = 4,
  height = 36,
}) => {
  const { colors } = useTheme() as unknown as ColorTheme;

  const DibbyAvatar: React.FC<{
    item: DibbyParticipant;
    travelers: DibbyParticipant[];
    position: number;
    remainingAvatars?: number;
  }> = ({ item, travelers, position, remainingAvatars }) => {
    return (
      <View
        key={item.uid}
        style={{
          zIndex: travelers.length - position,
        }}
      >
        <LinearGradient
          style={{
            borderRadius: 20,
            borderColor: colors.dark.background,
            borderWidth: 1,
            backgroundColor: colors.background.default,
            width: height,
            height: height,
            marginLeft: -10,
            alignItems: "center",
            justifyContent: "center",
          }}
          colors={[changeOpacity(item.color, 0.7), item.color]}
          start={linearGradientStart}
          end={linearGradientEnd}
        >
          <Text
            style={{
              fontSize: 16,
              color: remainingAvatars
                ? colors.light.text
                : colors.background.text,
            }}
          >
            {remainingAvatars ? `+${remainingAvatars}` : getInitials(item.name)}
          </Text>
        </LinearGradient>
        {expense?.paidBy === item.uid && (
          <FontAwesomeIcon
            style={{
              position: "absolute",
              left: -10,
              bottom: -4,
              width: 16,
              height: 16,
              zIndex: 2000,
            }}
            icon={faStar}
            size={16}
            color={colors.warning.background}
          />
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        maxHeight: height,
      }}
      onPress={onPress}
    >
      {travelers?.map((item: DibbyParticipant | undefined, index: number) => {
        const position = index + 1;
        const needsPlusAvatar = travelers.length > maxNumberOfAvatars;
        const filteredTravelers: DibbyParticipant[] = travelers.map((t) => t);
        if (position <= maxNumberOfAvatars && item) {
          if (
            (needsPlusAvatar && position <= maxNumberOfAvatars - 1) ||
            !needsPlusAvatar
          ) {
            return (
              <DibbyAvatar
                key={position}
                item={item}
                travelers={filteredTravelers}
                position={position}
              />
            );
          } else {
            const remainingAvatars =
              travelers.length - (maxNumberOfAvatars - 1);
            return (
              <DibbyAvatar
                key={position}
                item={item}
                travelers={filteredTravelers}
                position={position}
                remainingAvatars={remainingAvatars}
              />
            );
          }
        }
      })}
    </TouchableOpacity>
  );
};

export default DibbyAvatars;
