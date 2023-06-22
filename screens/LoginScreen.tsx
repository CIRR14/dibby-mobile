import {
  ColorSchemeName,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
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
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  DocumentData,
  DocumentReference,
  getDocs,
  QuerySnapshot,
  updateDoc,
} from "firebase/firestore";
import { ColorTheme, ThemeColors } from "../constants/Colors";

const LoginScreen = () => {
  const [email, setEmail] = useState<string>("");
  const [user, setUser] = useState<User | undefined>(undefined);
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [method, setMethod] = useState<string>("");
  const [passwordVerification, setPasswordVerification] = useState<string>("");
  const [passwordVerificationRequired, setPasswordVerificationRequired] =
    useState<boolean>(false);

  const navigation = useNavigation();

  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors, theme);

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

  const exampleGET = () => {
    getDocs(collection(db, "users"))
      .then((docRef: QuerySnapshot<DocumentData>) => {
        docRef.forEach((doc) => {
          console.log(doc.id, doc.data());
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const examplePOST = (data: any = { first: "example", last: "POST" }) => {
    addDoc(collection(db, "users"), data)
      .then((docRef) => {
        console.log("Document written with ID: ", docRef.id);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const exampleDELETEDoc = () => {
    deleteDoc(doc(db, "users", "yo"))
      .then((res) => {
        console.log("deleted", res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const exampleDELETEField = () => {
    const docRef = doc(db, "users", "yo");
    updateDoc(docRef, {
      one: deleteField(),
    })
      .then((res) => {
        console.log("deleted", res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const isPasswordValid = (): boolean => {
    return password.length >= 8 ? true : false;
  };

  const isPasswordVerified = (): boolean => {
    return passwordVerification === password && passwordVerificationRequired
      ? true
      : false;
  };

  const resetToLogin = (): void => {
    setMethod("");
    setPassword("");
    setPasswordVerification("");
    setPasswordVerificationRequired(false);
    setError("");
  };

  const createProfile = async (user: User): Promise<DocumentReference> => {
    const { uid, displayName, phoneNumber, photoURL, email, emailVerified } =
      user;
    return addDoc(collection(db, "users"), {
      uid,
      displayName,
      phoneNumber,
      photoURL,
      email,
    });
  };

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
          console.log({
            uid,
            displayName,
            phoneNumber,
            photoURL,
            email,
            emailVerified,
          });
          const profile = await createProfile(userCredentials.user);
          console.log("created", profile.id);
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
        console.log("logging in");
      })
      .catch((err: FirebaseError) => {
        console.log({ err });
        if (err.code === "auth/user-not-found") {
          handleSignUp();
        }
        setError(errorMessage(err?.code));
      });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      {!user && (
        <>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Dibby</Text>
            <Text style={styles.descriptionText}>Money Splitting</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Email"
              keyboardType="email-address"
              value={email}
              placeholderTextColor={
                theme === "dark" ? colors.surface : colors.onSurface
              }
              onChangeText={(text: string) => setEmail(text)}
              style={styles.input}
              clearButtonMode="always"
            />
            <TextInput
              placeholder="Password"
              keyboardType="visible-password"
              value={password}
              placeholderTextColor={
                theme === "dark" ? colors.surface : colors.onSurface
              }
              onChangeText={(text: string) => setPassword(text)}
              style={styles.input}
              secureTextEntry
              clearButtonMode="always"
            />
            {passwordVerificationRequired && (
              <TextInput
                placeholder="Verify Password"
                placeholderTextColor={
                  theme === "dark" ? colors.surface : colors.onSurface
                }
                value={passwordVerification}
                onChangeText={(text: string) => setPasswordVerification(text)}
                style={styles.input}
                secureTextEntry
                clearButtonMode="always"
              />
            )}

            {passwordVerificationRequired && (
              <Text style={styles.loginText} onPress={() => resetToLogin()}>
                {" "}
                Login{" "}
              </Text>
            )}
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}

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
            <TouchableOpacity>
              <FontAwesomeIcon
                icon={faFacebookSquare}
                size={32}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <FontAwesomeIcon
                icon={faGoogle}
                size={32}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <FontAwesomeIcon
                icon={faApple}
                size={32}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const makeStyles = (colors: ThemeColors, theme?: ColorSchemeName) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    inputContainer: {
      width: "80%",
      margin: 12,
    },
    input: {
      backgroundColor:
        theme === "dark" ? colors.inverseSurface : colors.surfaceVariant,
      color: colors.surface,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 10,
      marginTop: 5,
    },
    buttonContainer: {
      width: "60%",
      justifyContent: "center",
      alignItems: "center",
    },
    button: {
      backgroundColor: colors.primary,
      width: "100%",
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
    },
    buttonOutline: {
      backgroundColor: colors.elevation.level0,
      marginTop: 5,
      borderColor: colors.primary,
      borderWidth: 2,
    },
    buttonText: {
      color: colors.onPrimary,
      fontWeight: "700",
      fontSize: 16,
    },
    buttonOutlineText: {
      color: colors.primary,
      fontWeight: "700",
      fontSize: 16,
    },
    errorText: {
      color: colors.error,
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
      color: colors.primary,
      fontSize: 50,
      fontWeight: "bold",
      marginLeft: 40,
    },
    descriptionText: {
      color: colors.primary,
      fontSize: 20,
      fontWeight: "400",
      marginLeft: 40,
    },
    loginText: {
      textAlign: "center",
      marginTop: 2,
      color: colors.primary,
      textDecoration: "underline",
      fontSize: 16,
      fontWeight: "500",
    },
    orContainer: {
      flexDirection: "row",
      alignItems: "center",
      margin: 10,
      width: "80%",
    },
    orLines: {
      flex: 1,
      height: 1,
      backgroundColor: colors.primary,
      width: 100,
    },
    orText: { width: 50, textAlign: "center", color: colors.primary },
    providerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-evenly",
      width: "80%",
    },
  });
