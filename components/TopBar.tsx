import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronLeft, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Avatar } from "@rneui/base";
import { User } from "firebase/auth";
import { userColors } from "../helpers/GenerateColor";
import { Traveler } from "../constants/DibbyTypes";
import { getInitials } from "../helpers/AppHelpers";

interface ITopBarProps {
  title: string;
  onPressBack?: () => void;
  signOut?: () => void;
  user?: User | null;
  travelers?: Traveler[];
}

const TopBar: React.FC<ITopBarProps> = ({
  title,
  onPressBack,
  signOut,
  user,
  travelers,
}) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={signOut}
        style={[styles.innerContainer, styles.leftButton]}
      >
        {signOut ? (
          <FontAwesomeIcon
            icon={faSignOutAlt}
            size={24}
            color={colors.background.text}
          />
        ) : (
          <TouchableOpacity
            onPress={onPressBack}
            style={[styles.innerContainer, styles.leftButton]}
          >
            {onPressBack && (
              <FontAwesomeIcon
                icon={faChevronLeft}
                size={24}
                color={colors.background.text}
              />
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <TouchableOpacity onPress={onPressBack} style={styles.innerContainer}>
        {user && (
          <Avatar
            size="small"
            rounded
            title={getInitials(user?.displayName)}
            containerStyle={{
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: userColors[0].border || colors.primary.background,
            }}
            overlayContainerStyle={{
              backgroundColor:
                userColors[0].background || colors.primary.background,
            }}
            titleStyle={{
              color: userColors[0].text || colors.primary.text,
            }}
            onPress={() => navigation.navigate("CreateProfile")}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default TopBar;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      height: 64,
      backgroundColor: colors.background.default,
      padding: 16,
    },
    title: {
      color: colors.background.text,
      textTransform: "capitalize",
      fontSize: 22,
      // minWidth: 120,
      flexWrap: "wrap",
      fontWeight: "bold",
      textAlign: "center",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    innerContainer: {
      // minWidth: 120,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      flexWrap: "wrap",
    },
    leftButton: {
      flexDirection: "row",
      borderRadius: 8,
      // height: 32,
      justifyContent: "flex-start",
      alignItems: "flex-start",
    },
  });
