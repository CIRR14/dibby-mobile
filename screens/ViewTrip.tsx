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
import { Expense, Trip, TripDoc } from "../constants/DibbyTypes";
import { db } from "../firebase";
import { Card } from "../components/Card";
import CreateExpense from "../components/CreateExpense";
import { getInitials } from "../helpers/AppHelpers";
import { userColors } from "../helpers/GenerateColor";

const windowWidth = Dimensions.get("window").width;
const numColumns = Math.floor(windowWidth / 500);

const ViewTrip = ({ route }: any) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();
  const { tripName, tripId } = route.params;
  const { username, loggedInUser, photoURL, setUsername, setPhotoURL } =
    useUser();
  const [currentTrip, setCurrentTrip] = useState<Trip>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isCreateExpenseModalVisible, setIsCreateExpenseModalVisible] =
    useState(false);

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
    if (loggedInUser) {
      const newExpArr = currentTrip?.expenses.filter(
        (e) => e.id !== expense.id
      );
      const expenseRef = doc(db, loggedInUser.uid, tripId);
      await updateDoc(expenseRef, {
        expenses: newExpArr,
      });
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

  return (
    <SafeAreaView style={styles.topContainer}>
      <TopBar
        title={`${tripName}`}
        onPressBack={() => navigation.navigate("Home")}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          margin: 16,
        }}
      >
        <Text style={styles.title}> Expenses - ${currentTrip?.amount} </Text>
        <View
          style={{
            flexDirection: "row",
          }}
        >
          {currentTrip?.travelers.map((item, index) => {
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
                  color: item.me
                    ? userColors[0].text
                    : index !== 3
                    ? colors.background.paper
                    : colors.light.text,
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
          })}
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.grid}>
          {expenses.length > 0 ? (
            <FlatList
              data={expenses}
              key={numColumns}
              numColumns={numColumns}
              listKey={numColumns.toString()}
              keyExtractor={(expense) => expense.id}
              renderItem={({ item }) => (
                <Card
                  expense={item}
                  trip={currentTrip}
                  onDeleteItem={() => deleteAlert(item)}
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
          <Card add onPress={toggleCreateExpenseModal} />
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
    grid: {
      flex: 1,
      display: "flex",
      margin: 16,
    },
    title: {
      //   marginLeft: 16,
      //   marginTop: 16,
      fontSize: 20,
      // fontWeight: 'bold',
      // textAlign: 'center',
      color: colors.background.text,
    },
    emptyText: {
      color: colors.background.text,
      textAlign: "center",
    },
    avatarContainer: {
      //   display: "flex",
      //   flexDirection: "row",
      //   justifyContent: "center",
      //   marginTop: 8,
    },
  });
