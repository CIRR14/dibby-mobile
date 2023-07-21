import {
  faCheck,
  faCheckCircle,
  faTrash,
  faUnlock,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import React, { useRef } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  Animated,
} from "react-native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useTheme } from "@react-navigation/native";
import { Trip, Expense, Traveler } from "../constants/DibbyTypes";
import { timestampToString } from "../helpers/TypeHelpers";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import { getTravelerFromId, numberWithCommas } from "../helpers/AppHelpers";
import { LinearGradient } from "expo-linear-gradient";
import DibbyAvatars from "./DibbyAvatars";

interface IDibbyCardProps {
  trip?: Trip;
  expense?: Expense;
  onPress?: () => void;
  onDeleteItem?: () => void;
  cardWidth?: number;
  wideScreen: boolean;
  onCompleteItem?: (setAs: boolean) => void;
  completed?: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const DibbyCard: React.FC<IDibbyCardProps> = ({
  trip,
  expense,
  onPress,
  onDeleteItem,
  cardWidth,
  wideScreen,
  onCompleteItem,
  completed,
}) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(
    colors as unknown as ThemeColors,
    wideScreen,
    cardWidth
  );

  const swipeableRef = useRef(null);

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
      <RectButton style={styles.rectDeleteButton}>
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

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<any>,
    dragX: Animated.AnimatedInterpolation<any>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 50],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <RectButton style={styles.rectCompleteButton}>
        <AnimatedView
          style={{
            width: 30,
            marginHorizontal: 10,
            height: 20,
          }}
        >
          <FontAwesomeIcon
            icon={completed ? faUnlock : faCheck}
            size={36}
            color={colors.success.text}
          />
        </AnimatedView>
      </RectButton>
    );
  };

  const swipeOpen = async (direction: "left" | "right") => {
    if (direction === "right" && onDeleteItem && !completed) {
      onDeleteItem();
    } else if (direction === "left" && onCompleteItem) {
      onCompleteItem(!!!completed);
    }
    (swipeableRef.current as any)?.close();
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
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={{
        borderRadius: 16,
        margin: 8,
      }}
    >
      <Swipeable
        renderRightActions={!completed ? renderRightActions : undefined}
        renderLeftActions={trip && !expense ? renderLeftActions : undefined}
        onSwipeableOpen={swipeOpen}
        enableTrackpadTwoFingerGesture
        containerStyle={{ borderRadius: 16 }}
        friction={1}
        ref={swipeableRef}
      >
        {completed && (
          <FontAwesomeIcon
            icon={faCheckCircle}
            size={48}
            color={colors.primary.text}
            style={{
              position: "absolute",
              right: 32,
              top: 64,
              opacity: 0.8,
            }}
          />
        )}
        <TouchableOpacity style={styles.card} onPress={onPress}>
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
      // backgroundColor: "transparent",
      padding: 16,
      borderRadius: 16,
      display: "flex",
      justifyContent: "center",
      borderColor: colors.dark.background,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
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
    rectDeleteButton: {
      backgroundColor: colors.danger.button,
      flex: 1,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    rectCompleteButton: {
      backgroundColor: colors.success.button,
      flex: 1,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "flex-start",
    },
  });
