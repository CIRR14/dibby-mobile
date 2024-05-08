import {
  FlatList,
  StyleSheet,
  View,
  Text,
  Alert,
  RefreshControl,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";

import { useNavigation, useTheme } from "@react-navigation/native";
import { useUser } from "../hooks/useUser";
import { SafeAreaView } from "react-native-safe-area-context";
import { DibbyCard } from "../components/DibbyCard";
import TopBar from "../components/TopBar";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import {
  onSnapshot,
  collection,
  doc,
  query,
  updateDoc,
  getDocs,
  where,
  documentId,
} from "firebase/firestore";
import { DibbyTrip } from "../constants/DibbyTypes";
import { Platform } from "react-native";
import { wideScreen, windowWidth } from "../constants/DeviceWidth";
import DibbyButton from "../components/DibbyButton";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Avatar } from "@rneui/themed";
import { getInitials } from "../helpers/AppHelpers";
import { LinearGradient } from "expo-linear-gradient";
import DibbyVersion from "../components/DibbyVersion";
import DibbyLoading from "../components/DibbyLoading";
import { deleteDibbyTrip } from "../helpers/FirebaseHelpers";

const cardWidth = 500;
const numColumns = Math.floor(windowWidth / cardWidth);

const HomeScreen = () => {
  const [currentTrips, setCurrentTrips] = useState<DibbyTrip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const navigation = useNavigation();
  const { dibbyUser } = useUser();

  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors);

  const fetchTrips = useCallback(async () => {
    if (dibbyUser?.trips.length && dibbyUser?.trips.length > 0) {
      const q = query(
        collection(db, "trips"),
        where(documentId(), "in", dibbyUser!!.trips)
        // orderBy("dateCreated", "desc")
      );
      const querySnapshot = await getDocs(q);
      const trips: DibbyTrip[] = [];
      querySnapshot.forEach((doc) => {
        trips.push(doc.data() as DibbyTrip);
      });
      return trips;
    } else {
      return [];
    }
  }, [dibbyUser?.trips]);

  const onRefresh = useCallback(async () => {
    if (dibbyUser?.uid) {
      setRefreshing(true);
      const trips = await fetchTrips();
      setCurrentTrips(trips);
      setRefreshing(false);
    }
  }, [dibbyUser]);

  useEffect(() => {
    const tripsExist = dibbyUser?.trips.length && dibbyUser?.trips.length > 0;
    if (dibbyUser?.uid && tripsExist) {
      const q = query(
        collection(db, "trips"),
        where(documentId(), "in", dibbyUser.trips)
        // orderBy("dateCreated", "desc")
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const trips: DibbyTrip[] = [];
        querySnapshot.forEach((doc) => {
          trips.push(doc.data() as DibbyTrip);
        });
        setCurrentTrips(trips);
      });

      return () => unsubscribe();
    }
    if (!tripsExist) {
      setLoading(false);
    }
  }, [dibbyUser]);

  const completeTrip = async (trip: DibbyTrip, complete: boolean) => {
    const tripRef = doc(db, "trips", trip.id);
    await updateDoc(tripRef, { completed: complete });
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

  const deleteAlert = (item: DibbyTrip) => {
    const tripOwner = dibbyUser?.uid === item.createdBy;
    const title = tripOwner
      ? `Are you sure you want to delete ${item.title}?`
      : "Only the owner can delete this trip!";
    const message = tripOwner ? "This will be permanently deleted." : "";
    const options: {
      text: string;
      onPress?: (value?: string) => void;
      style?: "cancel" | "default" | "destructive" | undefined;
    }[] = [
      {
        text: tripOwner ? "Cancel" : "Close",
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel",
      },
    ];

    tripOwner &&
      options.push({
        text: "Delete",
        onPress: async () => await deleteDibbyTrip(item),
        style: "destructive",
      });

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
      colors={[...colors.background.gradient]}
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
              onPress={() => {
                navigation.navigate("Profile");
              }}
              title={
                <Avatar
                  size="small"
                  rounded
                  source={{
                    uri: dibbyUser?.photoURL || undefined,
                  }}
                  title={
                    dibbyUser?.photoURL || getInitials(dibbyUser?.displayName)
                  }
                  containerStyle={{
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: colors.dark.background,
                  }}
                  overlayContainerStyle={{
                    backgroundColor:
                      dibbyUser?.color || colors.primary.background,
                  }}
                  titleStyle={{
                    color: colors.primary.text,
                  }}
                />
              }
            />
          }
        />
        {dibbyUser && (
          <View style={styles.grid}>
            {loading ? (
              <DibbyLoading />
            ) : (
              <FlatList
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
                style={{ paddingBottom: 30 }}
                key={numColumns}
                data={currentTrips}
                keyExtractor={(trip) => trip.id}
                numColumns={numColumns}
                ListEmptyComponent={
                  <View>
                    <Text style={styles.emptyText}>
                      No trips yet. Add some below!
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <DibbyCard
                    wideScreen={wideScreen}
                    cardWidth={cardWidth}
                    trip={item}
                    completed={item.completed}
                    onDeleteItem={() => deleteAlert(item)}
                    onCompleteItem={(complete) => completeTrip(item, complete)}
                    onPress={() =>
                      navigation.navigate("ViewTrip", {
                        tripName: item.title,
                        tripId: item.id,
                      })
                    }
                  />
                )}
              />
            )}
            <DibbyButton
              add
              onPress={() => navigation.navigate("CreateTrip")}
            />
            <DibbyVersion />
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
      color: colors.background.text,
      textAlign: "center",
    },
  });
