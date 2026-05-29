import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
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
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";
import ScreenLayout from "../components/ScreenLayout";

const DIBBY_LOGO = require("../assets/images/icon-small.png");

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
      <KeyboardAvoidingView
        style={styles.topContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScreenLayout contentStyle={styles.layoutContent}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.brandWrap}>
              <View
                style={styles.brandBadge}
              >
                <Image
                  source={DIBBY_LOGO}
                  resizeMode="contain"
                  style={styles.brandLogo}
                />
              </View>
              <Text style={styles.titleText}>Welcome to Dibby</Text>
              <Text style={styles.descriptionText}>Split money, simply.</Text>
            </View>

            <View
              style={styles.authCard}
            >
              <View
                style={styles.modeRow}
              >
                <Pressable
                  onPress={() => {
                    setPasswordVerificationRequired(false);
                    setError("");
                  }}
                  style={styles.modeButton}
                >
                  <Text
                    style={[
                      styles.modeText,
                      !passwordVerificationRequired && styles.modeTextActive,
                    ]}
                  >
                    Login
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setPasswordVerificationRequired(true);
                    setError("");
                  }}
                  style={styles.modeButton}
                >
                  <Text
                    style={[
                      styles.modeText,
                      passwordVerificationRequired && styles.modeTextActive,
                    ]}
                  >
                    Create account
                  </Text>
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <DibbyInput
                  label="Email"
                  placeholder="you@email.com"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
                <DibbyInput
                  label="Password"
                  placeholder="Enter password"
                  keyboardType="visible-password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  helperText={
                    passwordVerificationRequired
                      ? "Use at least 8 characters."
                      : undefined
                  }
                />
                {passwordVerificationRequired && (
                  <DibbyInput
                    label="Confirm password"
                    placeholder="Re-enter password"
                    keyboardType="visible-password"
                    value={passwordVerification}
                    onChangeText={setPasswordVerification}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                )}
              </View>
              {error ? (
                <View
                  style={styles.errorCard}
                >
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.buttonContainer}>
                <DibbyButton
                type="solid"
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
            </View>

            <View
              style={styles.socialCard}
            >
              <Text style={styles.socialTitle}>Or continue with</Text>
              <View style={styles.providerContainer}>
                <Pressable
                  onPress={handleGoogleLogIn}
                  style={styles.providerButton}
                >
                  <FontAwesomeIcon
                    icon={faGoogle}
                    size={16}
                    color={colors.textPrimary}
                  />
                </Pressable>
                <Pressable
                  onPress={handleAppleLogin}
                  style={styles.providerButton}
                >
                  <FontAwesomeIcon
                    icon={faApple}
                    size={16}
                    color={colors.textPrimary}
                  />
                </Pressable>
                <Pressable
                  onPress={handleFacebookLogin}
                  style={styles.providerButton}
                >
                  <FontAwesomeIcon
                    icon={faFacebookSquare}
                    size={16}
                    color={colors.textPrimary}
                  />
                </Pressable>
              </View>
            </View>
            <DibbyVersion />
          </ScrollView>
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
      alignItems: "center",
      paddingHorizontal: wideScreen ? "18%" : "6%",
    },
    scrollContent: {
      width: "100%",
      maxWidth: 500,
      alignSelf: "center",
      paddingTop: NeumoTokens.spacing.lg,
      paddingBottom: NeumoTokens.spacing.xl,
      gap: 14,
    },
    brandWrap: {
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
    },
    brandBadge: {
      width: 54,
      height: 54,
      alignItems: "center",
      justifyContent: "center",
    },
    brandLogo: {
      width: 34,
      height: 34,
    },
    inputContainer: {
      width: "100%",
      gap: 12,
    },
    errorText: {
      color: colors.danger.text,
      fontWeight: Typography.weight.medium as any,
      fontSize: Typography.size.xs,
    },
    errorCard: {
      marginTop: 2,
    },
    titleText: {
      color: colors.textPrimary,
      fontSize: Typography.size.xl,
      fontWeight: Typography.weight.semibold as any,
    },
    descriptionText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.regular as any,
    },
    authCard: {
      width: "100%",
      gap: 14,
      padding: NeumoTokens.spacing.md,
    },
    buttonContainer: {
      width: "100%",
      gap: 8,
      marginTop: 2,
      alignItems: "center",
    },
    modeRow: {
      flexDirection: "row",
      gap: 6,
      width: "100%",
      marginBottom: 2,
    },
    modeButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: NeumoTokens.control.pill.minHeight,
    },
    modeText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.medium as any,
    },
    modeTextActive: {
      color: colors.textPrimary,
      fontWeight: Typography.weight.semibold as any,
    },
    socialCard: {
      width: "100%",
      gap: 10,
      padding: NeumoTokens.spacing.md,
    },
    socialTitle: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      textTransform: "uppercase",
      letterSpacing: Typography.tracking.normal,
      textAlign: "center",
    },
    providerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      width: "100%",
    },
    providerButton: {
      flex: 1,
      minHeight: NeumoTokens.touch.minTarget,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    providerText: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.medium as any,
    },
  });
