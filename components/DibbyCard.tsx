import {
  faAdd,
  faCirclePlus,
  faDollar,
  faMoneyBill,
  faMoneyBillAlt,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import React, { useRef } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  useColorScheme,
  View,
  FlatList,
  Animated,
} from "react-native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useTheme } from "@react-navigation/native";
import { Trip, Expense, Traveler } from "../constants/DibbyTypes";
import { timestampToString } from "../helpers/TypeHelpers";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import { Avatar } from "@rneui/themed";
import { userColors } from "../helpers/GenerateColor";
import {
  getInitials,
  getTravelerFromId,
  numberWithCommas,
} from "../helpers/AppHelpers";
import { LinearGradient } from "expo-linear-gradient";
import DibbyAvatars from "./DibbyAvatars";

interface IDibbyCardProps {
  trip?: Trip;
  expense?: Expense;
  onPress?: () => void;
  onDeleteItem?: () => void;
  cardWidth?: number;
  wideScreen: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const DibbyCard: React.FC<IDibbyCardProps> = ({
  trip,
  expense,
  onPress,
  onDeleteItem,
  cardWidth,
  wideScreen,
}) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(
    colors as unknown as ThemeColors,
    wideScreen,
    cardWidth
  );
  const swipeableRef = useRef(null);
  const numberOfPeople = expense
    ? expense?.peopleInExpense?.length
    : trip
    ? trip?.travelers?.length
    : 0;

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<any>,
    dragX: Animated.AnimatedInterpolation<any>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 50],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <RectButton style={styles.rectButton}>
        <AnimatedView
          style={[
            {
              width: 30,
              marginHorizontal: 10,
              height: 20,
            },
            { transform: [{ scale }] },
          ]}
        >
          <FontAwesomeIcon
            icon={faTrash}
            size={36}
            color={colors.danger.text}
          />
        </AnimatedView>
      </RectButton>
    );
  };

  const swipeFromRightOpen = async (direction: "left" | "right") => {
    if (direction === "right" && onDeleteItem) {
      onDeleteItem();
      (swipeableRef.current as any)?.close();
    }
  };

  const getAvatarArray = (pplInExpense: string[], payer: string): string[] => {
    const arr = [...pplInExpense];
    const itemToFind = payer;

    const foundIdx = arr.findIndex((el) => el == itemToFind);
    arr.splice(foundIdx, 1);
    arr.unshift(itemToFind);
    return arr;
  };

  return (
    <LinearGradient
      colors={[...colors.card]}
      style={styles.card}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
    >
      <Swipeable
        renderRightActions={renderRightActions}
        onSwipeableOpen={swipeFromRightOpen}
        enableTrackpadTwoFingerGesture
        friction={1}
        ref={swipeableRef}
      >
        <TouchableOpacity onPress={onPress}>
          <View style={styles.cardContent}>
            <View style={styles.cardTextContainer}>
              <Text style={[styles.text, styles.caption]}>
                {timestampToString((expense || trip)?.created)}
              </Text>

              <Text style={[styles.text, styles.title]}>
                {(expense || trip)?.name}
              </Text>
              <Text
                style={[
                  styles.text,
                  styles.subtitle,
                  {
                    color:
                      trip ||
                      (expense && ((expense || trip)?.amount as number) > 0)
                        ? colors.info.card
                        : colors.danger.card,
                  },
                ]}
              >
                {expense && trip && (expense.amount as number) > 0
                  ? `Total Cost: $${numberWithCommas(
                      expense?.amount.toString()
                    )}`
                  : !expense && trip && trip.amount > 0
                  ? `Total Cost: $${numberWithCommas(trip?.amount.toString())}`
                  : expense && trip
                  ? "No cost yet!"
                  : `No expenses yet!`}
              </Text>
            </View>

            {trip &&
              (expense ? (
                <DibbyAvatars
                  expense={expense}
                  onPress={onPress}
                  travelers={
                    getAvatarArray(expense.peopleInExpense, expense.payer)
                      .map((id) => getTravelerFromId(trip, id))
                      .filter((t) => t) as Traveler[]
                  }
                />
              ) : (
                <DibbyAvatars onPress={onPress} travelers={trip.travelers} />
              ))}
          </View>
        </TouchableOpacity>
      </Swipeable>
    </LinearGradient>
  );
};

const makeStyles = (
  colors: ThemeColors,
  wideScreen: boolean,
  cardWidth?: number
) =>
  StyleSheet.create({
    card: {
      minWidth: wideScreen ? cardWidth : 0,
      margin: 8,
      backgroundColor: colors.primary.background,
      padding: 16,
      borderRadius: 16,
      display: "flex",
      justifyContent: "center",
      borderColor: colors.info.background,
      borderWidth: 1,
    },
    cardContent: {
      display: "flex",
      justifyContent: "space-between",
      flexDirection: "row",
    },
    cardTextContainer: {
      maxWidth: "70%",
      display: "flex",
      justifyContent: "space-between",
    },
    text: {
      color: colors.primary.text,
      padding: 8,
    },
    avatarContainer: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      textTransform: "capitalize",
      overflow: "hidden",
      textOverflow: "ellipsis",
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
    rectButton: {
      alignItems: "center",
      flexDirection: "row",
      backgroundColor: colors.danger.button,
      flex: 1,
      justifyContent: "flex-end",
    },
  });
