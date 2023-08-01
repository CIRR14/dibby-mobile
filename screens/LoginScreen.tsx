import { KeyboardAvoidingView, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import {
  appleProvider,
  auth,
  db,
  facebookProvider,
  googleProvider,
} from "../firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
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
import DibbyButton from "../components/DibbyButton";
import { LinearGradient } from "expo-linear-gradient";
import DibbyInput from "../components/DibbyInput";
import DibbyVersion from "../components/DibbyVersion";
import {
  DocumentReference,
  addDoc,
  collection,
  doc,
  setDoc,
} from "firebase/firestore";
import { DibbyUser } from "../constants/DibbyTypes";

const LoginScreen = () => {
  const [email, setEmail] = useState<string>("");
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
        !userObj.emailVerified
          ? navigation.navigate("VerifyEmail")
          : userObj.emailVerified && method === "logIn"
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

  const handleSignUp = () => {
    setPasswordVerificationRequired(true);
    setMethod("signUp");
    if (isPasswordValid() && isPasswordVerified()) {
      createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredentials: UserCredential) => {
          await sendEmailVerification(userCredentials.user);
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
    <LinearGradient
      style={styles.topContainer}
      colors={[...colors.background.gradient]}
    >
      <KeyboardAvoidingView style={styles.topContainer} behavior="padding">
        <View style={styles.innerContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Dibby</Text>
            <Text style={styles.descriptionText}>Money Splitting</Text>
          </View>

          <View style={styles.inputContainer}>
            <DibbyInput
              placeholder="Email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <DibbyInput
              placeholder="Password"
              keyboardType="visible-password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {passwordVerificationRequired && (
              <DibbyInput
                placeholder="Verify Password"
                keyboardType="visible-password"
                value={passwordVerification}
                onChangeText={setPasswordVerification}
                secureTextEntry
              />
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <View style={styles.buttonContainer}>
            <DibbyButton
              onPress={
                passwordVerificationRequired ? resetToLogin : handleLogin
              }
              type={passwordVerificationRequired ? "outline" : "solid"}
              title="Login"
              fullWidth
            />
            <DibbyButton
              fullWidth
              type={passwordVerificationRequired ? "solid" : "outline"}
              onPress={handleSignUp}
              title={"Register"}
            />
          </View>

          <View style={styles.orContainer}>
            <View style={styles.orLines} />
            <View>
              <Text style={styles.orText}>or</Text>
            </View>
            <View style={styles.orLines} />
          </View>

          <View style={styles.providerContainer}>
            <DibbyButton
              title={
                <FontAwesomeIcon
                  icon={faFacebookSquare}
                  size={32}
                  color={colors.background.text}
                />
              }
              type="clear"
              onPress={handleFacebookLogin}
            />
            <DibbyButton
              title={
                <FontAwesomeIcon
                  icon={faGoogle}
                  size={32}
                  color={colors.background.text}
                />
              }
              type="clear"
              onPress={handleGoogleLogIn}
            />
            <DibbyButton
              title={
                <FontAwesomeIcon
                  icon={faApple}
                  size={32}
                  color={colors.background.text}
                />
              }
              type="clear"
              onPress={handleAppleLogin}
            />
          </View>
        </View>
        <DibbyVersion bottom={30} />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default LoginScreen;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
    },
    innerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      margin: wideScreen ? "25%" : "10%",
    },
    inputContainer: {
      width: "100%",
    },
    errorText: {
      color: colors.danger.button,
      fontWeight: "500",
      fontSize: 12,
      textTransform: "uppercase",
    },
    titleContainer: {
      alignSelf: "flex-start",
      marginBottom: 50,
    },
    titleText: {
      color: colors.background.text,
      fontSize: 50,
      fontWeight: "bold",
    },
    descriptionText: {
      color: colors.background.text,
      fontSize: 20,
      fontWeight: "400",
    },
    buttonContainer: {
      width: "100%",
      gap: 16,
      margin: 16,
      display: "flex",
      alignItems: "center",
    },
    orContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    orLines: {
      flex: 1,
      height: 1,
      backgroundColor: colors.background.text,
      width: 100,
    },
    orText: {
      width: 50,
      textAlign: "center",
      color: colors.background.text,
    },
    providerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-evenly",
      width: "40%",
    },
  });
