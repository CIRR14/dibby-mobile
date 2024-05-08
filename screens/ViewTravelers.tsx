import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../components/TopBar";
import { useNavigation, useTheme } from "@react-navigation/native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useUser } from "../hooks/useUser";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import DibbyButton from "../components/DibbyButton";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { LinearGradient } from "expo-linear-gradient";
import { DibbyParticipant, DibbyTrip } from "../constants/DibbyTypes";
import { addDibbyParticipant } from "../helpers/FirebaseHelpers";
import { DibbySearchUsername } from "../components/DibbySearchUsername";
import { changeOpacity } from "../helpers/GenerateColor";
import {
  linearGradientEnd,
  linearGradientStart,
} from "../constants/DeviceWidth";

const ViewTravelers = ({ route }: any) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();
  const { tripName, tripId } = route.params;
  const { dibbyUser } = useUser();
  const [currentTrip, setCurrentTrip] = useState<DibbyTrip>();
  const [selectedResults, setSelectedResults] = useState<DibbyParticipant[]>(
    []
  );

  useEffect(() => {
    if (dibbyUser?.uid) {
      const unsub = onSnapshot(doc(db, "trips", tripId), (doc) => {
        const newData: DibbyTrip = doc.data() as DibbyTrip;
        setCurrentTrip(newData);
      });

      return () => {
        unsub();
      };
    }
  }, [dibbyUser, tripId]);

  const onSubmit = async () => {
    if (currentTrip) {
      try {
        addDibbyParticipant(selectedResults, currentTrip);
        navigation.navigate("ViewTrip", { tripName, tripId });
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    }
  };

  return (
    <LinearGradient
      style={styles.topContainer}
      colors={[...colors.background.gradient]}
    >
      <SafeAreaView style={styles.topContainer}>
        <TopBar
          title={`${currentTrip?.title}`}
          leftButton={
            <DibbyButton
              type="clear"
              onPress={() =>
                navigation.navigate("ViewTrip", { tripName, tripId })
              }
              title={
                <FontAwesomeIcon
                  icon={faChevronLeft}
                  size={24}
                  color={colors.background.text}
                />
              }
            />
          }
        />

        <View
          style={{
            marginTop: 16,
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            padding: 10,
            borderRadius: 10,
            flexWrap: "wrap",
          }}
        >
          {currentTrip?.participants.map((t) => {
            return (
              <LinearGradient
                key={t.uid}
                style={{
                  margin: 8,
                  borderRadius: 20,
                  backgroundColor: colors.background.default,
                  padding: 10,
                  alignItems: "flex-start",
                  flexDirection: "column",
                  minWidth: 120,
                }}
                colors={[changeOpacity(t.color, 0.7), t.color]}
                start={linearGradientStart}
                end={linearGradientEnd}
              >
                <Text
                  style={{
                    color: colors.background.text,
                    fontSize: 16,
                  }}
                >
                  {t.name}
                </Text>
              </LinearGradient>
            );
          })}
        </View>

        <View style={styles.formContainer}>
          <DibbySearchUsername
            results={(res) => setSelectedResults(res)}
            currentTrip={currentTrip}
          />

          <DibbyButton
            disabled={selectedResults.length < 1}
            title={`Add traveler to ${currentTrip?.title}`}
            onPress={onSubmit}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ViewTravelers;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      color: colors.background.text,
      textTransform: "capitalize",
    },
    input: {
      backgroundColor: colors.disabled?.button,
      color: colors.disabled?.text,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      marginBottom: 16,
      marginHorizontal: 8,
    },
    errorText: {
      color: colors.danger.background,
      marginTop: 8,
    },
    formContainer: {
      marginHorizontal: 16,
    },
  });
