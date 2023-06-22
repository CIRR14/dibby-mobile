import { faAdd, faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  useColorScheme,
  View,
  FlatList,
} from "react-native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useTheme } from "@react-navigation/native";
import { Trip, Expense } from "../constants/DibbyTypes";
import { timestampToString } from "../helpers/TypeHelpers";

interface ICardProps {
  add?: boolean;
  item?: Trip | Expense;
  onPress?: () => void;
}

export const Card: React.FC<ICardProps> = ({ add = false, item, onPress }) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={add ? styles.addCard : styles.card}
    >
      {add ? (
        <FontAwesomeIcon
          icon={faCirclePlus}
          size={24}
          color={colors.onPrimary}
        />
      ) : (
        <View style={styles.cardContent}>
          <Text style={[styles.text, styles.caption]}>
            {timestampToString(item?.created)}
          </Text>

          <Text style={[styles.text, styles.title]}> {item?.name} </Text>
          <Text style={[styles.text, styles.subtitle]}>
            Total Cost: ${item?.amount}
          </Text>
          <FlatList
            data={(item as Trip).travelers || (item as Expense).peopleInExpense}
            renderItem={({ item }) => (
              <View style={styles.itemGrid}>
                <Text style={styles.text}>{item.name}</Text>
                <Text style={styles.text}>{item.owed}</Text>
              </View>
            )}
            keyExtractor={(item) => item.id}
          />
          <Text style={[styles.text, styles.subtitle]}>
            Per Person: ${item?.perPerson}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    addCard: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      position: "absolute",
      bottom: 16,
      margin: "auto",
      width: "100%",
      padding: 20,
      borderRadius: 16,
      backgroundColor: colors.primary,
    },
    card: {
      flex: 1,
      margin: 8,
      backgroundColor: colors.surfaceVariant,
      padding: 16,
      borderRadius: 16,
      display: "flex",
      justifyContent: "center",
      alignContent: "center",
      alignItems: "center",
    },
    cardContent: {
      display: "flex",
      justifyContent: "space-between",
      flexDirection: "column",
    },
    text: {
      color: colors.onSurfaceVariant,
      textAlign: "center",
      padding: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      textTransform: "capitalize",
    },
    subtitle: {
      fontSize: 16,
    },
    caption: {
      fontSize: 12,
      textTransform: "uppercase",
    },
    itemGrid: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      margin: 4,
    },
  });
