import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
  View,
  useColorScheme,
  Text,
  TouchableOpacity,
} from "react-native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useTheme } from "@react-navigation/native";
import { faClose, faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Trip, TripDoc } from "../constants/DibbyTypes";
import { ITransactionResponse, calculateTrip } from "../helpers/DibbyLogic";
import { generateHTML } from "../constants/PdfTemplate";
import { useNavigation } from "@react-navigation/core";
import { ScrollView } from "react-native-gesture-handler";
import { useUser } from "../hooks/useUser";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../firebase";

const PdfScreen = ({ route }: any) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();
  const { tripId } = route.params;
  const { username, loggedInUser, photoURL, setUsername, setPhotoURL } =
    useUser();

  const [calculatedTrip, setCalculatedTrip] = useState<ITransactionResponse>();
  const [currentTrip, setCurrentTrip] = useState<Trip>();

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
    if (loggedInUser && loggedInUser.uid && currentTrip) {
      const copyOfTrip = JSON.parse(JSON.stringify(currentTrip));
      const newCalculatedTrip = calculateTrip(copyOfTrip);
      setCalculatedTrip(newCalculatedTrip);
    }
  }, [loggedInUser, currentTrip]);

  return (
    <SafeAreaView style={styles.topContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faClose} size={24} color={colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Summary</Text>
        <TouchableOpacity
          onPress={() => {
            try {
              document.execCommand("print", false, undefined);
            } catch (e) {
              window.print();
            }
          }}
        >
          <FontAwesomeIcon
            icon={faDownload}
            size={24}
            style={{ color: colors.light.text }}
          />
        </TouchableOpacity>
      </View>
      {calculatedTrip && currentTrip && (
        <div
          dangerouslySetInnerHTML={{
            __html: generateHTML(calculatedTrip, currentTrip),
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default PdfScreen;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      backgroundColor: colors.light.background,
      margin: 16,
      // height: "100%",
      // flex: 1,
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      flexDirection: "row",
    },
    title: {
      color: colors.light.text,
      fontSize: 22,
      width: 120,
    },
    content: {
      backgroundColor: colors.light.background,
      margin: 16,
      display: "flex",
    },
  });
