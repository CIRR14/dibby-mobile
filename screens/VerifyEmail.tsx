import React, { useEffect } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useUser } from "../hooks/useUser";
import { useNavigation } from "@react-navigation/native";
import { ThemeColors } from "../constants/Colors";
import {
  faEnvelopeCircleCheck,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { User, reload, sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "../firebase";
import TopBar from "../components/TopBar";
import DibbyButton from "../components/DibbyButton";
import NeumoSurface from "../components/NeumoSurface";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";
import * as Linking from "expo-linking";

export const VerifyEmail = () => {
  const { loggedInUser } = useUser();
  const navigation = useNavigation();
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);

  const navigateTo = (userObj: User) => {
    if (userObj.displayName && userObj.emailVerified) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Root" }],
      });
    } else {
      navigation.navigate("CreateProfile");
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (loggedInUser) {
        reload(loggedInUser);
        if (loggedInUser.emailVerified) {
          clearInterval(interval);
          navigateTo(loggedInUser);
        }
      }
    }, 2000);
  }, [loggedInUser]);

  const resendVerificationEmail = async () => {
    if (loggedInUser) {
      await sendEmailVerification(loggedInUser);
    }
  };

  const openEmailApp = async () => {
    try {
      await Linking.openURL("mailto:");
    } catch (err) {
      console.log("Could not open email app", err);
    }
  };

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      })
      .catch((err) => {
        alert(err.message);
      });
  };

  return (
    <View style={styles.topContainer}>
      <SafeAreaView style={styles.topContainer}>
        <TopBar
          title={""}
          leftButton={
            <DibbyButton
              type="clear"
              onPress={handleSignOut}
              title={
                <FontAwesomeIcon
                  icon={faSignOutAlt}
                  size={24}
                  color={colors.textPrimary}
                />
              }
            />
          }
        />
        <NeumoSurface
          variant="raised"
          tone="surface"
          radius={NeumoTokens.radius.lg}
          style={styles.cardContainer}
        >
          <Text style={styles.stepLabel}>Step 1 of 3</Text>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            We sent an activation link to your email address.
          </Text>
          <FontAwesomeIcon
            icon={faEnvelopeCircleCheck}
            size={96}
            color={colors.accent}
            style={{
              alignSelf: "center",
              marginVertical: 20,
            }}
          />
          <View style={styles.buttonRow}>
            <View style={styles.buttonSlot}>
              <DibbyButton
                onPress={openEmailApp}
                title="Open email app"
                type="solid"
                fullWidth
              />
            </View>
            <View style={styles.buttonSlot}>
              <DibbyButton
                onPress={resendVerificationEmail}
                title="Resend link"
                type="outline"
                fullWidth
              />
            </View>
          </View>
          <Text style={styles.helperText}>
            Didn’t get it? Check spam or wait a minute, then resend.
          </Text>
        </NeumoSurface>
      </SafeAreaView>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    cardContainer: {
      borderRadius: NeumoTokens.radius.lg,
      margin: 16,
      gap: 12,
    },
    stepLabel: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.size.lg,
      fontWeight: Typography.weight.bold as any,
      textAlign: "left",
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
    },
    buttonSlot: {
      flex: 1,
    },
    helperText: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
    },
  });
