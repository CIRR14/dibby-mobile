import React, { useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  KeyboardAvoidingView,
} from "react-native";
import { ThemeColors } from "../constants/Colors";
import { useNavigation } from "@react-navigation/native";
import { db } from "../firebase";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { DibbyParticipant, DibbyTrip } from "../constants/DibbyTypes";

import {
  Timestamp,
  arrayUnion,
  collection,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Controller, useForm } from "react-hook-form";
import { capitalizeName } from "../helpers/AppHelpers";
import DibbyButton from "./DibbyButton";
import TopBar from "./TopBar";
import DibbyInput from "./DibbyInput";
import DibbyLoading from "./DibbyLoading";
import { useUser } from "../hooks/useUser";
import { createDibbyTrip } from "../helpers/FirebaseHelpers";
import { DibbySearchUsername } from "./DibbySearchUsername";
import NeumoSurface from "./NeumoSurface";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";
import { assignUniqueParticipantColors } from "../helpers/GenerateColor";

export interface DibbyTripFormValues {
  title: string;
  description: string;
  participants: DibbyParticipant[];
}

const CreateTrip = () => {
  const colors = useAppTheme();
  const navigation = useNavigation();
  const { dibbyUser } = useUser();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedResults, setSelectedResults] = useState<DibbyParticipant[]>(
    []
  );
  const needsMoreTravelers = selectedResults.length <= 1;

  const initialValues = {
    title: "",
    description: "",
    participants: [],
  };

  const { handleSubmit, formState, control, reset } = useForm({
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: initialValues,
  });

  const onSubmit = async (data: DibbyTripFormValues) => {
    if (dibbyUser) {
      const newTripRef = doc(collection(db, "trips"));
      const participantsWithColors = assignUniqueParticipantColors(
        selectedResults
      );

      const newTripData: DibbyTrip = {
        ...data,
        id: newTripRef.id,
        amount: 0,
        completed: false,
        expenses: [],
        title: capitalizeName(data.title),
        perPersonAverage: 0,
        dateCreated: Timestamp.now(),
        dateUpdated: Timestamp.now(),
        participants: participantsWithColors,
        createdBy: dibbyUser.uid,
      };

      const usersToAddTripTo = participantsWithColors.filter(
        (r) => r && !r.createdUser
      );

      try {
        await createDibbyTrip(newTripData, newTripRef, usersToAddTripTo);
        setIsLoading(false);
        reset();
        navigation.navigate("Home");
      } catch (error) {
        console.log(error);
        setIsLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.topContainer}>
      <TopBar
        title={"Add Trip"}
        leftButton={
          <DibbyButton
            onPress={() => navigation.navigate("Home")}
            type="clear"
            title={
              <FontAwesomeIcon
                icon={faClose}
                size={24}
                color={colors.textPrimary}
              />
            }
          />
        }
      />
      {isLoading ? (
        <DibbyLoading />
      ) : (
        <View style={styles.content}>
          <KeyboardAvoidingView
            behavior="padding"
            enabled
            keyboardVerticalOffset={150}
          >
            <NeumoSurface
              variant="raised"
              tone="surface"
              radius={NeumoTokens.radius.lg}
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Trip details</Text>
              <Controller
                control={control}
                name="title"
                rules={{
                  required: true,
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <DibbyInput
                    placeholder="Name of Trip"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    clearButtonMode="always"
                  />
                )}
              />
              <Text style={styles.helperText}>
                Trip name helps everyone recognize it.
              </Text>
              {formState.errors.title && (
                <Text style={styles.errorText}>Trip must have a name.</Text>
              )}
            </NeumoSurface>

            <NeumoSurface
              variant="raised"
              tone="surface"
              radius={NeumoTokens.radius.lg}
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Travelers</Text>
              <Text style={styles.searchHint}>
                Search by username or add a guest name.
              </Text>
              <DibbySearchUsername
                results={(res) => setSelectedResults(res)}
                selectLoggedInUser
              />
              <View style={styles.legendRow}>
                <View style={[styles.legendPill, styles.legendGuest]}>
                  <Text style={styles.legendGuestText}>Guest (no account)</Text>
                </View>
                <View style={[styles.legendPill, styles.legendUser]}>
                  <Text style={styles.legendUserText}>Dibby user</Text>
                </View>
              </View>
              <Text style={styles.helperText}>
                Select at least two travelers to create a trip.
              </Text>
            </NeumoSurface>

            <DibbyButton
              onPress={handleSubmit(onSubmit)}
              disabled={!formState.isValid || needsMoreTravelers}
              title="Add Trip"
              fullWidth
            />
            {needsMoreTravelers && (
              <Text style={styles.helperTextCentered}>
                Add one more traveler to continue.
              </Text>
            )}
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CreateTrip;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    travelerContainer: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    sectionCard: {
      marginBottom: 16,
      gap: 12,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
    },
    searchHint: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      marginBottom: 8,
    },
    legendRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
      marginBottom: 4,
    },
    legendPill: {
      borderRadius: NeumoTokens.radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    legendGuest: {
      backgroundColor: colors.success.background,
    },
    legendGuestText: {
      color: colors.success.text,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
    },
    legendUser: {
      backgroundColor: colors.surfaceAlt,
    },
    legendUserText: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
    },
    errorText: {
      color: colors.danger.background,
      marginTop: 8,
    },
    helperText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
    },
    helperTextCentered: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      textAlign: "center",
      marginTop: 8,
    },
    content: {
      margin: 16,
      gap: 12,
    },
  });
