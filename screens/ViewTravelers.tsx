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
import { useUser } from "../hooks/useUser";
import { doc, onSnapshot } from "firebase/firestore";
import { Trip, TripDoc } from "../constants/DibbyTypes";
import { db } from "../firebase";
import { Card } from "../components/Card";
import AddTraveler from "../components/AddTraveler";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";

const windowWidth = Dimensions.get("window").width;
const numColumns = Math.floor(windowWidth / 500);

const ViewTravelers = ({ route }: any) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();
  const { tripName, tripId } = route.params;
  const { username, loggedInUser, photoURL, setUsername, setPhotoURL } =
    useUser();
  const [currentTrip, setCurrentTrip] = useState<Trip>();
  const [isAddTravelerModalVisible, setIsAddTravelerModalVisible] =
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

  const toggleAddTravelerModal = () => {
    setIsAddTravelerModalVisible(!isAddTravelerModalVisible);
  };

  return (
    <SafeAreaView style={styles.topContainer}>
      <TopBar
        title={`${currentTrip?.name}`}
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
            marginTop: 16,
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 10,
            borderRadius: 10,
          }}
        >
          {currentTrip?.travelers.map((t) => {
            return (
              <View
                key={t.id}
                style={{
                  margin: 8,
                  borderRadius: 20,
                  backgroundColor: t.color,
                  padding: 8,
                  alignItems: "flex-start",
                  flexDirection: "column",
                }}
              >
                <Text style={{ color: colors.background.text, fontSize: 16 }}>
                  {t.name}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      <TouchableOpacity
        onPress={toggleAddTravelerModal}
        style={{
          display: "flex",
          alignItems: "center",
          margin: 16,
          padding: 20,
          borderRadius: 16,
          backgroundColor: colors.info.button,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: colors.info.background,
        }}
      >
        <FontAwesomeIcon
          icon={faCirclePlus}
          size={24}
          color={colors.info.text}
        />
      </TouchableOpacity>
      <Modal
        animationType="slide"
        visible={isAddTravelerModalVisible}
        onRequestClose={toggleAddTravelerModal}
      >
        {loggedInUser && (
          <AddTraveler
            currentUser={loggedInUser}
            onPressBack={toggleAddTravelerModal}
            tripInfo={currentTrip!!}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
};

export default ViewTravelers;

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
