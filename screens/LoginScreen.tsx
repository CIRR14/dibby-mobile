import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import React, { useEffect, useState } from "react";
import {
  appleProvider,
  auth,
  facebookProvider,
  googleProvider,
} from "../firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  User,
  UserCredential,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useNavigation, useTheme } from "@react-navigation/native";
import errorMessage from "../constants/Errors";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faFacebookSquare,
  faGoogle,
  faApple,
} from "@fortawesome/free-brands-svg-icons";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { Platform } from "react-native";
import { wideScreen } from "../constants/DeviceWidth";
import { REACT_APP_VERSION } from "@env";

const LoginScreen = () => {
  const [email, setEmail] = useState<string>("");
  const [user, setUser] = useState<User | undefined>(undefined);
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [method, setMethod] = useState<"signUp" | "logIn" | undefined>(
    undefined
  );
  const [passwordVerification, setPasswordVerification] = useState<string>("");
  const [passwordVerificationRequired, setPasswordVerificationRequired] =
    useState<boolean>(false);

  const navigation = useNavigation();

  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors);

  useEffect(() => {
    if (Platform.OS === "web") {
      const listener = (event) => {
        if (event.code === "Enter") {
          event.preventDefault();
          handleLogin();
        }
      };
      document.addEventListener("keydown", listener);
      return () => {
        document.removeEventListener("keydown", listener);
      };
    }
  }, [Platform.OS]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userObj) => {
      if (userObj) {
        setUser(user);
        method === "logIn"
          ? navigation.navigate("Home")
          : navigation.navigate("CreateProfile");
      }
    });
    return unsubscribe;
  }, [method]);

  const isPasswordValid = (): boolean => {
    return password.length >= 8 ? true : false;
  };

  const isPasswordVerified = (): boolean => {
    return passwordVerification === password && passwordVerificationRequired
      ? true
      : false;
  };

  const resetToLogin = (): void => {
    setMethod(undefined);
    setPassword("");
    setPasswordVerification("");
    setPasswordVerificationRequired(false);
    setError("");
  };

  // const createProfile = async (user: User): Promise<DocumentReference> => {
  //   const { uid, displayName, phoneNumber, photoURL, email, emailVerified } =
  //     user;
  //   return addDoc(collection(db, "users"), {
  //     uid,
  //     displayName,
  //     phoneNumber,
  //     photoURL,
  //     email,
  //   });
  // };

  const handleSignUp = () => {
    // add an extra field to verify password
    setPasswordVerificationRequired(true);
    setMethod("signUp");
    if (isPasswordValid() && isPasswordVerified()) {
      createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredentials: UserCredential) => {
          const {
            uid,
            displayName,
            phoneNumber,
            photoURL,
            email,
            emailVerified,
          } = userCredentials.user;
        })
        .catch((err: FirebaseError) => {
          console.log({ err });
          setError(errorMessage(err?.code));
        });
    } else if (password || email) {
      isPasswordVerified()
        ? setError("Password doesn't meet criteria")
        : setError("Passwords must match");
    }
  };

  const handleLogin = () => {
    setMethod("logIn");
    signInWithEmailAndPassword(auth, email, password)
      .then((user: UserCredential) => {
        console.log("logging in", { user });
      })
      .catch((err: FirebaseError) => {
        console.log({ err });
        if (err.code === "auth/user-not-found") {
          handleSignUp();
        }
        setError(errorMessage(err?.code));
      });
  };

  const handleFacebookLogin = () => {
    setError("");
    signInWithPopup(auth, facebookProvider)
      .then((user: UserCredential) => {
        console.log("logging in", { user });
      })
      .catch((err) => {
        console.log({ err });
        setError(errorMessage(err?.code));
      });
  };

  const handleGoogleLogIn = () => {
    setError("");
    signInWithPopup(auth, googleProvider)
      .then((user: UserCredential) => {
        console.log("logging in", { user });
      })
      .catch((err) => {
        console.log({ err });
        setError(errorMessage(err?.code));
      });
  };

  const handleAppleLogin = () => {
    setError("");
    signInWithPopup(auth, appleProvider)
      .then((user: UserCredential) => {
        console.log("logging in", { user });
      })
      .catch((err) => {
        console.log({ err });
        setError(errorMessage(err?.code));
      });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      {!user && (
        <View style={styles.innerContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Dibby</Text>
            <Text style={styles.descriptionText}>Money Splitting</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Email"
              keyboardType="email-address"
              value={email}
              placeholderTextColor={colors.input.text}
              onChangeText={(text: string) => setEmail(text)}
              style={styles.input}
              clearButtonMode="always"
            />
            <TextInput
              placeholder="Password"
              keyboardType="visible-password"
              value={password}
              placeholderTextColor={colors.input.text}
              onChangeText={(text: string) => setPassword(text)}
              style={styles.input}
              secureTextEntry
              clearButtonMode="always"
            />
            {passwordVerificationRequired && (
              <TextInput
                placeholder="Verify Password"
                placeholderTextColor={colors.input.text}
                value={passwordVerification}
                onChangeText={(text: string) => setPasswordVerification(text)}
                style={styles.input}
                secureTextEntry
                clearButtonMode="always"
              />
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}

            {passwordVerificationRequired && (
              <Text style={styles.loginText} onPress={() => resetToLogin()}>
                Login
              </Text>
            )}
          </View>

          <View style={styles.buttonContainer}>
            {!passwordVerificationRequired && (
              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={passwordVerificationRequired}
              >
                <Text style={styles.buttonText}> Login </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.buttonOutline]}
              onPress={handleSignUp}
            >
              <Text style={styles.buttonOutlineText}> Register </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.orContainer}>
            <View style={styles.orLines} />
            <View>
              <Text style={styles.orText}>or</Text>
            </View>
            <View style={styles.orLines} />
          </View>

          <View style={styles.providerContainer}>
            <TouchableOpacity onPress={handleFacebookLogin}>
              <FontAwesomeIcon
                icon={faFacebookSquare}
                size={32}
                color={colors.background.text}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleGoogleLogIn}>
              <FontAwesomeIcon
                icon={faGoogle}
                size={32}
                color={colors.background.text}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAppleLogin}>
              <FontAwesomeIcon
                icon={faApple}
                size={32}
                color={colors.background.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View
        style={{
          position: "absolute",
          bottom: 30,
          width: "100%",
          alignItems: "center",
          zIndex: 1999,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: colors.background.text,
          }}
        >
          {Platform.OS === "web"
            ? process.env.REACT_APP_VERSION
            : REACT_APP_VERSION}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
    innerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      margin: wideScreen ? "25%" : 0,
    },
    inputContainer: {
      width: wideScreen ? "90%" : "80%",
      margin: 12,
    },
    input: {
      backgroundColor: colors.input.background,
      color: colors.background.text,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 10,
      marginTop: 5,
    },
    buttonContainer: {
      width: wideScreen ? "40%" : "60%",
      margin: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    button: {
      backgroundColor: colors.primary.button,
      width: "100%",
      padding: 16,
      margin: 16,
      borderRadius: 10,
      alignItems: "center",
    },
    buttonOutline: {
      backgroundColor: colors.transparent,
      marginTop: 5,
      borderColor: colors.primary.button,
      borderWidth: 2,
    },
    buttonText: {
      color: colors.primary.text,
      fontWeight: "700",
      fontSize: 16,
    },
    buttonOutlineText: {
      color: colors.primary.text,
      fontWeight: "700",
      fontSize: 16,
    },
    errorText: {
      color: colors.danger.button,
      fontWeight: "500",
      fontSize: 12,
      marginTop: 12,
      textTransform: "uppercase",
    },
    titleContainer: {
      alignSelf: "flex-start",
      width: "60%",
      marginBottom: 50,
    },
    titleText: {
      color: colors.background.text,
      fontSize: 50,
      fontWeight: "bold",
      marginLeft: 40,
    },
    descriptionText: {
      color: colors.background.text,
      fontSize: 20,
      fontWeight: "400",
      marginLeft: 40,
    },
    loginText: {
      textAlign: "center",
      marginTop: 24,
      color: colors.background.text,
      fontSize: 16,
      fontWeight: "500",
    },
    orContainer: {
      flexDirection: "row",
      alignItems: "center",
      margin: 16,
      width: "80%",
    },
    orLines: {
      flex: 1,
      height: 1,
      backgroundColor: colors.background.text,
      width: 100,
    },
    orText: { width: 50, textAlign: "center", color: colors.background.text },
    providerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-evenly",
      width: "80%",
    },
  });
