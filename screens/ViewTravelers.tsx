import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  useColorScheme,
  StyleSheet,
  Dimensions,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../components/TopBar";
import { useNavigation, useTheme } from "@react-navigation/native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useUser } from "../hooks/useUser";
import { Timestamp, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { Traveler, Trip, TripDoc } from "../constants/DibbyTypes";
import { db } from "../firebase";
import DibbyButton from "../components/DibbyButton";
import { useForm, Controller } from "react-hook-form";
import { v4 } from "uuid";
import { capitalizeName } from "../helpers/AppHelpers";
import { generateColor } from "../helpers/GenerateColor";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";

const ViewTravelers = ({ route }: any) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();
  const { tripName, tripId } = route.params;
  const { loggedInUser } = useUser();
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
    if (currentTrip && loggedInUser) {
      const updateTimestampedData = {
        ...currentTrip,
        updated: Timestamp.now(),
        travelers: [
          ...currentTrip.travelers,
          { ...data, name: capitalizeName(data.name) },
        ],
        perPerson: currentTrip.amount / (currentTrip.travelers.length + 1),
      };
      try {
        await updateDoc(
          doc(db, loggedInUser.uid, currentTrip.id),
          updateTimestampedData
        );
        reset();
        navigation.navigate("ViewTrip", { tripName, tripId });
      } catch (e) {
        reset();
        console.error("Error adding document: ", e);
      }
    }
  };

  return (
    <SafeAreaView style={styles.topContainer}>
      <TopBar
        title={`${currentTrip?.name}`}
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
          flexDirection: "column",
          justifyContent: "space-between",
          margin: 16,
        }}
      >
        <View
          style={{
            marginTop: 16,
            flexDirection: "row",
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
      <View style={styles.formContainer}>
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

        <DibbyButton
          disabled={!formState.isValid}
          title={`Add traveler to ${currentTrip?.name}`}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
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
