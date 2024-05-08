import { Text, StyleSheet, View } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateProfile } from "firebase/auth";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useUser } from "../hooks/useUser";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { Avatar } from "@rneui/themed";
import { capitalizeName, getInitials } from "../helpers/AppHelpers";
import DibbyButton from "../components/DibbyButton";
import { LinearGradient } from "expo-linear-gradient";
import DibbyInput from "../components/DibbyInput";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faAt } from "@fortawesome/free-solid-svg-icons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { generateColor } from "../helpers/GenerateColor";
import { createDibbyUser } from "../helpers/FirebaseHelpers";

const userColor = generateColor();

const CreateProfile = () => {
  const { loggedInUser, dibbyUser } = useUser();

  const navigation = useNavigation();

  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors);

  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [photoURL, setPhotoUrl] = useState<string | null>(null);
  const [invalidReason, setInvalidReason] = useState<"pattern" | "taken">();
  const [validDisplayName, setValidDisplayName] = useState<boolean>();

  useEffect(() => {
    if (dibbyUser?.displayName && dibbyUser.username && dibbyUser.email) {
      navigation.navigate("Home");
    }
  }, [dibbyUser]);

  useEffect(() => {
    setDisplayName(loggedInUser ? loggedInUser.displayName : null);
    setPhotoUrl(loggedInUser ? loggedInUser.photoURL : null);
  }, [loggedInUser]);

  const handleNext = async () => {
    if (loggedInUser && username && displayName) {
      try {
        await updateProfile(loggedInUser, {
          displayName: displayName,
          photoURL: photoURL,
        });
        await createDibbyUser(
          loggedInUser,
          username,
          displayName,
          photoURL,
          userColor
        );
        navigation.navigate("Home");
      } catch (err) {
        console.log("something went wrong", err);
      }
    }
  };

  useEffect(() => {
    if (displayName) {
      const pattern = /^[a-zA-Z0-9 ]{1,20}$/;
      if (pattern.test(displayName)) {
        setValidDisplayName(true);
      } else {
        setValidDisplayName(false);
      }
    } else {
      setValidDisplayName(undefined);
    }
  }, [displayName]);

  useEffect(() => {
    const debounceTimeout = setTimeout(async () => {
      if (username) {
        const pattern = /^[a-z0-9_]+$/;
        if (pattern.test(username)) {
          const usernameToCheck = username.toLowerCase().trim();
          const q = query(
            collection(db, "users"),
            where("username", "==", usernameToCheck)
          );
          const querySnapshot = await getDocs(q);
          querySnapshot.empty
            ? setInvalidReason(undefined)
            : setInvalidReason("taken");
        } else {
          setInvalidReason("pattern");
        }
      }
    }, 700);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [username]);

  return (
    <LinearGradient
      style={styles.topContainer}
      colors={[...colors.background.gradient]}
    >
      <SafeAreaView>
        <Text style={styles.title}>Complete Profile</Text>
        <View style={styles.sectionContainer}>
          <View style={styles.profilePictureContainer}>
            <Avatar
              rounded
              source={{
                uri: photoURL || undefined,
              }}
              title={getInitials(loggedInUser?.displayName)}
              titleStyle={{ color: colors.background.paper }}
              containerStyle={{
                backgroundColor: userColor,
                borderWidth: 1,
                borderColor: colors.background.text,
              }}
              icon={{
                name: "user",
                type: "font-awesome",
                color: colors.background.paper,
              }}
            />
          </View>
          <View style={styles.userNameEmailContainer}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <FontAwesomeIcon
                icon={faAt}
                size={12}
                color={colors.background.text}
              />
              <Text
                style={{ fontWeight: "300", color: colors.background.text }}
              >
                {username || "username"}
              </Text>
            </View>
            <Text style={{ fontWeight: "bold", color: colors.background.text }}>
              {displayName || "Display Name"}
            </Text>
            <Text style={{ color: colors.background.text }}>
              {loggedInUser?.email}
            </Text>
          </View>
        </View>
        <View>
          <DibbyInput
            placeholder="Display Name"
            value={displayName || ""}
            onChangeText={(txt) => setDisplayName(capitalizeName(txt))}
            errorText={
              validDisplayName === false
                ? "Display name is invalid. It should have 1 to 20 alphanumeric characters, or spaces."
                : undefined
            }
          />
          <DibbyInput
            username
            placeholder="Username"
            value={username || ""}
            onChangeText={(text) => setUsername(text.toLowerCase().trim())}
            errorText={
              invalidReason === "pattern"
                ? "Username must only contain alphanumeric values"
                : invalidReason === "taken"
                ? "Username is already taken!"
                : undefined
            }
            valid={invalidReason === undefined}
          />
          <DibbyButton
            fullWidth
            disabled={!username || !displayName || !!invalidReason}
            onPress={handleNext}
            title="Next"
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default CreateProfile;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      padding: 32,
      alignItems: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 20,
      color: colors.background.text,
    },
    sectionContainer: {
      backgroundColor: colors.background.paper,
      borderRadius: 10,
      padding: 20,
      marginBottom: 20,
      flexDirection: "row",
      alignItems: "center",
    },
    profilePictureContainer: {
      backgroundColor: userColor,
      borderRadius: 100,
      width: 50,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
    },
    userNameEmailContainer: {
      alignItems: "flex-start",
      paddingLeft: 20,
      gap: 5,
    },
  });
