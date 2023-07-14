import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  useColorScheme,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../components/TopBar";
import { useNavigation } from "@react-navigation/core";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { FlatList } from "react-native-gesture-handler";
import { useUser } from "../hooks/useUser";
import { Avatar } from "@rneui/themed";
import { Timestamp, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { Expense, Traveler, Trip, TripDoc } from "../constants/DibbyTypes";
import { db } from "../firebase";
import { Card } from "../components/Card";
import CreateExpense from "../components/CreateExpense";
import {
  getInitials,
  inRange,
  numberWithCommas,
  sumOfValues,
} from "../helpers/AppHelpers";
import { userColors } from "../helpers/GenerateColor";
import {
  ITransactionResponse,
  calculateTrip,
  getAmountOfTransactionsString,
  getTransactionString,
} from "../helpers/DibbyLogic";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faCaretDown,
  faCaretUp,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";
import { Divider } from "@rneui/base";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import { generateHTML } from "../constants/PdfTemplate";
import { wideScreen, windowWidth } from "../constants/DeviceWidth";
import { useTheme } from "@react-navigation/native";
import DibbyButton from "../components/DibbyButton";
import { faFilePdf } from "@fortawesome/free-regular-svg-icons";

const cardWidth = 500;
const numColumns = Math.floor(windowWidth / cardWidth);

const ViewTrip = ({ route }: any) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();
  const { tripName, tripId } = route.params;
  const { loggedInUser } = useUser();
  const [currentTrip, setCurrentTrip] = useState<Trip>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [calculatedTrip, setCalculatedTrip] = useState<ITransactionResponse>();
  const [summaryOpen, setSummaryOpen] = useState<boolean>(false);
  const [isCreateExpenseModalVisible, setIsCreateExpenseModalVisible] =
    useState(false);

  const [html, setHtml] = useState<string>("");
  const [loadingIndicator, setLoadingIndicator] = useState<boolean>(false);

  useEffect(() => {
    if (calculatedTrip && currentTrip) {
      setHtml(generateHTML(calculatedTrip, currentTrip));
    }
  }, [calculatedTrip, currentTrip]);

  useEffect(() => {
    if (loggedInUser && loggedInUser.uid && currentTrip) {
      const copyOfTrip = JSON.parse(JSON.stringify(currentTrip));
      const newCalculatedTrip = calculateTrip(copyOfTrip);
      setCalculatedTrip(newCalculatedTrip);
    }
  }, [loggedInUser, currentTrip]);

  useEffect(() => {
    if (loggedInUser && loggedInUser.uid) {
      const unsub = onSnapshot(doc(db, loggedInUser.uid, tripId), (doc) => {
        const newData: Trip = { ...(doc.data() as TripDoc), id: doc.id };
        setCurrentTrip(newData);
      });

      return () => {
        unsub();
      };
    }
  }, [loggedInUser, tripId]);

  useEffect(() => {
    if (currentTrip) {
      setExpenses(
        currentTrip.expenses.sort(
          (a, b) => b.created.toDate().getTime() - a.created.toDate().getTime()
        )
      );
    }
  }, [currentTrip]);

  const deleteExpense = async (expense: Expense) => {
    // TODO: update rest of the trip?
    // use TRIP updates (expenseUpdate())
    if (loggedInUser && currentTrip) {
      const newExpArr: Expense[] = currentTrip.expenses.filter(
        (e) => e.id !== expense.id
      );

      const newTravelerArr: Traveler[] = currentTrip.travelers.map((t) => {
        if (expense.peopleInExpense.find((p) => p === t.id)) {
          if (expense.payer === t.id) {
            // payer
            const newAmountPaid = t.amountPaid - +expense.amount;
            const newOwed =
              t.owed -
              +expense.perPerson * (expense.peopleInExpense.length - 1);
            return {
              ...t,
              amountPaid: newAmountPaid,
              owed: newOwed,
            };
          } else {
            // involved but not payer
            const newOwed = t.owed + +expense.perPerson;
            return {
              ...t,
              owed: newOwed,
            };
          }
        } else {
          return {
            ...t,
          };
        }
      });

      const newTrip = {
        ...currentTrip,
        expenses: newExpArr,
        amount: currentTrip.amount - +expense.amount, //increment(+expense.amount)
        updated: Timestamp.now(),
        perPerson:
          (currentTrip.amount - +expense.amount) / currentTrip.travelers.length,
        travelers: newTravelerArr,
      };

      const tripRef = doc(db, loggedInUser.uid, tripId);
      await updateDoc(tripRef, newTrip);
    }
  };

  const deleteAlert = (item: Expense) =>
    Alert.alert(
      `Are you sure you want to delete ${item.name}?`,
      "This will be permanently deleted.",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        { text: "OK", onPress: () => deleteExpense(item as Expense) },
      ]
    );

  const toggleCreateExpenseModal = () => {
    setIsCreateExpenseModalVisible(!isCreateExpenseModalVisible);
  };

  const printToFile = async () => {
    setLoadingIndicator(true);
    // On iOS/android prints the given html. On web prints the HTML from the current page.
    Print.printToFileAsync({ html })
      .then(async (res) => {
        setLoadingIndicator(false);
        if (res) {
          await shareAsync(res.uri, {
            UTI: ".pdf",
            mimeType: "application/pdf",
          });
        }
      })
      .catch((err) => {
        setLoadingIndicator(false);
        console.log(err);
      });
  };

  return (
    <SafeAreaView style={styles.topContainer}>
      <TopBar
        title={`${tripName}`}
        leftButton={
          <DibbyButton
            type="clear"
            onPress={() => navigation.navigate("Home")}
            title={
              <FontAwesomeIcon
                icon={faChevronLeft}
                size={24}
                color={colors.background.text}
              />
            }
          />
        }
        rightButton={
          <DibbyButton
            onPress={() =>
              Platform.OS === "web"
                ? navigation.navigate("PrintPDF", { tripId })
                : printToFile()
            }
            type="clear"
            title={
              <FontAwesomeIcon
                icon={faFilePdf}
                size={24}
                color={colors.background.text}
              />
            }
          />
        }
      />
      {loadingIndicator && (
        <View style={[styles.loadingContainer]}>
          <ActivityIndicator size="large" color={colors.primary.background} />
        </View>
      )}

      <TouchableOpacity
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginHorizontal: 16,
          marginTop: 16,
          marginBottom: summaryOpen ? 0 : 16,
        }}
        onPress={() => setSummaryOpen(!summaryOpen)}
      >
        <Text style={[styles.title]}>Summary</Text>
        <FontAwesomeIcon
          icon={summaryOpen ? faCaretUp : faCaretDown}
          size={16}
          color={colors.background.text}
        />
      </TouchableOpacity>

      {calculatedTrip && summaryOpen && (
        <View
          style={{
            alignItems: "center",
            backgroundColor: colors.background.paper,
            margin: 16,
            // padding: 8,
            borderRadius: 10,
          }}
        >
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableText, styles.headerText]}>
                Traveler
              </Text>
              <Text style={[styles.tableText, styles.headerText]}>Status</Text>
              <Text style={[styles.tableText, styles.headerText]}>Owed</Text>
              <Text style={[styles.tableText, styles.headerText]}>Paid</Text>
            </View>
            <Divider
              color={colors.disabled.button}
              style={{
                marginHorizontal: 16,
                marginBottom: 16,
              }}
            />
            {currentTrip?.travelers.map((t) => {
              return (
                <View key={t.id} style={styles.tableRow}>
                  <Text style={{ ...styles.tableText, color: t.color }}>
                    {t.name}
                  </Text>
                  <Text
                    style={{
                      ...styles.tableText,
                      color:
                        t.owed > 0
                          ? colors.info.background
                          : t.owed < 0
                          ? colors.danger.button
                          : colors.background.text,
                    }}
                  >
                    {t.owed > 0 ? "is owed" : t.owed < 0 ? "owes" : ""}
                  </Text>
                  <Text style={styles.tableText}>
                    ${numberWithCommas(Math.abs(t.owed).toString())}
                  </Text>
                  <Text style={styles.tableText}>
                    ${numberWithCommas(t.amountPaid.toString())}
                  </Text>
                </View>
              );
            })}
            <Divider
              color={colors.disabled.button}
              style={{
                marginBottom: 16,
              }}
            />
            <View style={styles.tableRow}>
              <Text style={[styles.tableText, styles.headerText]}>Total</Text>
              <Text style={[styles.tableText, styles.headerText]}></Text>
              <Text
                style={[
                  styles.tableText,
                  styles.headerText,
                  {
                    color: inRange(
                      sumOfValues(currentTrip?.travelers.map((t) => t.owed)),
                      -0.01,
                      0.01
                    )
                      ? colors.success.background
                      : colors.danger.button,
                  },
                ]}
              >
                $
                {inRange(
                  sumOfValues(
                    currentTrip?.travelers.map((t) => {
                      return t.owed;
                    })
                  ),
                  -0.01,
                  0.01
                )
                  ? 0
                  : sumOfValues(
                      currentTrip?.travelers.map((t) => {
                        return t.owed;
                      })
                    )}
              </Text>
              <Text
                style={[
                  styles.tableText,
                  styles.headerText,
                  {
                    color:
                      sumOfValues(
                        currentTrip?.travelers.map((t) => t.amountPaid)
                      ) === currentTrip?.amount
                        ? colors.success.background
                        : colors.danger.button,
                  },
                ]}
              >
                $
                {numberWithCommas(
                  sumOfValues(
                    currentTrip?.travelers.map((t) => t.amountPaid)
                  ).toString()
                )}
              </Text>
            </View>
          </View>

          <View style={{ padding: 16, width: "100%" }}>
            {calculatedTrip?.transactions?.map((t, i) => (
              <Text
                style={{
                  color: colors.background.text,
                  fontSize: 14,
                  marginTop: 16,
                }}
                key={i}
              >
                {getTransactionString(t)}
              </Text>
            ))}

            <Text
              numberOfLines={1}
              style={{
                color: colors.background.text,
                fontSize: 14,
                marginVertical: 16,
              }}
            >
              {getAmountOfTransactionsString(
                calculatedTrip.finalNumberOfTransactions
              )}
            </Text>
          </View>
        </View>
      )}

      <Divider
        color={colors.disabled.button}
        style={{
          marginHorizontal: 16,
        }}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          margin: 16,
        }}
      >
        <Text style={styles.title}>
          Expenses - ${numberWithCommas(currentTrip?.amount.toString())}
        </Text>
        <TouchableOpacity
          style={{
            flexDirection: "row",
          }}
          onPress={() =>
            navigation.navigate("ViewTravelers", {
              tripName: currentTrip!!.name,
              tripId: currentTrip!!.id,
            })
          }
        >
          {currentTrip?.travelers?.map((item, index) => {
            if (index < 4) {
              return (
                <Avatar
                  key={item.id}
                  size="small"
                  rounded
                  title={
                    index !== 3
                      ? getInitials(item.name)
                      : `+${currentTrip?.travelers.length!! - 3}`
                  }
                  titleStyle={{
                    color:
                      index !== 3 ? colors.background.paper : colors.light.text,
                  }}
                  containerStyle={{
                    marginLeft: -10,
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: item.me ? userColors[0].border : item.color,
                  }}
                  overlayContainerStyle={{
                    backgroundColor: item.me
                      ? userColors[0].background
                      : index !== 3
                      ? item.color
                      : colors.light.background,
                    opacity: 0.95,
                  }}
                />
              );
            }
          })}
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.grid}>
          {expenses.length > 0 ? (
            <FlatList
              data={expenses}
              key={numColumns}
              numColumns={numColumns}
              keyExtractor={(expense) => expense.id}
              renderItem={({ item }) => (
                <Card
                  expense={item}
                  trip={currentTrip}
                  onDeleteItem={() => deleteAlert(item)}
                  cardWidth={cardWidth}
                  wideScreen={wideScreen}
                  onPress={() =>
                    navigation.navigate("ViewExpense", {
                      tripName,
                      tripId,
                      expenseId: item.id,
                    })
                  }
                  expandable={true}
                />
              )}
            />
          ) : (
            <View>
              <Text style={styles.emptyText}>
                No expenses yet. Add some below!
              </Text>
            </View>
          )}

          <DibbyButton add onPress={toggleCreateExpenseModal} />
          <Modal
            animationType="slide"
            visible={isCreateExpenseModalVisible}
            onRequestClose={toggleCreateExpenseModal}
          >
            {loggedInUser && (
              <CreateExpense
                currentUser={loggedInUser}
                onPressBack={toggleCreateExpenseModal}
                tripInfo={currentTrip}
              />
            )}
          </Modal>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ViewTrip;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      position: "absolute",
      height: "100%",
      width: "100%",
      zIndex: 3000,
      backgroundColor: "#00000099",
    },
    grid: {
      flex: 1,
      display: "flex",
      margin: 16,
    },
    title: {
      fontSize: 20,
      color: colors.background.text,
    },
    emptyText: {
      color: colors.background.text,
      textAlign: "center",
    },
    avatarContainer: {},
    table: {
      display: "flex",
      alignSelf: "stretch",
      marginHorizontal: 16,
    },
    tableRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 20,
      textTransform: "capitalize",
    },
    tableHeader: {
      paddingTop: 16,
    },
    tableText: {
      color: colors.background.text,
    },
    headerText: {
      fontWeight: "bold",
    },
  });
