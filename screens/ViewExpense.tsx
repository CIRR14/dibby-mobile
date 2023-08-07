import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../components/TopBar";
import { useNavigation, useTheme } from "@react-navigation/native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { FlatList } from "react-native-gesture-handler";
import { Divider } from "@rneui/themed";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { getTravelerFromId, numberWithCommas } from "../helpers/AppHelpers";
import DibbyButton from "../components/DibbyButton";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { LinearGradient } from "expo-linear-gradient";
import {
  DibbyExpense,
  DibbyParticipant,
  DibbyTrip,
} from "../constants/DibbyTypes";
import { changeOpacity } from "../helpers/GenerateColor";
import {
  linearGradientEnd,
  linearGradientStart,
} from "../constants/DeviceWidth";

const windowWidth = Dimensions.get("window").width;
const numColumns = Math.floor(windowWidth / 500);

const ViewExpense = ({ route }: any) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();
  const { tripName, tripId, expenseId } = route.params;
  const [currentExpense, setCurrentExpense] = useState<DibbyExpense>();
  const [currentTrip, setCurrentTrip] = useState<DibbyTrip>();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "trips", tripId), (doc) => {
      const newData: DibbyTrip = { ...(doc.data() as DibbyTrip), id: doc.id };
      setCurrentTrip(newData);
      const expense = newData.expenses.find((e) => e.id === expenseId);
      setCurrentExpense(expense);
    });

    return () => {
      unsub();
    };
  }, [tripId]);

  return (
    <LinearGradient
      style={styles.topContainer}
      colors={[...colors.background.gradient]}
    >
      <SafeAreaView style={styles.topContainer}>
        <TopBar
          title={`${currentExpense?.title}`}
          leftButton={
            <DibbyButton
              type="clear"
              onPress={() =>
                navigation.navigate("ViewTrip", { tripName, tripId })
              }
              title={
                <FontAwesomeIcon
                  icon={faChevronLeft}
                  size={24}
                  color={colors.background.text}
                />
              }
            />
          }
        />

        <View
          style={{
            flexDirection: "column",
            justifyContent: "space-between",
            margin: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.title}>{currentExpense?.title}</Text>
            <Text style={styles.title}>${currentExpense?.amount}</Text>
          </View>

          <LinearGradient
            style={{
              marginTop: 16,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: colors.light.background,
              padding: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderBottomWidth: 4,
              borderLeftWidth: 4,
              borderColor: colors.dark.background,
            }}
            colors={[
              changeOpacity(
                getTravelerFromId(currentTrip, currentExpense?.paidBy)?.color ||
                  colors.primary.background,
                0.8
              ),
              getTravelerFromId(currentTrip, currentExpense?.paidBy)?.color ||
                colors.primary.background,
            ]}
            start={linearGradientStart}
            end={linearGradientEnd}
          >
            <Text style={{ color: colors.background.default }}>
              {getTravelerFromId(currentTrip, currentExpense?.paidBy)?.name}
            </Text>
            <Text style={{ color: colors.background.default }}>
              {`$${
                currentExpense?.peopleInExpense.find(
                  (p) => p.uid === currentExpense.paidBy
                )?.amount || 0
              }`}
            </Text>
          </LinearGradient>

          {currentExpense && (
            <FlatList
              data={currentExpense.peopleInExpense.filter(
                (p) => p.uid !== currentExpense.paidBy
              )}
              key={numColumns}
              numColumns={numColumns}
              keyExtractor={(item) => item.uid}
              style={{ marginVertical: 16 }}
              renderItem={({ item }) => {
                const traveler: DibbyParticipant | undefined =
                  getTravelerFromId(currentTrip, item.uid);
                return (
                  <LinearGradient
                    style={{
                      marginTop: 16,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderBottomWidth: 4,
                      borderLeftWidth: 4,
                      borderColor: colors.dark.background,
                      backgroundColor: colors.light.background,
                    }}
                    colors={[
                      changeOpacity(
                        traveler?.color || colors.primary.background,
                        0.8
                      ),
                      traveler?.color || colors.primary.background,
                    ]}
                    start={linearGradientStart}
                    end={linearGradientEnd}
                  >
                    <Text
                      style={{
                        color: colors.background.default,
                      }}
                    >
                      {traveler?.name}
                    </Text>
                    <Text
                      style={{
                        color: colors.background.default,
                      }}
                    >
                      $
                      {numberWithCommas(
                        currentExpense.peopleInExpense
                          .find((p) => p.uid === traveler?.uid)
                          ?.amount.toString()
                      )}
                    </Text>
                  </LinearGradient>
                );
              }}
            />
          )}
          <Divider
            color={colors.disabled.button}
            style={{
              marginBottom: 16,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 10,
              borderRadius: 10,
            }}
          >
            {/* <Text></Text>
            <Text
              style={{
                color: inRange(
                  sumOfValues(
                    currentExpense?.peopleInExpense.map((p: string) => {
                      const traveler = getTravelerFromId(currentTrip, p);
                      return traveler!!.owed;
                    })
                  ),
                  -0.01,
                  0.01
                )
                  ? colors.info.button
                  : colors.danger.button,
              }}
            >
              $
              {inRange(
                sumOfValues(
                  currentExpense?.peopleInExpense.map((p: string) => {
                    const traveler = getTravelerFromId(currentTrip, p);
                    return traveler!!.owed;
                  })
                ),
                -0.01,
                0.01
              )
                ? 0
                : numberWithCommas(
                    sumOfValues(
                      currentExpense?.peopleInExpense.map((p: string) => {
                        const traveler = getTravelerFromId(currentTrip, p);
                        return traveler!!.owed;
                      })
                    ).toString()
                  )}
            </Text> */}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ViewExpense;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      // backgroundColor: colors.background.default,
    },
    title: {
      fontSize: 20,
      color: colors.background.text,
      textTransform: "capitalize",
    },
  });
