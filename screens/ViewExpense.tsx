import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  useColorScheme,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../components/TopBar";
import { useNavigation, useTheme } from "@react-navigation/native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { FlatList } from "react-native-gesture-handler";
import { useUser } from "../hooks/useUser";
import { Avatar } from "@rneui/themed";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { Expense, Traveler, Trip, TripDoc } from "../constants/DibbyTypes";
import { db } from "../firebase";
import { Card } from "../components/Card";
import CreateExpense from "../components/CreateExpense";
import { getInitials } from "../helpers/AppHelpers";
import { userColors } from "../helpers/GenerateColor";

const windowWidth = Dimensions.get("window").width;
const numColumns = Math.floor(windowWidth / 500);

const ViewExpense = ({ route }: any) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();
  const { tripName, tripId, expenseId } = route.params;
  const { username, loggedInUser, photoURL, setUsername, setPhotoURL } =
    useUser();
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
    <SafeAreaView style={styles.topContainer}>
      <TopBar
        title={`${currentExpense?.name}`}
        onPressBack={() =>
          navigation.navigate("ViewTrip", { tripName, tripId })
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

        {currentExpense && (
          <FlatList
            data={currentExpense.peopleInExpense}
            key={numColumns}
            numColumns={numColumns}
            listKey={numColumns.toString()}
            keyExtractor={(item) => item}
            style={{ marginVertical: 16 }}
            renderItem={({ item }) => {
              const traveler: Traveler | undefined =
                currentTrip?.travelers.find((t) => t.id === item);
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
                    ${currentTrip?.perPerson.toFixed(2)}{" "}
                  </Text>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default ViewExpense;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    title: {
      fontSize: 20,
      color: colors.background.text,
      textTransform: "capitalize",
    },
  });
