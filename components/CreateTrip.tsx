import React, { useEffect } from "react";
import {
  StyleSheet,
  SafeAreaView,
  View,
  useColorScheme,
  Text,
  ColorSchemeName,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useTheme } from "@react-navigation/native";
import { User } from "firebase/auth";
import { db } from "../firebase";
import { faAdd, faClose, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Expense, Traveler, TripDoc } from "../constants/DibbyTypes";
import { Timestamp, addDoc, collection } from "firebase/firestore";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { generateColor, userColors } from "../helpers/GenerateColor";
import { capitalizeName } from "../helpers/AppHelpers";
import DibbyButton from "./DibbyButton";
import TopBar from "./TopBar";
import DibbyInput from "./DibbyInput";

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
      <TopBar
        title={"Add Trip"}
        leftButton={
          <DibbyButton
            onPress={onPressBack}
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
      <ScrollView>
        <View style={styles.content}>
          <Controller
            control={control}
            name="name"
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
          {formState.errors.name && (
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
            <ScrollView>
              {fields.map(({ name, id }: any, index: number) => {
                return (
                  <View style={styles.travelerContainer} key={id}>
                    <Controller
                      control={control}
                      rules={{ required: true }}
                      name={`travelers.${index}.name`}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <DibbyInput
                          placeholder={
                            index === 0
                              ? currentUser.displayName!!
                              : `Name of Traveler ${index + 1}`
                          }
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          disabled={index === 0}
                          clearButtonMode="always"
                          returnKeyType="next"
                          onSubmitEditing={addTraveler}
                        />
                      )}
                    />
                    {index !== 0 && (
                      <View>
                        <DibbyButton
                          type="clear"
                          onPress={() => removeTraveler(index)}
                          title={
                            <FontAwesomeIcon
                              icon={faTrash}
                              size={16}
                              color={colors.danger.background}
                            />
                          }
                        />
                      </View>
                    )}
                  </View>
                );
              })}
              {formState.errors.travelers && (
                <Text style={styles.errorText}>
                  All travelers must have a name.
                </Text>
              )}
            </ScrollView>
            <DibbyButton
              type="clear"
              onPress={addTraveler}
              title={
                <View
                  style={{
                    borderRadius: 100,
                    backgroundColor: colors.primary.background,
                    padding: 8,
                  }}
                >
                  <FontAwesomeIcon
                    icon={faAdd}
                    size={24}
                    color={colors.primary.text}
                  />
                </View>
              }
            />
            <DibbyButton
              onPress={handleSubmit(onSubmit)}
              disabled={!formState.isValid}
              title="Add Trip"
            />
          </KeyboardAvoidingView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateTrip;

const makeStyles = (colors: ThemeColors, theme?: ColorSchemeName) =>
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
