import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronLeft, faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { useNavigation } from "@react-navigation/native";
import TopBar from "../components/TopBar";
import DibbyButton from "../components/DibbyButton";
import { NeumoTokens } from "../constants/Neumo";
import { ThemeColors } from "../constants/Colors";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";

const AccountDeletion = () => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();

  const handleEmail = () => {
    const subject = encodeURIComponent("Dibby account deletion request");
    const body = encodeURIComponent(
      "Please delete my Dibby account.\n\nEmail associated with account:\n\nAdditional details:\n",
    );
    Linking.openURL(`mailto:dibby.test@gmail.com?subject=${subject}&body=${body}`);
  };

  return (
    <View style={styles.topContainer}>
      <SafeAreaView style={styles.topContainer}>
        <TopBar
          title="Delete Account"
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
          <View
            style={styles.card}
          >
            <Text style={styles.title}>How to delete your account</Text>
            <Text style={styles.body}>
              You can delete your account directly in the Dibby app under
              Profile → Account → Delete account. This removes your profile data
              and anonymizes your participation in shared trips.
            </Text>
            <Text style={styles.body}>
              If you don’t have access to the app, you can request deletion by
              email below.
            </Text>

            <DibbyButton
              onPress={handleEmail}
              title={
                <View style={styles.inlineRow}>
                  <Text style={styles.linkText}>Request deletion by email</Text>
                  <FontAwesomeIcon
                    icon={faExternalLink}
                    size={12}
                    color={colors.textSecondary}
                  />
                </View>
              }
              type="clear"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default AccountDeletion;

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
