import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../components/TopBar";
import { useNavigation } from "@react-navigation/core";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { FlatList } from "react-native-gesture-handler";
import { useUser } from "../hooks/useUser";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { DibbyExpense, DibbyTrip } from "../constants/DibbyTypes";
import { db } from "../firebase";
import { DibbyCard } from "../components/DibbyCard";
import CreateExpense from "../components/CreateExpense";
import { numberWithCommas } from "../helpers/AppHelpers";
import { ITransactionResponse, calculateTrip } from "../helpers/DibbyLogic";
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
import { LinearGradient } from "expo-linear-gradient";
import DibbyAvatars from "../components/DibbyAvatars";
import DibbyLoading from "../components/DibbyLoading";
import DibbySummary from "../components/DibbySummary";
import { deleteDibbyExpense } from "../helpers/FirebaseHelpers";

const cardWidth = 500;
const numColumns = Math.floor(windowWidth / cardWidth);

const ViewTrip = ({ route }: any) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();
  const { tripName, tripId } = route.params;
  const { dibbyUser } = useUser();
  const [currentTrip, setCurrentTrip] = useState<DibbyTrip>();
  const [expenses, setExpenses] = useState<DibbyExpense[]>([]);
  const [calculatedTrip, setCalculatedTrip] = useState<ITransactionResponse>();
  const [summaryOpen, setSummaryOpen] = useState<boolean>(false);
  const [isCreateExpenseModalVisible, setIsCreateExpenseModalVisible] =
    useState(false);

  const [html, setHtml] = useState<string>("");
  const [loadingIndicator, setLoadingIndicator] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchTrip = useCallback(async () => {
    const docRef = doc(db, "trips", tripId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setCurrentTrip(docSnap.data() as DibbyTrip);
    } else {
      console.log("No such document!");
    }
  }, [tripId]);

  const onRefresh = useCallback(async () => {
    if (dibbyUser?.uid) {
      setRefreshing(true);
      await fetchTrip();
      setRefreshing(false);
    }
  }, [dibbyUser]);

  useEffect(() => {
    setLoadingIndicator(true);
    const unsub = onSnapshot(doc(db, "trips", tripId), (trip) => {
      setCurrentTrip(trip.data() as DibbyTrip);
      setLoadingIndicator(false);
    });

    return () => {
      unsub();
    };
  }, [tripId]);

  useEffect(() => {
    if (calculatedTrip && currentTrip) {
      setHtml(generateHTML(calculatedTrip, currentTrip));
    }
  }, [calculatedTrip, currentTrip]);

  useEffect(() => {
    if (dibbyUser?.uid && currentTrip) {
      const copyOfTrip = JSON.parse(JSON.stringify(currentTrip));
      const newCalculatedTrip = calculateTrip(copyOfTrip);
      setCalculatedTrip(newCalculatedTrip);
    }
  }, [dibbyUser, currentTrip]);

  useEffect(() => {
    if (currentTrip) {
      setExpenses(
        currentTrip.expenses.sort(
          (a, b) =>
            b.dateCreated.toDate().getTime() - a.dateCreated.toDate().getTime()
        )
      );
    }
  }, [currentTrip]);

  const deleteExpense = async (expense: DibbyExpense) => {
    if (currentTrip) {
      await deleteDibbyExpense(expense, currentTrip);
    }
  };

  const deleteAlert = (item: DibbyExpense) =>
    Alert.alert(
      `Are you sure you want to delete ${item.title}?`,
      "This will be permanently deleted.",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        { text: "OK", onPress: () => deleteExpense(item) },
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
    <LinearGradient
      style={styles.topContainer}
      colors={[...colors.background.gradient]}
    >
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

        {calculatedTrip && summaryOpen && currentTrip && (
          <DibbySummary
            currentTrip={currentTrip}
            calculatedTrip={calculatedTrip}
          />
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
          {currentTrip?.participants && (
            <DibbyAvatars
              onPress={() =>
                navigation.navigate("ViewTravelers", {
                  tripName: currentTrip.title,
                  tripId: currentTrip.id,
                })
              }
              travelers={currentTrip?.participants}
            />
          )}
        </View>

        <View style={styles.container}>
          <View style={styles.grid}>
            {loadingIndicator ? (
              <DibbyLoading />
            ) : (
              <FlatList
                data={expenses}
                key={numColumns}
                numColumns={numColumns}
                keyExtractor={(expense) => expense.id}
                style={{ paddingBottom: 30 }}
                ListEmptyComponent={
                  <View>
                    <Text style={styles.emptyText}>
                      No expenses yet. Add some below!
                    </Text>
                  </View>
                }
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
                renderItem={({ item }) => (
                  <DibbyCard
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
                  />
                )}
              />
            )}

            <DibbyButton add onPress={toggleCreateExpenseModal} />
            <Modal
              animationType="slide"
              visible={isCreateExpenseModalVisible}
              onRequestClose={toggleCreateExpenseModal}
            >
              {dibbyUser && (
                <CreateExpense
                  currentUser={dibbyUser}
                  onPressBack={toggleCreateExpenseModal}
                  tripInfo={currentTrip}
                />
              )}
            </Modal>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ViewTrip;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
    },
    container: {
      flex: 1,
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
  });
