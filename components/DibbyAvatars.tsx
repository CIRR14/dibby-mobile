import React from "react";
import { Avatar } from "@rneui/base";
import { Text, TouchableOpacity, View } from "react-native";
import { getInitials } from "../helpers/AppHelpers";
import { useAvatarUrl } from "../hooks/useAvatarUrl";
import {
  DibbyExpense,
  DibbyParticipant,
  DibbyUser,
} from "../constants/DibbyTypes";
import useAppTheme from "../hooks/useAppTheme";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { changeOpacity } from "../helpers/GenerateColor";
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
  const colors = useAppTheme();
  const avatarObject = dibbyUserToAvatarObject(item);
  const { uri: avatarUrl, imageProps } = useAvatarUrl(
    avatarObject.photoURL,
    Math.max(96, Math.round(height * 3))
  );
  const showRemaining =
    typeof remainingAvatars === "number" && remainingAvatars > 0;

  return (
    <View
      key={avatarObject.uid}
      style={{
        zIndex: travelers && position ? travelers.length - position : 1,
        shadowColor: shadow ? colors.shadowDark : "transparent",
        shadowOffset: shadow
          ? { width: 3, height: 3 }
          : { width: 0, height: 0 },
        shadowOpacity: shadow ? 0.25 : 0,
        shadowRadius: shadow ? 6 : 0,
        borderRadius: height * 2,
        alignItems: "center",
      }}
    >
      <View
        style={{
          borderRadius: height * 2,
          borderColor: colors.background.default,
          borderWidth: height / 36,
          backgroundColor: showRemaining
            ? colors.surfaceAlt
            : changeOpacity(avatarObject.color, 0.85),
          width: height,
          height: height,
          marginLeft: overlap ? -10 : 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showRemaining ? (
          <Text
            style={{
              fontSize: height * 0.4,
              color: colors.textSecondary,
            }}
          >
            +{remainingAvatars}
          </Text>
        ) : avatarUrl ? (
          <Avatar
            rounded
            size={height}
            source={{ uri: avatarUrl, cache: "force-cache" }}
            imageProps={imageProps}
          />
        ) : (
          <Text
            style={{
              fontSize: height * 0.4,
              color: colors.textPrimary,
            }}
          >
            {getInitials(avatarObject.displayName)}
          </Text>
        )}
      </View>
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
  const colors = useAppTheme();
  const safeMax = Math.max(1, maxNumberOfAvatars);
  const visibleCount =
    travelers && travelers.length > safeMax
      ? Math.max(1, safeMax - 1)
      : safeMax;
  const remainingCount = travelers
    ? Math.max(0, travelers.length - visibleCount)
    : 0;
  const visibleTravelers = travelers ? travelers.slice(0, visibleCount) : [];
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        maxHeight: height,
      }}
      onPress={onPress}
    >
      {visibleTravelers.map(
        (item: DibbyParticipant | undefined, index: number) => {
          if (!item) {
            return null;
          }
          const position = index + 1;
          const filteredTravelers: DibbyParticipant[] = visibleTravelers.map(
            (t) => t
          ) as DibbyParticipant[];
          return (
            <DibbyAvatar
              key={item.uid || position}
              expense={expense}
              item={item}
              travelers={filteredTravelers}
              position={position}
            />
          );
        }
      )}
      {remainingCount > 0 && (
        <DibbyAvatar
          key={`remaining-${remainingCount}`}
          item={{
            uid: `remaining-${remainingCount}`,
            name: "",
            username: null,
            owed: 0,
            amountPaid: 0,
            color: colors.surfaceAlt,
            photoURL: null,
          }}
          remainingAvatars={remainingCount}
          travelers={visibleTravelers as DibbyParticipant[]}
          position={visibleTravelers.length + 1}
          shadow={false}
        />
      )}
    </TouchableOpacity>
  );
};

export default DibbyAvatars;
