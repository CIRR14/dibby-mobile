import React, { useEffect } from "react";
import {
  StyleSheet,
  SafeAreaView,
  View,
  useColorScheme,
  Text,
  TouchableOpacity,
  TextInput,
  ColorSchemeName,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useTheme } from "@react-navigation/native";
import { User } from "firebase/auth";
import { db } from "../firebase";
import { faAdd, faClose, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Expense, Traveler, Trip, TripDoc } from "../constants/DibbyTypes";
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { generateColor, userColors } from "../helpers/GenerateColor";
import { capitalizeName } from "../helpers/AppHelpers";
import { v4 } from "uuid";

interface IAddTravelerProps {
  currentUser: User;
  onPressBack: () => void;
  tripInfo: Trip;
}

const AddTraveler: React.FC<IAddTravelerProps> = ({
  currentUser,
  onPressBack,
  tripInfo,
}) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors, theme);

  const initialValues: Traveler = {
    id: v4(),
    amountPaid: 0,
    color: generateColor(),
    name: "",
    owed: 0,
    paid: false,
  };

  const { handleSubmit, formState, control, reset } = useForm({
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: initialValues,
  });

  const onSubmit = async (data: Traveler) => {
    const updateTimestampedData = {
      ...tripInfo,
      updated: Timestamp.now(),
      travelers: [
        ...tripInfo.travelers,
        { ...data, name: capitalizeName(data.name) },
      ],
      perPerson: tripInfo.amount / (tripInfo.travelers.length + 1),
    };
    try {
      await updateDoc(
        doc(db, currentUser.uid, tripInfo.id),
        updateTimestampedData
      );
      reset();
      onPressBack();
    } catch (e) {
      reset();
      console.error("Error adding document: ", e);
    }
  };

  return (
    <SafeAreaView style={styles.topContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onPressBack}>
          <FontAwesomeIcon
            icon={faClose}
            size={24}
            color={colors.background.text}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Add Traveler</Text>
        <View></View>
      </View>
      <View style={styles.content}>
        <Controller
          control={control}
          name="name"
          rules={{
            required: true,
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              placeholder="Name of Traveler"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              clearButtonMode="always"
              style={styles.input}
              placeholderTextColor={colors.disabled?.text}
            />
          )}
        />
        {formState.errors.name && (
          <Text style={styles.errorText}>Traveler must have a name.</Text>
        )}

        <TouchableOpacity
          style={
            !formState.isValid
              ? [styles.submitButton, styles.disabledButton]
              : styles.submitButton
          }
          disabled={!formState.isValid}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.buttonText}>
            Add Traveler to {capitalizeName(tripInfo.name)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddTraveler;

const makeStyles = (colors: ThemeColors, theme?: ColorSchemeName) =>
  StyleSheet.create({
    topContainer: {
      backgroundColor: colors.background.default,
      height: "100%",
    },
    travelersContainer: {
      flexDirection: "column",
      justifyContent: "center",
    },
    travelerContainer: {
      display: "flex",
      flexDirection: "row",
    },
    deleteButton: {
      justifyContent: "center",
      margin: "auto",
      padding: 12,
    },
    header: {
      display: "flex",
      margin: 16,
      justifyContent: "space-between",
      flexDirection: "row",
    },
    titleContainer: {
      display: "flex",
      alignItems: "center",
      marginTop: 16,
    },
    title: {
      color: colors.background.text,
      fontSize: 22,
      width: 120,
    },
    errorText: {
      color: colors.danger.background,
      marginTop: 8,
    },
    content: {
      backgroundColor: colors.background.default,
      margin: 16,
      display: "flex",
    },
    input: {
      backgroundColor: colors.disabled?.button,
      color: colors.disabled?.text,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 8,
      minWidth: "90%",
    },
    submitButton: {
      backgroundColor: colors.primary.button,
      width: "100%",
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 32,
    },
    disabledButton: {
      opacity: 0.5,
    },
    addContainer: {
      display: "flex",
      alignItems: "center",
      marginTop: 16,
    },
    addButton: {
      backgroundColor: colors.primary.button,
      borderRadius: 100,
    },
    buttonText: {
      color: colors.primary.text,
      fontWeight: "700",
      fontSize: 16,
    },
  });
