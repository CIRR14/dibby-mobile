import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { RootStackScreenProps } from "../types";
import { ThemeColors } from "../constants/Colors";
import NeumoSurface from "../components/NeumoSurface";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import DibbyButton from "../components/DibbyButton";
import useAppTheme from "../hooks/useAppTheme";

export default function NotFoundScreen({
  navigation,
}: RootStackScreenProps<"NotFound">) {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  return (
    <View style={styles.container}>
      <NeumoSurface
        variant="raised"
        tone="surface"
        radius={NeumoTokens.radius.lg}
        style={styles.card}
      >
        <Text style={styles.title}>This screen doesn't exist.</Text>
        <Text style={styles.subtitle}>
          Let's get you back to your trips.
        </Text>
        <DibbyButton
          onPress={() => navigation.replace("Root")}
          title="Go to home"
          fullWidth
        />
      </NeumoSurface>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      backgroundColor: colors.background.default,
    },
    card: {
      width: "100%",
      maxWidth: 420,
      gap: 12,
    },
    title: {
      fontSize: Typography.size.lg,
      fontWeight: Typography.weight.bold as any,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: Typography.size.sm,
      color: colors.textSecondary,
      marginBottom: 8,
    },
  });
