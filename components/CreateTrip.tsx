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
import { Timestamp, addDoc, collection } from "firebase/firestore";
import {
  Controller,
  useController,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { generateColor, userColors } from "../helpers/GenerateColor";
import { capitalizeName } from "../helpers/AppHelpers";

interface ICreateTripProps {
  currentUser: User;
  onPressBack: () => void;
}

const CreateTrip: React.FC<ICreateTripProps> = ({
  currentUser,
  onPressBack,
}) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors, theme);

  const initialValues: TripDoc = {
    created: Timestamp.now(),
    updated: Timestamp.now(),
    name: "",
    travelers: [] as Traveler[],
    expenses: [] as Expense[],
    completed: false,
    amount: 0,
    perPerson: 0,
  };

  const { handleSubmit, formState, control, reset } = useForm({
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: initialValues,
  });

  const { fields, append, remove } = useFieldArray({
    name: "travelers",
    control,
  });

  const addTraveler = () => {
    append({
      id: fields[fields.length - 1].id,
      name: "",
      paid: false,
      amountPaid: 0,
      owed: 0,
      color: generateColor(),
    });
  };

  useEffect(() => {
    if (fields.length === 0) {
      append({
        id: currentUser.uid,
        name: currentUser.displayName || "Me",
        paid: false,
        amountPaid: 0,
        owed: 0,
        color: userColors[0].background,
        me: true,
      });
    }
  }, [fields, append]);

  const removeTraveler = (index: number) => {
    remove(index);
  };

  const onSubmit = async (data: TripDoc) => {
    const updateTimestampedData: TripDoc = {
      ...data,
      travelers: data.travelers.map((t) => {
        return {
          ...t,
          name: capitalizeName(t.name),
        };
      }),
      name: capitalizeName(data.name),
      created: Timestamp.now(),
      updated: Timestamp.now(),
    };
    try {
      const docRef = await addDoc(
        collection(db, currentUser.uid),
        updateTimestampedData
      );
      console.log("Document written with ID: ", docRef.id);
      reset();
      onPressBack();
    } catch (e) {
      reset();
      console.error("Error adding document: ", e);
    }
  };

  const showError = (_fieldName: string, index?: any, secondName?: any) => {
    const travelerError = (formState.errors as any)[_fieldName]?.[index]?.[
      secondName
    ];
    return (
      travelerError && (
        <div
          style={{
            color: "red",
            padding: 5,
            paddingLeft: 12,
            fontSize: "smaller",
          }}
        >
          This field is required
        </div>
      )
    );
  };

  return (
    <SafeAreaView style={styles.topContainer}>
      {/* <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}> */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onPressBack}>
          <FontAwesomeIcon
            icon={faClose}
            size={24}
            color={colors.background.text}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Add Trip</Text>
        <View></View>
      </View>
      <ScrollView>
        <View style={styles.content}>
          <Controller
            control={control}
            name="name"
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                placeholder="Name of Trip"
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
            <Text style={styles.errorText}>Trip must have a name.</Text>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Travelers</Text>
          </View>

          <KeyboardAvoidingView
            style={styles.travelersContainer}
            behavior="padding"
            enabled
            keyboardVerticalOffset={150}
          >
            <ScrollView>
              {fields.map(({ name, id }: any, index: number) => {
                return (
                  <View style={styles.travelerContainer} key={id}>
                    <Controller
                      control={control}
                      rules={{ required: true }}
                      name={`travelers.${index}.name`}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          placeholder={
                            index === 0
                              ? currentUser.displayName!!
                              : `Name of Traveler ${index + 1}`
                          }
                          placeholderTextColor={colors.disabled?.text}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          editable={index !== 0}
                          style={styles.input}
                          clearButtonMode="always"
                          returnKeyType="next"
                          onSubmitEditing={addTraveler}
                        />
                      )}
                    />
                    {index !== 0 && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => removeTraveler(index)}
                      >
                        <FontAwesomeIcon
                          icon={faTrash}
                          size={16}
                          color={colors.danger.background}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
              {formState.errors.travelers && (
                <Text style={styles.errorText}>
                  All travelers must have a name.
                </Text>
              )}
              <View style={styles.addContainer}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addTraveler}
                >
                  <FontAwesomeIcon
                    style={{ margin: 8 }}
                    icon={faAdd}
                    size={16}
                    color={colors.primary.text}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={
                  !formState.isValid
                    ? [styles.submitButton, styles.disabledButton]
                    : styles.submitButton
                }
                disabled={!formState.isValid}
                onPress={handleSubmit(onSubmit)}
              >
                <Text style={styles.buttonText}>Add Trip</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </ScrollView>

      {/* </TouchableWithoutFeedback> */}
    </SafeAreaView>
  );
};

export default CreateTrip;

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
