import React from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronLeft, faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { useNavigation } from "@react-navigation/native";
import TopBar from "../components/TopBar";
import DibbyButton from "../components/DibbyButton";
import NeumoSurface from "../components/NeumoSurface";
import { NeumoTokens } from "../constants/Neumo";
import { ThemeColors } from "../constants/Colors";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";

const PrivacyPolicy = () => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();

  return (
    <View style={styles.topContainer}>
      <SafeAreaView style={styles.topContainer}>
        <TopBar
          title="Privacy Policy"
          leftButton={
            <DibbyButton
              type="clear"
              onPress={() => navigation.goBack()}
              title={
                <FontAwesomeIcon
                  icon={faChevronLeft}
                  size={22}
                  color={colors.textPrimary}
                />
              }
            />
          }
        />
        <ScrollView contentContainerStyle={styles.content}>
          <NeumoSurface
            variant="raised"
            tone="surface"
            radius={NeumoTokens.radius.lg}
            style={styles.card}
          >
            <Text style={styles.title}>Dibby Privacy Policy</Text>
            <Text style={styles.meta}>Last updated: Feb 9, 2026</Text>

            <Text style={styles.sectionTitle}>What we collect</Text>
            <Text style={styles.body}>
              Dibby collects the information you provide to create and manage
              your account (email, display name, username, and optional profile
              photo), plus trip, traveler, and expense data you enter.
            </Text>

            <Text style={styles.sectionTitle}>How we use data</Text>
            <Text style={styles.body}>
              We use your data to provide the core functionality: creating
              trips, calculating splits, and sharing balances with travelers you
              invite. We do not run analytics today.
            </Text>

            <Text style={styles.sectionTitle}>Sharing</Text>
            <Text style={styles.body}>
              Your trip data is visible to participants you add to that trip.
              We use Firebase to store and sync data. We do not sell your data.
            </Text>

            <Text style={styles.sectionTitle}>Retention & deletion</Text>
            <Text style={styles.body}>
              You can delete your account from within the app. When you delete
              your account, we remove your profile data and anonymize your
              participation in shared trips. If you need help, you can request
              deletion by email.
            </Text>

            <Text style={styles.sectionTitle}>Contact</Text>
            <Text style={styles.body}>
              For privacy questions or deletion requests, email
              dibby.test@gmail.com.
            </Text>

            <DibbyButton
              type="clear"
              onPress={() =>
                Linking.openURL("mailto:dibby.test@gmail.com")
              }
              title={
                <View style={styles.inlineRow}>
                  <Text style={styles.linkText}>Email support</Text>
                  <FontAwesomeIcon
                    icon={faExternalLink}
                    size={12}
                    color={colors.textSecondary}
                  />
                </View>
              }
            />
          </NeumoSurface>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default PrivacyPolicy;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    card: {
      gap: 12,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.size.lg,
      fontWeight: Typography.weight.bold as any,
    },
    meta: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
      marginTop: 4,
    },
    body: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      lineHeight: 20,
    },
    inlineRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    linkText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
  });
