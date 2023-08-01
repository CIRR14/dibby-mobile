import React, { useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  KeyboardAvoidingView,
} from "react-native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useNavigation, useTheme } from "@react-navigation/native";
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
import { collectionRef, createDibbyTrip } from "../helpers/FirebaseHelpers";
import { DibbySearchUsername } from "./DibbySearchUsername";

export interface DibbyTripFormValues {
  title: string;
  description: string;
  participants: DibbyParticipant[];
}

const CreateTrip = () => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const navigation = useNavigation();
  const { loggedInUser, dibbyUser } = useUser();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedResults, setSelectedResults] = useState<DibbyParticipant[]>(
    []
  );

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
    if (loggedInUser) {
      const newTripRef = doc(collection(db, "trips"));

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
        participants: selectedResults,
        createdBy: loggedInUser.uid,
      };

      const usersToAddTripTo = selectedResults.filter(
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
                color={colors.background.text}
              />
            }
          />
        }
      />
      {isLoading ? (
        <DibbyLoading />
      ) : (
        <View style={styles.content}>
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
          {formState.errors.title && (
            <Text style={styles.errorText}>Trip must have a name.</Text>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Travelers</Text>
          </View>

          <KeyboardAvoidingView
            behavior="padding"
            enabled
            keyboardVerticalOffset={150}
          >
            <DibbySearchUsername
              results={(res) => setSelectedResults(res)}
              selectLoggedInUser
            />

            <DibbyButton
              onPress={handleSubmit(onSubmit)}
              disabled={!formState.isValid || selectedResults.length <= 1}
              title="Add Trip"
            />
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
    titleContainer: {
      alignItems: "center",
      marginTop: 20,
      marginBottom: 16,
    },
    title: {
      color: colors.background.text,
      fontSize: 22,
    },
    errorText: {
      color: colors.danger.background,
      marginTop: 8,
    },
    content: {
      margin: 16,
    },
  });
