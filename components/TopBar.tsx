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
import { useTheme } from "@react-navigation/native";

interface ITopBarProps {
  title: string;
  onPressBack?: () => void;
  signOut?: () => void;
}

const TopBar: React.FC<ITopBarProps> = ({ title, onPressBack, signOut }) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPressBack}
        style={[styles.innerContainer, styles.backButton]}
      >
        {onPressBack && (
          <FontAwesomeIcon
            icon={faChevronLeft}
            size={24}
            color={colors.primary.text}
          />
        )}
      </TouchableOpacity>
      <View style={styles.innerContainer}>
        <Text style={styles.title}> {title} </Text>
      </View>
      <TouchableOpacity onPress={signOut} style={styles.innerContainer}>
        {signOut && (
          <FontAwesomeIcon
            icon={faSignOutAlt}
            size={24}
            color={colors.primary.text}
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
      color: colors.primary.text,
      fontSize: 22,
      width: 120,
      fontWeight: 'bold',
      textAlign: 'center'
    },
    innerContainer: {
      width: 120,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
    },
    backButton: {
      flexDirection: "row",
      borderRadius: 8,
      height: 32,
      justifyContent: "flex-start",
    },
    backText: {
      color: colors.primary.text,
    },
  });
