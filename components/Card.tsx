import { faAdd, faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  useColorScheme,
} from "react-native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useTheme } from "@react-navigation/native";

interface ICardProps {
  add?: boolean;
  text?: string;
  onPress?: () => void;
}

export const Card: React.FC<ICardProps> = ({ add = false, text, onPress }) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors);

  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      {add ? (
        <FontAwesomeIcon
          icon={faCirclePlus}
          size={24}
          color={colors.onSurfaceVariant}
        />
      ) : (
        <Text style={styles.cardText}>{text}</Text>
      )}
    </TouchableOpacity>
  );
};

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      flex: 1,
      margin: 16,
      backgroundColor: colors.surfaceVariant,
      padding: 50,
      borderRadius: 16,
      display: "flex",
      justifyContent: "center",
      alignContent: "center",
      alignItems: "center",
    },
    cardText: {
      color: colors.onSurfaceVariant,
    },
  });
