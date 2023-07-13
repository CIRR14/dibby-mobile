import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  useColorScheme,
} from "react-native";
import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateProfile } from "firebase/auth";
import { useNavigation, useTheme } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import { useUser } from "../hooks/useUser";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { Avatar } from "@rneui/themed";
import { getInitials } from "../helpers/AppHelpers";
import { userColors } from "../helpers/GenerateColor";

const CreateProfile = () => {
  const { username, loggedInUser, photoURL, setUsername, setPhotoURL } =
    useUser();

  const navigation = useNavigation();

  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors);

  useEffect(() => {
    if (loggedInUser && loggedInUser.displayName) {
      navigation.navigate("Home");
    }
  }, [loggedInUser]);

  const handleNext = () => {
    if (loggedInUser) {
      updateProfile(loggedInUser, {
        displayName: username,
        photoURL: photoURL,
      })
        .then(async () => {
          navigation.navigate("Home");
        })
        .catch((err) => {
          console.log("something went wrong", err);
        });
    } else {
      navigation.navigate("Login");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Complete Profile</Text>
      <View style={styles.sectionContainer}>
        <TouchableOpacity>
          <View style={styles.profilePictureContainer}>
            <Avatar
              rounded
              source={{
                uri: loggedInUser
                  ? loggedInUser.photoURL || undefined
                  : undefined,
              }}
              title={getInitials(loggedInUser?.displayName)}
              titleStyle={{ color: colors.background.paper }}
              containerStyle={{
                backgroundColor: userColors[0].background,
              }}
              icon={{
                name: "user",
                type: "font-awesome",
                color: colors.background.paper,
              }}
            />
          </View>
        </TouchableOpacity>
        <View style={styles.userNameEmailContainer}>
          <Text style={{ fontWeight: "bold", color: colors.background.text }}>
            {username || "Display Name"}
          </Text>
          <Text style={{ color: colors.background.text }}>
            {loggedInUser?.email}
          </Text>
        </View>
      </View>
      <View style={styles.sectionContainer}>
        <TextInput
          textContentType="name"
          autoCapitalize="words"
          placeholder="Display Name"
          value={username}
          placeholderTextColor={colors.input.text}
          onChangeText={(text: string) => setUsername(text)}
          style={styles.displayNameInput}
          clearButtonMode="always"
        />
      </View>
      <TouchableOpacity
        style={!username ? styles.disabledButton : styles.nextButton}
        onPress={handleNext}
        disabled={!username}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default CreateProfile;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background.default,
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
      width: "100%",
      borderRadius: 10,
      padding: 20,
      marginBottom: 20,
      flexDirection: "row",
      alignItems: "center",
    },
    profilePictureContainer: {
      backgroundColor: userColors[0].background,
      borderRadius: 100,
      width: 50,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
    },
    userNameEmailContainer: {
      alignItems: "flex-start",
      paddingLeft: 20,
    },
    displayNameInput: {
      color: colors.input.text,
      fontWeight: "bold",
      width: "100%",
    },
    nextButton: {
      backgroundColor: colors.primary.button,
      width: "100%",
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
    },
    disabledButton: {
      backgroundColor: colors.disabled.button,
      width: "100%",
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
    },
    buttonText: {
      color: colors.primary.text,
      fontWeight: "700",
      fontSize: 16,
    },
  });
