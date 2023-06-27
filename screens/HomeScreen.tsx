import {
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";

import { useNavigation, useTheme } from "@react-navigation/native";
import { useUser } from "../hooks/useUser";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import TopBar from "../components/TopBar";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import {
  onSnapshot,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { Expense, Trip, TripDoc } from "../constants/DibbyTypes";
import CreateTrip from "../components/CreateTrip";

const windowWidth = Dimensions.get("window").width;

const numColumns = Math.floor(windowWidth / 500);

const HomeScreen = () => {
  const [currentTrips, setCurrentTrips] = useState<Trip[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const navigation = useNavigation();
  const { username, loggedInUser, photoURL, setUsername, setPhotoURL } =
    useUser();

  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors);

  useEffect(() => {
    if (loggedInUser && loggedInUser.uid) {
      const unsub = onSnapshot(
        query(collection(db, loggedInUser.uid), orderBy("created", "desc")),
        (doc) => {
          const newData: Trip[] = doc.docs.flatMap((doc) => ({
            ...(doc.data() as TripDoc),
            id: doc.id,
          }));
          setCurrentTrips(newData);
        }
      );

      return () => {
        unsub();
      };
    }
  }, [loggedInUser]);

  const deleteTrip = async (e: any, trip: Trip | Expense) => {
    e.stopPropagation();
    await deleteDoc(doc(db, "trips", trip.id));
  };

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      })
      .catch((err) => {
        alert(err.message);
      });
  };

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);

  }

  return (
    <SafeAreaView style={styles.topContainer}>
      <TopBar title="Trips" signOut={handleSignOut} />
      <View style={styles.grid}>
        <FlatList
          key={numColumns}
          data={currentTrips}
          renderItem={({ item }) => <Card item={item as Trip} />}
          keyExtractor={(trip) => trip.id}
          numColumns={numColumns}
        />
        <Card add onPress={toggleModal} />
        <Modal
          animationType='slide'
          visible={isModalVisible}
          onRequestClose={toggleModal}>
          {
            loggedInUser &&
            <CreateTrip currentUser={loggedInUser} onPressBack={toggleModal} />
          }
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    grid: {
      flex: 1,
      display: "flex",
      margin: 16,
    },
  });
