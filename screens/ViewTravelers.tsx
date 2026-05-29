import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../components/TopBar";
import { useNavigation } from "@react-navigation/native";
import { ThemeColors } from "../constants/Colors";
import { useUser } from "../hooks/useUser";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import DibbyButton from "../components/DibbyButton";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { DibbyParticipant, DibbyTrip } from "../constants/DibbyTypes";
import { addDibbyParticipant } from "../helpers/FirebaseHelpers";
import { DibbySearchUsername } from "../components/DibbySearchUsername";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";
import { formatTitleWithEmoji } from "../helpers/AppHelpers";

const ViewTravelers = ({ route }: any) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();
  const { tripName, tripId } = route.params;
  const { dibbyUser } = useUser();
  const [currentTrip, setCurrentTrip] = useState<DibbyTrip>();
  const tripTitle = formatTitleWithEmoji(
    currentTrip?.title || tripName,
    currentTrip?.emoji,
  );
  const [selectedResults, setSelectedResults] = useState<DibbyParticipant[]>(
    [],
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
    <View style={styles.topContainer}>
      <SafeAreaView style={styles.topContainer}>
        <TopBar
          title={tripTitle}
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
                  color={colors.textPrimary}
                />
              }
            />
          }
        />

        <View
          style={styles.sectionCard}
        >
          <Text style={styles.sectionTitle}>Travelers</Text>
          <View style={styles.travelerList}>
            {currentTrip?.participants.map((t) => {
              return (
                <View
                  key={t.uid}
                  style={styles.travelerChip}
                >
                  <Text style={styles.travelerName}>{t.name}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View
          style={styles.sectionCard}
        >
          <Text style={styles.sectionTitle}>Add traveler</Text>
          <DibbySearchUsername
            results={(res) => setSelectedResults(res)}
            currentTrip={currentTrip}
          />

          <DibbyButton
            disabled={selectedResults.length < 1}
            title={`Add traveler to ${tripTitle}`}
            onPress={onSubmit}
            fullWidth
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

export default ViewTravelers;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    sectionCard: {
      marginHorizontal: 16,
      marginTop: 16,
      gap: 12,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
    },
    travelerList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    travelerChip: {
      backgroundColor: colors.surfaceAlt,
    },
    travelerName: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
    },
  });
