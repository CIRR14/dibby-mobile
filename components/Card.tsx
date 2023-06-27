import { faAdd, faCirclePlus, faTrash } from "@fortawesome/free-solid-svg-icons";
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
import { Trip, Expense } from "../constants/DibbyTypes";
import { timestampToString } from "../helpers/TypeHelpers";
import { RectButton, Swipeable } from "react-native-gesture-handler";

interface ICardProps {
  add?: boolean;
  item?: Trip | Expense;
  onPress?: () => void;
  onDeleteItem?: () => void
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const Card: React.FC<ICardProps> = ({ add = false, item, onPress, onDeleteItem }) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const swipeableRef = useRef(null);


  const renderRightActions = (progress: Animated.AnimatedInterpolation, dragX: Animated.AnimatedInterpolation) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 1],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <RectButton style={styles.rectButton}>
        <AnimatedView style={[{
          width: 30,
          marginHorizontal: 10,
          height: 20,
        }, { transform: [{ scale }] }]} >
          <FontAwesomeIcon icon={faTrash} size={36} color={colors.danger.text} />
        </AnimatedView >
      </RectButton>
    );
  };

  const swipeFromRightOpen = async (direction: 'left' | 'right') => {
    if (direction === 'right' && onDeleteItem) {
      onDeleteItem();
      (swipeableRef.current as any)?.close();
    }
  };



  return (
    add ? <TouchableOpacity style={add ? styles.addCard : styles.card} onPress={onPress}>
      <FontAwesomeIcon
        icon={faCirclePlus}
        size={24}
        color={colors.primary.text}
      />
    </TouchableOpacity>
      : <Swipeable
        containerStyle={styles.card}
        renderRightActions={renderRightActions}
        onSwipeableOpen={swipeFromRightOpen}
        // rightThreshold={50}
        enableTrackpadTwoFingerGesture
        friction={2}
        ref={swipeableRef}
      >
        <TouchableOpacity onPress={onPress}>
          <View style={styles.cardContent}>
            <Text style={[styles.text, styles.caption]}>
              {timestampToString(item?.created)}
            </Text>

            <Text style={[styles.text, styles.title]}> {item?.name} </Text>
            <Text style={[styles.text, styles.subtitle, { color: colors.info.text }]}>
              Total Cost: ${item?.amount}
            </Text>
            <FlatList
              data={(item as Trip).travelers || (item as Expense).peopleInExpense}
              renderItem={({ item }) => {
                return (
                  <View style={styles.itemGrid}>
                    <Text style={[styles.text,
                      // { color: item.color }
                    ]}>{item.name}</Text>
                    <Text style={[
                      styles.text,
                      {
                        color: item.owed > 0 ? colors.success.text : item.owed < 0 ? colors.danger.text : colors.primary.text
                      }
                    ]}>{item.owed > 0 ? `is owed $${item.owed}` : item.owed < 0 ? `owes $${item.owed}` : '✅'}</Text>
                  </View>
                )
              }}
              keyExtractor={(item) => item.id}
            />
            <Text style={[styles.text, styles.subtitle, { color: colors.success.text }]}>
              Per Person: ${item?.perPerson}
            </Text>
          </View>
        </TouchableOpacity>
      </Swipeable >
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
      backgroundColor: colors.primary.button,
    },
    card: {
      flex: 1,
      margin: 8,
      backgroundColor: colors.primary.card,
      padding: 16,
      borderRadius: 16,
      display: "flex",
      justifyContent: "center",
      alignContent: "center"
    },
    cardContent: {
      display: "flex",
      justifyContent: "space-between",
      flexDirection: "column",
    },
    text: {
      color: colors.primary.text,
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
    rectButton: {
      alignItems: 'center',
      flexDirection: 'row',
      backgroundColor: colors.danger.card,
      flex: 1,
      justifyContent: 'flex-end',
    },
  });
