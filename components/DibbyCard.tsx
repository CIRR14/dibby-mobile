import {
  faCheck,
  faEllipsis,
  faShare,
  faTrash,
  faUnlock,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Share,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
} from "react-native";
import { ThemeColors } from "../constants/Colors";
import {
  DibbyTrip,
  DibbyExpense,
  DibbyParticipant,
  DibbySplits,
} from "../constants/DibbyTypes";
import {
  getDibbySplitMethodString,
  timestampToString,
} from "../helpers/TypeHelpers";
import { getTravelerFromId, numberWithCommas } from "../helpers/AppHelpers";
import DibbyAvatars from "./DibbyAvatars";
import NeumoSurface from "./NeumoSurface";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import NeumoPressable from "./NeumoPressable";
import { resolveParticipantColor } from "../helpers/GenerateColor";
import useAppTheme from "../hooks/useAppTheme";

interface IDibbyCardProps {
  trip?: DibbyTrip;
  expense?: DibbyExpense;
  onPress?: () => void;
  onDeleteItem?: () => void;
  cardWidth?: number;
  wideScreen: boolean;
  onCompleteItem?: (setAs: boolean) => void;
  completed?: boolean;
}

export const DibbyCard: React.FC<IDibbyCardProps> = ({
  trip,
  expense,
  onPress,
  onDeleteItem,
  cardWidth,
  wideScreen,
  onCompleteItem,
  completed,
}) => {
  const colors = useAppTheme();
  const styles = makeStyles(
    colors as unknown as ThemeColors,
    wideScreen,
    cardWidth,
  );
  const [actionsOpen, setActionsOpen] = useState<boolean>(false);
  const hasActions = Boolean(onDeleteItem || onCompleteItem || trip || expense);

  const handleShare = async () => {
    try {
      const title = trip?.title || expense?.title || "Dibby";
      const detail = trip
        ? `Trip total: $${numberWithCommas(trip.amount?.toString() || "0")}`
        : expense
          ? `Expense: $${numberWithCommas(expense.amount?.toString() || "0")}`
          : "";
      await Share.share({
        title,
        message: [title, detail].filter(Boolean).join(" • "),
      });
    } catch (err) {
      if (Platform.OS === "web") {
        Alert.alert("Share", "Sharing isn't available on web yet.");
      }
    }
  };

  const getAvatarArray = (
    pplInExpense: DibbySplits[],
    payer: string,
  ): DibbyParticipant[] => {
    const arr: DibbyParticipant[] = [
      ...pplInExpense.map((p) => {
        const traveler = getTravelerFromId(trip, p.uid);
        return {
          name: traveler?.name || traveler?.username || p.name,
          uid: p.uid,
          username: null,
          owed: p.amount,
          amountPaid: 0,
          photoURL: traveler?.photoURL || null,
          color: resolveParticipantColor(
            traveler?.color,
            traveler?.uid || p.uid || p.name || "",
          ),
        };
      }),
    ];
    const itemToFind = payer;

    const foundIdx = arr.findIndex((el) => el.uid == itemToFind);

    if (foundIdx > 0) {
      const payingParticipant = arr[foundIdx];
      arr.splice(foundIdx, 1);
      arr.unshift(payingParticipant);
    }
    return arr;
  };

  return (
    <NeumoSurface
      variant="raised"
      radius={NeumoTokens.radius.lg}
      padding={0}
      style={{ margin: 8 }}
    >
      <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.cardContent}>
          <View style={styles.cardTextContainer}>
            <View style={styles.headerRow}>
              <Text style={[styles.text, styles.caption]}>
                {timestampToString((expense || trip)?.dateCreated)}
              </Text>
              {completed && (
                <NeumoSurface
                  variant="inset"
                  tone="surface"
                  radius={NeumoTokens.radius.pill}
                  padding={0}
                  style={styles.statusPill}
                >
                  <View style={styles.statusContent}>
                    <FontAwesomeIcon
                      icon={faCheck}
                      size={10}
                      color={colors.success.background}
                    />
                    <Text style={styles.statusText}>Completed</Text>
                  </View>
                </NeumoSurface>
              )}
            </View>

            <Text style={[styles.text, styles.title]}>
              {(expense || trip)?.title}
            </Text>
            <Text
              style={[
                styles.text,
                styles.subtitle,
                {
                  color:
                    trip ||
                    (expense && ((expense || trip)?.amount as number) > 0)
                      ? colors.info.background
                      : colors.danger.card,
                },
              ]}
            >
              {expense && trip && (expense.amount as number) > 0
                ? `Total Cost: $${numberWithCommas(expense?.amount.toString())}`
                : !expense && trip && trip.amount > 0
                  ? `Total Cost: $${numberWithCommas(trip?.amount.toString())}`
                  : expense && trip
                    ? "No cost yet!"
                    : `No expenses yet!`}
            </Text>
          </View>

          {trip &&
            (expense ? (
              <View
                style={{
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginBottom: 12,
                }}
              >
                <DibbyAvatars
                  expense={expense}
                  onPress={onPress}
                  travelers={getAvatarArray(
                    expense.peopleInExpense,
                    expense.paidBy,
                  )}
                />
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: Typography.size.sm,
                    }}
                  >
                    {getDibbySplitMethodString(expense.splitMethod)}
                  </Text>
                </View>
              </View>
            ) : (
              <DibbyAvatars onPress={onPress} travelers={trip.participants} />
            ))}
        </View>
      </TouchableOpacity>
      {hasActions && (
        <View style={styles.moreButton}>
          <NeumoPressable
            onPress={() => setActionsOpen((prev) => !prev)}
            variant="flat"
            tone="base"
            radius={NeumoTokens.radius.pill}
            padding={6}
            style={styles.moreButtonInner}
          >
            <FontAwesomeIcon
              icon={faEllipsis}
              size={14}
              color={colors.textSecondary}
            />
          </NeumoPressable>
        </View>
      )}
      {actionsOpen && hasActions && (
        <View style={styles.actionRow}>
          {trip && !expense && onCompleteItem && (
            <NeumoPressable
              onPress={() => {
                onCompleteItem(!!!completed);
                setActionsOpen(false);
              }}
              variant="inset"
              tone="surface"
              radius={NeumoTokens.radius.md}
              padding={NeumoTokens.spacing.sm}
              style={styles.actionButton}
            >
              <View style={styles.actionContent}>
                <FontAwesomeIcon
                  icon={completed ? faUnlock : faCheck}
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.actionText}>
                  {completed ? "Reopen" : "Complete"}
                </Text>
              </View>
            </NeumoPressable>
          )}
          {(trip || expense) && (
            <NeumoPressable
              onPress={async () => {
                await handleShare();
                setActionsOpen(false);
              }}
              variant="inset"
              tone="surface"
              radius={NeumoTokens.radius.md}
              padding={NeumoTokens.spacing.sm}
              style={styles.actionButton}
            >
              <View style={styles.actionContent}>
                <FontAwesomeIcon
                  icon={faShare}
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.actionText}>Share</Text>
              </View>
            </NeumoPressable>
          )}
          {onDeleteItem && (expense || !completed) && (
            <NeumoPressable
              onPress={() => {
                onDeleteItem();
                setActionsOpen(false);
              }}
              variant="inset"
              tone="surface"
              radius={NeumoTokens.radius.md}
              padding={NeumoTokens.spacing.sm}
              style={styles.actionButton}
            >
              <View style={styles.actionContent}>
                <FontAwesomeIcon
                  icon={faTrash}
                  size={14}
                  color={colors.danger.background}
                />
                <Text style={[styles.actionText, styles.deleteText]}>
                  Delete
                </Text>
              </View>
            </NeumoPressable>
          )}
        </View>
      )}
    </NeumoSurface>
  );
};

const makeStyles = (
  colors: ThemeColors,
  wideScreen: boolean,
  cardWidth?: number,
) =>
  StyleSheet.create({
    card: {
      minWidth: wideScreen ? cardWidth : 0,
      backgroundColor: "transparent",
      padding: 16,
      borderRadius: NeumoTokens.radius.lg,
      display: "flex",
      justifyContent: "center",
    },
    cardContent: {
      display: "flex",
      justifyContent: "space-between",
      flexDirection: "row",
    },
    cardTextContainer: {
      maxWidth: "70%",
      display: "flex",
      justifyContent: "space-between",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    moreButton: {
      position: "absolute",
      top: 10,
      right: 10,
      zIndex: 10,
    },
    moreButtonInner: {
      minWidth: 28,
      minHeight: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      color: colors.textPrimary,
      paddingVertical: 4,
    },
    avatarContainer: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 8,
    },
    title: {
      fontSize: Typography.size.lg,
      fontWeight: Typography.weight.bold as any,
      textTransform: "capitalize",
      overflow: "hidden",
    },
    subtitle: {
      fontSize: Typography.size.sm,
    },
    caption: {
      fontSize: Typography.size.xs,
      textTransform: "uppercase",
    },
    statusPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      margin: 4,
    },
    statusText: {
      color: colors.success.background,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    actionRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 14,
    },
    actionButton: {
      minHeight: 36,
    },
    actionContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    actionText: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
      textTransform: "uppercase",
    },
    deleteText: {
      color: colors.danger.background,
    },
    itemGrid: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      margin: 4,
    },
  });
