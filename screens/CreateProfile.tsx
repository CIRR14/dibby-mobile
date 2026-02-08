import { Text, StyleSheet, View } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateProfile } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../hooks/useUser";
import { ThemeColors } from "../constants/Colors";
import { Avatar } from "@rneui/themed";
import { capitalizeName, getInitials } from "../helpers/AppHelpers";
import { useAvatarUrl } from "../hooks/useAvatarUrl";
import DibbyButton from "../components/DibbyButton";
import DibbyInput from "../components/DibbyInput";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faAt } from "@fortawesome/free-solid-svg-icons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { getParticipantColor } from "../helpers/GenerateColor";
import { createDibbyUser } from "../helpers/FirebaseHelpers";
import NeumoSurface from "../components/NeumoSurface";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";

const CreateProfile = () => {
  const { loggedInUser, dibbyUser } = useUser();

  const navigation = useNavigation();

  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);

  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [photoURL, setPhotoUrl] = useState<string | null>(null);
  const [invalidReason, setInvalidReason] = useState<"pattern" | "taken">();
  const [validDisplayName, setValidDisplayName] = useState<boolean>();
  const { uri: avatarUrl, imageProps } = useAvatarUrl(photoURL, 160);
  const userColor = getParticipantColor(
    loggedInUser?.uid ||
      loggedInUser?.email ||
      loggedInUser?.displayName ||
      "user"
  );

  useEffect(() => {
    if (dibbyUser?.displayName && dibbyUser.username && dibbyUser.email) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Root" }],
      });
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
        navigation.reset({
          index: 0,
          routes: [{ name: "Root" }],
        });
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
    <View style={styles.topContainer}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.stepLabel}>Step 2 of 3</Text>
          <Text style={styles.title}>Complete Profile</Text>
          <Text style={styles.subtitle}>
            Add a display name and username so friends can find you.
          </Text>
        </View>
        <NeumoSurface
          variant="raised"
          tone="surface"
          radius={NeumoTokens.radius.lg}
          style={styles.sectionContainer}
        >
          <View
            style={[
              styles.profilePictureContainer,
              { backgroundColor: userColor },
            ]}
          >
            <Avatar
              rounded
              source={
                avatarUrl
                  ? {
                      uri: avatarUrl,
                      cache: "force-cache",
                    }
                  : undefined
              }
              imageProps={imageProps}
              title={getInitials(loggedInUser?.displayName)}
              titleStyle={{ color: colors.textPrimary }}
              containerStyle={{
                backgroundColor: userColor,
                borderWidth: 1,
                borderColor: colors.background.default,
              }}
              icon={{
                name: "user",
                type: "font-awesome",
                color: colors.textPrimary,
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
                color={colors.textSecondary}
              />
              <Text
                style={{ fontWeight: "300", color: colors.textSecondary }}
              >
                {username || "username"}
              </Text>
            </View>
            <Text style={{ fontWeight: "bold", color: colors.textPrimary }}>
              {displayName || "Display Name"}
            </Text>
            <Text style={{ color: colors.textSecondary }}>
              {loggedInUser?.email}
            </Text>
          </View>
        </NeumoSurface>
        <NeumoSurface
          variant="raised"
          tone="surface"
          radius={NeumoTokens.radius.lg}
          style={styles.inputsCard}
        >
          <Text style={styles.sectionTitle}>Your details</Text>
          <DibbyInput
            label="Display name"
            placeholder="Display name"
            value={displayName || ""}
            onChangeText={(txt) => setDisplayName(capitalizeName(txt))}
            errorText={
              validDisplayName === false
                ? "Display name should be 1–20 letters or numbers."
                : undefined
            }
          />
          <DibbyInput
            username
            label="Username"
            placeholder="username"
            value={username || ""}
            onChangeText={(text) => setUsername(text.toLowerCase().trim())}
            errorText={
              invalidReason === "pattern"
                ? "Only lowercase letters, numbers, and underscores."
                : invalidReason === "taken"
                ? "Username is already taken!"
                : undefined
            }
            valid={invalidReason === undefined}
          />
          <Text
            style={[
              styles.usernameHint,
              invalidReason === undefined && username
                ? styles.usernameHintOk
                : null,
              invalidReason === "pattern" ? styles.usernameHintError : null,
            ]}
          >
            Use lowercase letters, numbers, and underscores.
          </Text>
          <View style={styles.ctaContainer}>
            <DibbyButton
              fullWidth
              disabled={!username || !displayName || !!invalidReason}
              onPress={handleNext}
              title="Next"
            />
          </View>
        </NeumoSurface>
      </SafeAreaView>
    </View>
  );
};

export default CreateProfile;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 24,
      alignItems: "center",
    },
    header: {
      width: "100%",
      maxWidth: 420,
      marginBottom: 20,
      alignItems: "center",
      gap: 6,
    },
    title: {
      fontSize: Typography.size.xl,
      fontWeight: Typography.weight.bold as any,
      textAlign: "center",
      color: colors.textPrimary,
    },
    stepLabel: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      textAlign: "center",
    },
    sectionContainer: {
      borderRadius: NeumoTokens.radius.lg,
      padding: 18,
      marginBottom: 20,
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      maxWidth: 420,
    },
    profilePictureContainer: {
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
    inputsCard: {
      width: "100%",
      maxWidth: 420,
      gap: 12,
      paddingVertical: 18,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
    },
    usernameHint: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
    },
    usernameHintOk: {
      color: colors.success.background,
    },
    usernameHintError: {
      color: colors.danger.background,
    },
    ctaContainer: {
      marginTop: 8,
    },
  });
