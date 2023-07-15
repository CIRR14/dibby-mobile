import {
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  View,
  useColorScheme,
  Text,
  Alert,
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
import { Platform } from "react-native";
import { wideScreen, windowWidth } from "../constants/DeviceWidth";

import { REACT_APP_VERSION } from "@env";
import DibbyButton from "../components/DibbyButton";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Avatar } from "@rneui/themed";
import { userColors } from "../helpers/GenerateColor";
import { getInitials } from "../helpers/AppHelpers";
import { LinearGradient } from "expo-linear-gradient";

const cardWidth = 500;
const numColumns = Math.floor(windowWidth / cardWidth);

const HomeScreen = () => {
  const [currentTrips, setCurrentTrips] = useState<Trip[]>([]);
  const [isCreateTripModalVisible, setIsCreateTripModalVisible] =
    useState(false);

  const navigation = useNavigation();
  const { loggedInUser } = useUser();

  const { colors } = useTheme() as unknown as ColorTheme;
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
  };

  const deleteAlert = (item: Trip | Expense) => {
    const title = `Are you sure you want to delete ${item.name}?`;
    const message = "This will be permanently deleted.";
    const options: {
      text: string;
      onPress?: (value?: string) => void;
      style?: "cancel" | "default" | "destructive" | undefined;
    }[] = [
      {
        text: "Cancel",
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel",
      },
      { text: "OK", onPress: () => deleteTrip(item as Trip) },
    ];

    if (Platform.OS === "web") {
      const result = window.confirm(
        [title, message].filter(Boolean).join("\n")
      );

      if (result) {
        const confirmOption = options.find(({ style }) => style !== "cancel");
        confirmOption && confirmOption.onPress && confirmOption.onPress();
      } else {
        const cancelOption = options.find(({ style }) => style === "cancel");
        cancelOption && cancelOption.onPress && cancelOption.onPress();
      }
    } else {
      Alert.alert(title, message, options);
    }
  };

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
          title="Trips"
          leftButton={
            <DibbyButton
              type="clear"
              onPress={handleSignOut}
              title={
                <FontAwesomeIcon
                  icon={faSignOutAlt}
                  size={24}
                  color={colors.background.text}
                />
              }
            />
          }
          rightButton={
            <DibbyButton
              type="clear"
              onPress={() => navigation.navigate("CreateProfile")}
              title={
                <Avatar
                  size="small"
                  rounded
                  title={getInitials(loggedInUser?.displayName)}
                  containerStyle={{
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor:
                      userColors[0].border || colors.primary.background,
                  }}
                  overlayContainerStyle={{
                    backgroundColor:
                      userColors[0].background || colors.primary.background,
                  }}
                  titleStyle={{
                    color: userColors[0].text || colors.primary.text,
                  }}
                />
              }
            />
          }
        />
        {loggedInUser && (
          <View style={styles.grid}>
            {currentTrips.length > 0 ? (
              <FlatList
                key={numColumns}
                data={currentTrips}
                renderItem={({ item }) => (
                  <Card
                    wideScreen={wideScreen}
                    cardWidth={cardWidth}
                    trip={item}
                    onDeleteItem={() => deleteAlert(item)}
                    onPress={() =>
                      navigation.navigate("ViewTrip", {
                        tripName: item.name,
                        tripId: item.id,
                      })
                    }
                  />
                )}
                keyExtractor={(trip) => trip.id}
                numColumns={numColumns}
              />
            ) : (
              <View>
                <Text style={styles.emptyText}>
                  No trips yet. Add some below!
                </Text>
              </View>
            )}
            <DibbyButton add onPress={toggleCreateTripModal} />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                width: "100%",
                alignItems: "center",
                zIndex: 1999,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: colors.background.text,
                }}
              >
                {Platform.OS === "web"
                  ? process.env.REACT_APP_VERSION
                  : REACT_APP_VERSION}
              </Text>
            </View>
            <Modal
              animationType="slide"
              visible={isCreateTripModalVisible}
              onRequestClose={toggleCreateTripModal}
            >
              {loggedInUser && (
                <CreateTrip
                  currentUser={loggedInUser}
                  onPressBack={toggleCreateTripModal}
                />
              )}
            </Modal>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

export default HomeScreen;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
    },
    grid: {
      flex: 1,
      display: "flex",
      margin: 16,
    },
    emptyText: {
      color: colors.primary.text,
      textAlign: "center",
    },
  });
