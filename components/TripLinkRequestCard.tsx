import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { DibbyTripLinkRequest } from "../constants/DibbyTypes";
import { ThemeColors } from "../constants/Colors";
import { formatTitleWithEmoji } from "../helpers/AppHelpers";
import DibbyButton from "./DibbyButton";
import NeumoSurface from "./NeumoSurface";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";

interface TripLinkRequestCardProps {
  request: DibbyTripLinkRequest;
  mode: "invitee" | "owner";
  onAccept?: (request: DibbyTripLinkRequest) => void;
  onReject?: (request: DibbyTripLinkRequest) => void;
  onCancel?: (request: DibbyTripLinkRequest) => void;
  busy?: boolean;
}

export const TripLinkRequestCard: React.FC<TripLinkRequestCardProps> = ({
  request,
  mode,
  onAccept,
  onReject,
  onCancel,
  busy,
}) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const tripTitle = formatTitleWithEmoji(request.tripTitle, request.tripEmoji);
  const ownerLabel = request.requestedByUsername
    ? `@${request.requestedByUsername}`
    : request.requestedByName || "the trip owner";
  const targetLabel = request.targetUsername
    ? `@${request.targetUsername}`
    : "the invited user";

  return (
    <NeumoSurface
      variant="raised"
      tone="surface"
      radius={NeumoTokens.radius.lg}
      style={styles.card}
    >
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>
          {mode === "invitee" ? "Trip invite" : "Pending link request"}
        </Text>
        <Text style={styles.title}>{tripTitle}</Text>
        <Text style={styles.description}>
          {mode === "invitee"
            ? `${ownerLabel} invited you to claim ${request.guestName}.`
            : `${targetLabel} can claim ${
                request.guestName
              }.`}
        </Text>
      </View>
      <View style={styles.actions}>
        {mode === "invitee" ? (
          <>
            <DibbyButton
              title="Accept"
              onPress={() => onAccept?.(request)}
              disabled={busy}
              size="sm"
            />
            <DibbyButton
              title="Reject"
              type="danger"
              onPress={() => onReject?.(request)}
              disabled={busy}
              size="sm"
            />
          </>
        ) : (
          <DibbyButton
            title="Cancel"
            type="danger"
            onPress={() => onCancel?.(request)}
            disabled={busy}
            size="sm"
          />
        )}
      </View>
    </NeumoSurface>
  );
};

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      gap: 12,
    },
    copy: {
      gap: 4,
    },
    eyebrow: {
      color: colors.accent,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
      textTransform: "uppercase",
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
    },
    description: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
    },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
  });
