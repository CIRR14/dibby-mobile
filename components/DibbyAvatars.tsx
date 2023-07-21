import React from "react";
import { Avatar } from "@rneui/base";
import { TouchableOpacity } from "react-native";
import { getInitials } from "../helpers/AppHelpers";
import { userColors } from "../helpers/GenerateColor";
import { Expense, Traveler } from "../constants/DibbyTypes";
import { useTheme } from "@react-navigation/native";
import { ColorTheme } from "../constants/Colors";
import { faDollar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";

interface IDibbyAvatarsProps {
  onPress?: () => void;
  travelers?: Traveler[] | undefined[];
  expense?: Expense;
  maxNumberOfAvatars?: number;
}

const DibbyAvatars: React.FC<IDibbyAvatarsProps> = ({
  onPress,
  travelers,
  expense,
  maxNumberOfAvatars = 4,
}) => {
  const { colors } = useTheme() as unknown as ColorTheme;

  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        maxHeight: 24,
        shadowColor: colors.background.text,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2.5,
      }}
      onPress={onPress}
    >
      {travelers?.map((item, index) => {
        if (index < maxNumberOfAvatars) {
          return (
            <Avatar
              key={item.id}
              size="small"
              rounded
              title={
                index !== maxNumberOfAvatars - 1
                  ? getInitials(item.name)
                  : `+${travelers.length - (maxNumberOfAvatars - 1)}`
              }
              titleStyle={{
                color:
                  index !== 3 ? colors.background.paper : colors.light.text,
              }}
              containerStyle={{
                marginLeft: -10,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: colors.dark.background,
              }}
              overlayContainerStyle={{
                backgroundColor: item.me
                  ? userColors[0].background
                  : index !== 3
                  ? item.color
                  : colors.light.background,
                opacity: 0.95,
              }}
            >
              {expense && expense.payer === item.id && (
                <Avatar.Accessory
                  size={12}
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    backgroundColor: colors.info.background,
                  }}
                  iconProps={{
                    name: "",
                    children: (
                      <FontAwesomeIcon
                        icon={faDollar}
                        size={8}
                        color={colors.background.paper}
                      />
                    ),
                  }}
                  iconStyle={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    alignContent: "center",
                  }}
                />
              )}
            </Avatar>
          );
        }
      })}
    </TouchableOpacity>
  );
};

export default DibbyAvatars;
