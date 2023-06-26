import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  useColorScheme,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateProfile } from "firebase/auth";
import { useNavigation, useTheme } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import { useUser } from "../hooks/useUser";
import { ColorTheme, ThemeColors } from "../constants/Colors";

const CreateProfile = () => {
  const { username, loggedInUser, photoURL, setUsername, setPhotoURL } =
    useUser();

  const navigation = useNavigation();

  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  // const [username, setUsername] = useState<string>('');
  // const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  // const [photoURL, setPhotoURL] = useState<string>('')

  // useEffect(() => {
  //     const unsubscribe = onAuthStateChanged(auth, userObj => {
  //         if (userObj) {
  //             setUsername(userObj.displayName || '');
  //             setPhotoURL(userObj.photoURL || '');
  //             setLoggedInUser(userObj);
  //         } else {
  //             navigation.navigate('Login')
  //         }
  //     });
  //     return unsubscribe;
  // }, []);

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
            {photoURL ? (
              <>this is a photo</>
            ) : (
              <FontAwesomeIcon icon={faCamera} color={colors.onSecondary} />
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.userNameEmailContainer}>
          <Text style={{ fontWeight: "bold", color: colors.onSurfaceVariant }}>
            {username || "Display Name"}
          </Text>
          <Text style={{ color: colors.onSurfaceVariant }}>
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
          placeholderTextColor={colors.onSurfaceVariant}
          onChangeText={(text: string) => setUsername(text)}
          style={styles.displayNameInput}
          clearButtonMode="always"
        />
      </View>
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default CreateProfile;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      flex: 1,
      padding: 32,
      alignItems: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 20,
      color: colors.onSurfaceVariant,
    },
    sectionContainer: {
      backgroundColor: colors.surfaceVariant,
      width: "100%",
      borderRadius: 10,
      padding: 20,
      marginBottom: 20,
      flexDirection: "row",
      alignItems: "center",
    },
    profilePictureContainer: {
      backgroundColor: colors.onSurfaceVariant,
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
      color: colors.onSurfaceVariant,
      fontWeight: "bold",
      width: "100%",
    },
    nextButton: {
      backgroundColor: colors.primary,
      width: "100%",
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
    },
    buttonText: {
      color: colors.onPrimary,
      fontWeight: "700",
      fontSize: 16,
    },
  });
