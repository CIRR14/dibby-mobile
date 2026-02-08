import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../components/TopBar";
import { useNavigation } from "@react-navigation/native";
import { ThemeColors } from "../constants/Colors";
import { FlatList } from "react-native-gesture-handler";
import { Divider } from "@rneui/themed";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  getTravelerFromId,
  inRange,
  numberWithCommas,
  sumOfValues,
} from "../helpers/AppHelpers";
import DibbyButton from "../components/DibbyButton";
import { faChevronLeft, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  DibbyExpense,
  DibbyParticipant,
  DibbyTrip,
} from "../constants/DibbyTypes";
import { changeOpacity, resolveParticipantColor } from "../helpers/GenerateColor";
import { deleteDibbyExpense } from "../helpers/FirebaseHelpers";
import NeumoSurface from "../components/NeumoSurface";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";
import StatsSection from "../components/StatsSection";
import { buildExpenseStats, pickStats } from "../helpers/StatsHelpers";
import { useUser } from "../hooks/useUser";
import { wideScreen } from "../constants/DeviceWidth";

const windowWidth = Dimensions.get("window").width;
const numColumns = Math.floor(windowWidth / 500);

const ViewExpense = ({ route }: any) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();
  const { tripName, tripId, expenseId } = route.params;
  const { dibbyUser } = useUser();
  const [currentExpense, setCurrentExpense] = useState<DibbyExpense>();
  const [currentTrip, setCurrentTrip] = useState<DibbyTrip>();
  const expenseStats = useMemo(
    () =>
      currentExpense
        ? buildExpenseStats(currentExpense, currentTrip, dibbyUser?.uid)
        : [],
    [currentExpense, currentTrip, dibbyUser?.uid],
  );
  const expenseCompactStats = useMemo(
    () =>
      pickStats(expenseStats, [
        "expense-amount",
        "expense-split",
        "expense-participants",
        "expense-you-owe",
      ]),
    [expenseStats],
  );
  const statsColumns = wideScreen ? 3 : 2;

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
    <View style={styles.topContainer}>
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
                  color={colors.textPrimary}
                />
              }
            />
          }
          rightButton={
            <DibbyButton
              type="clear"
              onPress={() => {
                currentExpense &&
                  currentTrip &&
                  deleteDibbyExpense(currentExpense, currentTrip);
              }}
              title={
                <FontAwesomeIcon
                  icon={faTrash}
                  size={24}
                  color={colors.danger.button}
                />
              }
            />
          }
        />

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{currentExpense?.title}</Text>
            <Text style={styles.title}>${currentExpense?.amount}</Text>
          </View>

          {currentExpense && (
            <NeumoSurface
              variant="raised"
              tone="surface"
              radius={NeumoTokens.radius.lg}
              style={styles.statsCard}
            >
              <StatsSection
                title="Expense stats"
                compactItems={expenseCompactStats}
                fullItems={expenseStats}
                compactColumns={2}
                expandedColumns={statsColumns}
              />
            </NeumoSurface>
          )}

          <NeumoSurface
            variant="raised"
            tone="surface"
            radius={NeumoTokens.radius.md}
            style={{
              marginTop: 16,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: changeOpacity(
                resolveParticipantColor(
                  getTravelerFromId(currentTrip, currentExpense?.paidBy)?.color,
                  currentExpense?.paidBy || ""
                ),
                0.85
              ),
            }}
          >
            <Text style={{ color: colors.textPrimary }}>
              {getTravelerFromId(currentTrip, currentExpense?.paidBy)?.name}
            </Text>
            <Text style={{ color: colors.textPrimary }}>
              {`$${
                currentExpense?.peopleInExpense.find(
                  (p) => p.uid === currentExpense.paidBy
                )?.amount || 0
              }`}
            </Text>
          </NeumoSurface>

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
                  <NeumoSurface
                    variant="raised"
                    tone="surface"
                    radius={NeumoTokens.radius.md}
                    style={{
                      marginTop: 16,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: changeOpacity(
                        resolveParticipantColor(
                          traveler?.color,
                          traveler?.uid || traveler?.username || traveler?.name || ""
                        ),
                        0.85
                      ),
                    }}
                  >
                    <Text style={{ color: colors.textPrimary }}>
                      {traveler?.name}
                    </Text>
                    <Text style={{ color: colors.textPrimary }}>
                      $
                      {numberWithCommas(
                        currentExpense.peopleInExpense
                          .find((p) => p.uid === traveler?.uid)
                          ?.amount.toString()
                      )}
                    </Text>
                  </NeumoSurface>
                );
              }}
            />
          )}
          <Divider
            color={colors.shadowDark}
            style={{
              marginBottom: 16,
            }}
          />

          <View style={styles.totalRow}>
            <Text></Text>
            <Text
              style={{
                color: inRange(
                  sumOfValues(
                    currentExpense?.peopleInExpense.map((p) => {
                      const traveler = getTravelerFromId(currentTrip, p.uid);
                      return traveler ? traveler.owed : 0;
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
                  currentExpense?.peopleInExpense.map((p) => {
                    const traveler = getTravelerFromId(currentTrip, p.uid);
                    return traveler ? traveler.owed : 0;
                  })
                ),
                -0.01,
                0.01
              )
                ? 0
                : numberWithCommas(
                    sumOfValues(
                      currentExpense?.peopleInExpense.map((p) => {
                        const traveler = getTravelerFromId(currentTrip, p.uid);
                        return traveler ? traveler.owed : 0;
                      })
                    ).toString()
                  )}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default ViewExpense;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    content: {
      margin: 16,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontSize: Typography.size.lg,
      color: colors.textPrimary,
      textTransform: "capitalize",
      fontWeight: Typography.weight.semibold as any,
    },
    statsCard: {
      marginTop: 16,
      gap: 8,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 10,
      borderRadius: 10,
    },
  });
