import React from "react";
import { Avatar } from "@rneui/base";
import { Text, TouchableOpacity, View } from "react-native";
import { getInitials } from "../helpers/AppHelpers";
import {
  DibbyExpense,
  DibbyParticipant,
  DibbyUser,
} from "../constants/DibbyTypes";
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
import { dibbyUserToAvatarObject } from "../helpers/TypeHelpers";

interface IDibbyAvatarsProps {
  onPress?: () => void;
  travelers?: DibbyParticipant[] | undefined[];
  expense?: DibbyExpense;
  maxNumberOfAvatars?: number;
  height?: number;
}

export const DibbyAvatar: React.FC<{
  item: DibbyParticipant | DibbyUser;
  position?: number;
  travelers?: DibbyParticipant[];
  remainingAvatars?: number;
  height?: number;
  expense?: DibbyExpense;
  overlap?: boolean;
  shadow?: boolean;
}> = ({
  item,
  travelers,
  position,
  remainingAvatars,
  expense,
  height = 36,
  overlap = true,
  shadow = true,
}) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const avatarObject = dibbyUserToAvatarObject(item);

  return (
    <View
      key={avatarObject.uid}
      style={{
        zIndex: travelers && position ? travelers.length - position : 1,
        shadowColor: shadow ? colors.dark.background : "transparent",
        shadowOffset: shadow
          ? { width: -2, height: 4 }
          : { width: 0, height: 0 },
        shadowOpacity: shadow ? 0.2 : 0,
        shadowRadius: shadow ? 3 : 0,
        borderRadius: height * 2,
        alignItems: "center",
      }}
    >
      <LinearGradient
        style={{
          borderRadius: height * 2,
          borderColor: colors.dark.background,
          borderWidth: height / 36,
          backgroundColor: colors.background.default,
          width: height,
          height: height,
          marginLeft: overlap ? -10 : 0,
          alignItems: "center",
          justifyContent: "center",
        }}
        colors={[changeOpacity(avatarObject.color, 0.7), avatarObject.color]}
        start={linearGradientStart}
        end={linearGradientEnd}
      >
        {remainingAvatars ? (
          <Text
            style={{
              fontSize: height * 0.4,
              color: remainingAvatars
                ? colors.light.text
                : colors.background.text,
            }}
          >
            +${remainingAvatars}
          </Text>
        ) : avatarObject.photoURL ? (
          <Avatar
            rounded
            size={height}
            source={{ uri: avatarObject.photoURL }}
          />
        ) : (
          <Text
            style={{
              fontSize: height * 0.4,
              color: remainingAvatars
                ? colors.light.text
                : colors.background.text,
            }}
          >
            {getInitials(avatarObject.displayName)}
          </Text>
        )}
      </LinearGradient>
      {expense?.paidBy === avatarObject.uid && (
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

const DibbyAvatars: React.FC<IDibbyAvatarsProps> = ({
  onPress,
  travelers,
  expense,
  maxNumberOfAvatars = 4,
  height = 36,
}) => {
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
                expense={expense}
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
