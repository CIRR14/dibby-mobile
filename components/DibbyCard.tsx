import {
  faCheck,
  faShare,
  faTrash,
  faUnlock,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import React, { useMemo, useState } from "react";
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
import {
  formatTitleWithEmoji,
  getTravelerFromId,
  numberWithCommas,
} from "../helpers/AppHelpers";
import DibbyAvatars from "./DibbyAvatars";
import NeumoSurface from "./NeumoSurface";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import { resolveParticipantColor } from "../helpers/GenerateColor";
import useAppTheme from "../hooks/useAppTheme";
import ActionMenu, { ActionMenuItem } from "./ActionMenu";

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

const DibbyCardComponent: React.FC<IDibbyCardProps> = ({
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
  const [menuOpen, setMenuOpen] = useState(false);
  const displayTitle = formatTitleWithEmoji(
    (expense || trip)?.title,
    (expense || trip)?.emoji,
  );

  const handleShare = async () => {
    try {
      const title = displayTitle || "Dibby";
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

  const actionItems = useMemo<ActionMenuItem[]>(
    () => [
      ...(trip && !expense && onCompleteItem
        ? [
            {
              key: "complete",
              label: completed ? "Reopen" : "Complete",
              icon: completed ? faUnlock : faCheck,
              onPress: () => onCompleteItem(!completed),
            },
          ]
        : []),
      ...(trip || expense
        ? [
            {
              key: "share",
              label: "Share",
              icon: faShare,
              onPress: handleShare,
            },
          ]
        : []),
      ...(onDeleteItem && (expense || !completed)
        ? [
            {
              key: "delete",
              label: "Delete",
              icon: faTrash,
              destructive: true,
              onPress: onDeleteItem,
            },
          ]
        : []),
    ],
    [trip, expense, onCompleteItem, completed, onDeleteItem],
  );

  return (
    <NeumoSurface
      variant="glass"
      radius={NeumoTokens.radius.lg}
      padding={0}
      clipContent={false}
      style={{
        margin: 8,
        zIndex: menuOpen ? 100 : 1,
        elevation: menuOpen ? 20 : 1,
        position: "relative",
      }}
    >
      <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.cardContent}>
          <View style={styles.mainRow}>
            <View style={styles.textLane}>
              <View style={styles.headerRow}>
                <Text style={[styles.text, styles.caption]}>
                  {timestampToString((expense || trip)?.dateCreated)}
                </Text>
                {completed && (
                  <NeumoSurface
                    variant="solid"
                    tone="surface"
                    radius={NeumoTokens.radius.pill}
                    padding={NeumoTokens.control.pill.padding}
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

              <View style={styles.bodyRow}>
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.text, styles.title]}>{displayTitle}</Text>
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
                      ? `Total Cost: $${numberWithCommas(
                          expense?.amount.toString(),
                        )}`
                      : !expense && trip && trip.amount > 0
                        ? `Total Cost: $${numberWithCommas(
                            trip?.amount.toString(),
                          )}`
                        : expense && trip
                          ? "No cost yet!"
                          : `No expenses yet!`}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.visualLane}>
              <ActionMenu
                items={actionItems}
                compact
                onOpenChange={setMenuOpen}
              />
              {trip &&
                (expense ? (
                  <View style={styles.cardRight}>
                    <DibbyAvatars
                      expense={expense}
                      onPress={onPress}
                      travelers={getAvatarArray(
                        expense.peopleInExpense,
                        expense.paidBy,
                      )}
                    />
                    <View style={styles.splitRow}>
                      <Text style={styles.splitText}>
                        {getDibbySplitMethodString(expense.splitMethod)}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.cardRight}>
                    <DibbyAvatars onPress={onPress} travelers={trip.participants} />
                  </View>
                ))}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </NeumoSurface>
  );
};

export const DibbyCard = React.memo(DibbyCardComponent);

const makeStyles = (
  colors: ThemeColors,
  wideScreen: boolean,
  cardWidth?: number,
) =>
  StyleSheet.create({
    card: {
      minWidth: wideScreen ? cardWidth : 0,
      backgroundColor: "transparent",
      padding: 12,
      borderRadius: NeumoTokens.radius.lg,
      display: "flex",
      justifyContent: "center",
    },
    cardContent: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
    },
    mainRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 10,
    },
    textLane: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    visualLane: {
      width: 116,
      alignItems: "flex-end",
      gap: 8,
    },
    bodyRow: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    cardTextContainer: {
      maxWidth: "100%",
      display: "flex",
      justifyContent: "space-between",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 8,
    },
    cardRight: {
      alignItems: "flex-end",
      gap: 8,
      marginBottom: 6,
    },
    splitRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    splitText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
    },
    text: {
      color: colors.textPrimary,
      paddingVertical: 2,
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
      lineHeight: 30,
    },
    subtitle: {
      fontSize: Typography.size.sm,
    },
    caption: {
      fontSize: Typography.size.xs,
      textTransform: "uppercase",
    },
    statusPill: {
      paddingHorizontal: NeumoTokens.control.pill.paddingHorizontal,
      paddingVertical: 2,
      minHeight: NeumoTokens.control.pill.minHeight,
    },
    statusContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      margin: 2,
    },
    statusText: {
      color: colors.success.background,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    itemGrid: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      margin: 4,
    },
  });
