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
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  User,
  UserCredential,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useNavigation } from "@react-navigation/native";
import errorMessage from "../constants/Errors";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faFacebookSquare,
  faGoogle,
  faApple,
} from "@fortawesome/free-brands-svg-icons";
import { ThemeColors } from "../constants/Colors";
import { Platform } from "react-native";
import { wideScreen } from "../constants/DeviceWidth";
import DibbyButton from "../components/DibbyButton";
import DibbyInput from "../components/DibbyInput";
import DibbyVersion from "../components/DibbyVersion";
import DibbyLoading from "../components/DibbyLoading";
import NeumoSurface from "../components/NeumoSurface";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";

const LoginScreen = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [method, setMethod] = useState<"signUp" | "logIn" | undefined>(
    undefined,
  );
  const [passwordVerification, setPasswordVerification] = useState<string>("");
  const [passwordVerificationRequired, setPasswordVerificationRequired] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const navigation = useNavigation();

  const colors = useAppTheme();
  const styles = makeStyles(colors);

  useEffect(() => {
    if (Platform.OS === "web") {
      const listener = (event: any) => {
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

  const goToApp = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Root" }],
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userObj) => {
      if (userObj) {
        if (!userObj.emailVerified) {
          navigation.navigate("VerifyEmail");
        } else if (method === "logIn") {
          goToApp();
        } else {
          navigation.navigate("CreateProfile");
        }
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
      setLoading(true);
      createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredentials: UserCredential) => {
          setLoading(false);
          await sendEmailVerification(userCredentials.user);
        })
        .catch((err: FirebaseError) => {
          setLoading(false);
          console.log({ err });
          setError(errorMessage(err?.code));
        });
    } else if (password || email) {
      setLoading(false);
      isPasswordVerified()
        ? setError("Password doesn't meet criteria")
        : setError("Passwords must match");
    }
  };

  const handleLogin = () => {
    setLoading(true);
    setMethod("logIn");
    signInWithEmailAndPassword(auth, email, password)
      .then((user: UserCredential) => {
        console.log(user.user.photoURL);
        setLoading(false);
      })
      .catch((err: FirebaseError) => {
        setLoading(false);
        console.log({ err });
        if (err.code === "auth/user-not-found") {
          handleSignUp();
        }
        setError(errorMessage(err?.code));
      });
  };

  const handleFacebookLogin = () => {
    setError("");
    if (signInWithPopup) {
      signInWithPopup(auth, facebookProvider)
        .then((user: UserCredential) => {})
        .catch((err) => {
          console.log({ err });
          setError(errorMessage(err?.code));
        });
    }
  };

  const handleGoogleLogIn = () => {
    setError("");
    if (signInWithPopup) {
      signInWithPopup(auth, googleProvider)
        .then((user: UserCredential) => {})
        .catch((err) => {
          console.log({ err });
          setError(errorMessage(err?.code));
        });
    }
  };

  const handleAppleLogin = () => {
    setError("");
    if (signInWithPopup) {
      signInWithPopup(auth, appleProvider)
        .then((user: UserCredential) => {})
        .catch((err) => {
          console.log({ err });
          setError(errorMessage(err?.code));
        });
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    if (email) {
      sendPasswordResetEmail(auth, email)
        .then((res) => {
          // TODO: POP UP MODAL OR SOMETHING
        })
        .catch((err) => {
          setError(errorMessage(err?.code));
        });
    } else {
      setError("Please enter an email");
    }
  };

  return (
    <View style={styles.topContainer}>
      <KeyboardAvoidingView style={styles.topContainer} behavior="padding">
        <View style={styles.innerContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Dibby</Text>
            <Text style={styles.descriptionText}>Split money, simply</Text>
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
              onPress={handleSignUp}
              type={passwordVerificationRequired ? "solid" : "outline"}
              fullWidth
              title={"Register"}
            />
          </View>
          <View style={styles.nextStepContainer}>
            <Text style={styles.nextStepHint}>
              New here? Create an account.
            </Text>
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
                  size={28}
                  color={colors.textPrimary}
                />
              }
              type="clear"
              onPress={handleFacebookLogin}
            />
            <DibbyButton
              title={
                <FontAwesomeIcon
                  icon={faGoogle}
                  size={28}
                  color={colors.textPrimary}
                />
              }
              type="clear"
              onPress={handleGoogleLogIn}
            />
            <DibbyButton
              title={
                <FontAwesomeIcon
                  icon={faApple}
                  size={28}
                  color={colors.textPrimary}
                />
              }
              type="clear"
              onPress={handleAppleLogin}
            />
          </View>
          <DibbyButton
            title={"forgot password?"}
            type="clear"
            onPress={handleForgotPassword}
          />
        </View>
        <DibbyVersion bottom={30} />
      </KeyboardAvoidingView>
      {loading && <DibbyLoading />}
    </View>
  );
};

export default LoginScreen;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    innerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: wideScreen ? "35%" : "8%",
    },
    inputContainer: {
      width: "100%",
      gap: 12,
    },
    errorText: {
      color: colors.danger.button,
      fontWeight: "500",
      fontSize: Typography.size.xs,
      marginTop: 6,
    },
    titleContainer: {
      alignSelf: "flex-start",
      marginBottom: 24,
    },
    titleText: {
      color: colors.textPrimary,
      fontSize: Typography.size.xxl,
      fontWeight: Typography.weight.bold as any,
    },
    descriptionText: {
      color: colors.textSecondary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.medium as any,
    },
    authCard: {
      width: "100%",
      gap: 12,
    },
    buttonContainer: {
      width: "100%",
      gap: 16,
      marginTop: 16,
      display: "flex",
      alignItems: "center",
    },
    nextStepContainer: {
      marginTop: 12,
      gap: 4,
    },
    nextStepHint: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      textAlign: "center",
    },
    nextStepText: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      textAlign: "center",
    },
    orContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 16,
    },
    orLines: {
      flex: 1,
      height: 1,
      backgroundColor: colors.shadowDark,
      width: 100,
    },
    orText: {
      width: 50,
      textAlign: "center",
      color: colors.textSecondary,
    },
    providerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-evenly",
      width: "100%",
    },
  });
