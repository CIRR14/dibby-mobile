import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  useColorScheme,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../components/TopBar";
import { useNavigation, useTheme } from "@react-navigation/native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { FlatList } from "react-native-gesture-handler";
import { useUser } from "../hooks/useUser";
import { Divider } from "@rneui/themed";
import { doc, onSnapshot } from "firebase/firestore";
import { Expense, Traveler, Trip, TripDoc } from "../constants/DibbyTypes";
import { db } from "../firebase";
import {
  getTravelerFromId,
  inRange,
  numberWithCommas,
  sumOfValues,
} from "../helpers/AppHelpers";
import DibbyButton from "../components/DibbyButton";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { LinearGradient } from "expo-linear-gradient";

const windowWidth = Dimensions.get("window").width;
const numColumns = Math.floor(windowWidth / 500);

const ViewExpense = ({ route }: any) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();
  const { tripName, tripId, expenseId } = route.params;
  const { loggedInUser } = useUser();
  const [currentExpense, setCurrentExpense] = useState<Expense>();
  const [currentTrip, setCurrentTrip] = useState<Trip>();

  useEffect(() => {
    if (loggedInUser && loggedInUser.uid) {
      const unsub = onSnapshot(doc(db, loggedInUser.uid, tripId), (doc) => {
        const newData: Trip = { ...(doc.data() as TripDoc), id: doc.id };
        setCurrentTrip(newData);
        const expense = newData.expenses.find((e) => e.id === expenseId);
        setCurrentExpense(expense);
      });

      return () => {
        unsub();
      };
    }
  }, [loggedInUser, tripId]);

  return (
    <LinearGradient
      style={styles.topContainer}
      colors={[
        colors.background.gradient.start,
        colors.background.gradient.end,
      ]}
    >
      <SafeAreaView style={styles.topContainer}>
        <TopBar
          title={`${currentExpense?.name}`}
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
            <Text style={styles.title}>{currentExpense?.name}</Text>
            <Text style={styles.title}>${currentExpense?.amount}</Text>
          </View>

          <View
            style={{
              marginTop: 16,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: getTravelerFromId(
                currentTrip,
                currentExpense?.payer
              )?.color,
              padding: 10,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: colors.background.default }}>
              {getTravelerFromId(currentTrip, currentExpense?.payer)?.name}
            </Text>
            <Text style={{ color: colors.background.default }}>
              ${numberWithCommas(currentExpense?.amount.toString())}
            </Text>
          </View>

          {currentExpense && (
            <FlatList
              data={currentExpense.peopleInExpense.filter(
                (p) => p !== currentExpense.payer
              )}
              key={numColumns}
              numColumns={numColumns}
              keyExtractor={(item) => item}
              style={{ marginVertical: 16 }}
              renderItem={({ item }) => {
                const traveler: Traveler | undefined = getTravelerFromId(
                  currentTrip,
                  item
                );
                return (
                  <View
                    style={{
                      marginTop: 16,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: traveler?.color,
                      padding: 10,
                      borderRadius: 10,
                    }}
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
                      {traveler && Math.sign(traveler?.owed) === -1
                        ? `($${numberWithCommas(
                            Math.abs(currentExpense.perPerson).toString()
                          )})`
                        : `$${numberWithCommas(
                            currentExpense?.perPerson.toString()
                          )}`}
                    </Text>
                  </View>
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
            <Text></Text>
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
                ? Math.sign(
                    sumOfValues(
                      currentExpense?.peopleInExpense.map((p: string) => {
                        const traveler = getTravelerFromId(currentTrip, p);
                        return traveler!!.owed;
                      })
                    )
                  ) === -1
                  ? -0.01
                  : 0.01
                : sumOfValues(
                    currentExpense?.peopleInExpense.map((p: string) => {
                      const traveler = getTravelerFromId(currentTrip, p);
                      return traveler!!.owed;
                    })
                  )}
            </Text>
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
