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
import ScreenLayout from "../components/ScreenLayout";

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
        <ScreenLayout contentStyle={styles.layoutContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Dibby</Text>
            <Text style={styles.descriptionText}>Split money, simply.</Text>
          </View>

          <NeumoSurface
            variant="glass"
            tone="surface"
            radius={NeumoTokens.radius.lg}
            style={styles.authCard}
          >
            <View style={styles.modeRow}>
              <View style={styles.modeButton}>
                <DibbyButton
                  title="Login"
                  onPress={() => {
                    setPasswordVerificationRequired(false);
                    setError("");
                  }}
                  type={passwordVerificationRequired ? "outline" : "solid"}
                  size="sm"
                  fullWidth
                />
              </View>
              <View style={styles.modeButton}>
                <DibbyButton
                  title="Create account"
                  onPress={() => {
                    setPasswordVerificationRequired(true);
                    setError("");
                  }}
                  type={passwordVerificationRequired ? "solid" : "outline"}
                  size="sm"
                  fullWidth
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <DibbyInput
                placeholder="Email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
              <DibbyInput
                placeholder="Password"
                keyboardType="visible-password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              {passwordVerificationRequired && (
                <DibbyInput
                  placeholder="Verify Password"
                  keyboardType="visible-password"
                  value={passwordVerification}
                  onChangeText={setPasswordVerification}
                  secureTextEntry
                  autoCapitalize="none"
                />
              )}

              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <View style={styles.buttonContainer}>
              <DibbyButton
                onPress={
                  passwordVerificationRequired ? handleSignUp : handleLogin
                }
                title={passwordVerificationRequired ? "Create account" : "Continue"}
                fullWidth
              />
              {passwordVerificationRequired ? (
                <DibbyButton
                  onPress={resetToLogin}
                  type="clear"
                  title="Back to login"
                  size="sm"
                />
              ) : (
                <DibbyButton
                  title="Forgot password?"
                  type="clear"
                  onPress={handleForgotPassword}
                  size="sm"
                />
              )}
            </View>
            <Text style={styles.nextStepHint}>
              Verify email → complete profile → start your first trip.
            </Text>
          </NeumoSurface>

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
              size="sm"
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
              size="sm"
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
              size="sm"
            />
          </View>
        </ScreenLayout>
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
    layoutContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: wideScreen ? "20%" : "8%",
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
      maxWidth: 460,
      padding: NeumoTokens.spacing.md,
    },
    buttonContainer: {
      width: "100%",
      gap: 10,
      marginTop: 8,
      display: "flex",
      alignItems: "center",
    },
    modeRow: {
      flexDirection: "row",
      gap: 8,
      width: "100%",
    },
    modeButton: {
      flex: 1,
    },
    nextStepContainer: {
      marginTop: 12,
      gap: 4,
    },
    nextStepHint: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
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
