import {
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  View,
  useColorScheme,
  Text,
  Alert
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
import { TouchableOpacity } from "react-native-gesture-handler";

const windowWidth = Dimensions.get("window").width;

const numColumns = Math.floor(windowWidth / 500);

const HomeScreen = () => {
  const [currentTrips, setCurrentTrips] = useState<Trip[]>([]);
  const [isCreateTripModalVisible, setIsCreateTripModalVisible] = useState(false);

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

  const deleteTrip = async (trip: Trip) => {
    await deleteDoc(doc(db, loggedInUser!!.uid, trip.id));
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

  const toggleCreateTripModal = () => {
    setIsCreateTripModalVisible(!isCreateTripModalVisible);
  }

  const deleteAlert = (item: Trip | Expense) =>
    Alert.alert(`Are you sure you want to delete ${item.name}?`, 'This will be permanently deleted.', [
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      { text: 'OK', onPress: () => deleteTrip(item as Trip) },
    ]);


  return (
    <SafeAreaView style={styles.topContainer}>
      <TopBar title="Trips" signOut={handleSignOut} />
      {
        loggedInUser &&
        <View style={styles.grid}>
          <FlatList
            key={numColumns}
            data={currentTrips}
            renderItem={({ item }) => <Card
              item={item as Trip}
              onDeleteItem={() => deleteAlert(item)}
              onPress={() => { console.log('open trip') }}
            />}
            keyExtractor={(trip) => trip.id}
            numColumns={numColumns}
          />
          <Card add onPress={toggleCreateTripModal} />
          <Modal
            animationType='slide'
            visible={isCreateTripModalVisible}
            onRequestClose={toggleCreateTripModal}>
            {
              loggedInUser &&
              <CreateTrip currentUser={loggedInUser} onPressBack={toggleCreateTripModal} />
            }
          </Modal>
        </View>

      }
    </SafeAreaView>
  );
};

export default HomeScreen;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    grid: {
      flex: 1,
      display: "flex",
      margin: 16,
    },
  });
