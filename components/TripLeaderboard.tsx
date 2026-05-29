import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  changeOpacity,
  resolveParticipantColor,
} from "../helpers/GenerateColor";
import { ThemeColors } from "../constants/Colors";
import useAppTheme from "../hooks/useAppTheme";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import { LeaderboardEntry } from "../constants/DibbyTypes";
import { ITransaction } from "../helpers/DibbyLogic";
import { numberWithCommas } from "../helpers/AppHelpers";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronDown, faChevronUp, faMoneyBillWave } from "@fortawesome/free-solid-svg-icons";

interface TripLeaderboardProps {
  entries: LeaderboardEntry[];
  nextPayment?: ITransaction;
  onSettleNow: () => void;
}

const TripLeaderboard: React.FC<TripLeaderboardProps> = ({
  entries,
  nextPayment,
  onSettleNow,
}) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const [expanded, setExpanded] = useState(false);
  const topEntries = useMemo(() => entries.slice(0, 3), [entries]);

  if (!entries.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>No balances yet for this group.</Text>
      </View>
    );
  }

  const visibleEntries = expanded ? entries : topEntries;
  const hasMoreEntries = entries.length > topEntries.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Who should pay next?</Text>
          <Text style={styles.subtitle}>Debt-first leaderboard</Text>
        </View>
        {nextPayment ? (
          <Pressable
            onPress={onSettleNow}
            style={styles.settleButton}
          >
            <View style={styles.settleContent}>
              <FontAwesomeIcon
                icon={faMoneyBillWave}
                size={12}
                color={colors.primary.text}
              />
              <Text style={styles.settleText}>Settle now</Text>
            </View>
          </Pressable>
        ) : null}
      </View>

      {nextPayment ? (
        <View style={styles.nextPaymentCard}>
          <Text style={styles.nextPaymentText}>
            {nextPayment.owee.name} pays {nextPayment.owed.name}
          </Text>
          <Text style={styles.nextPaymentAmount}>
            ${numberWithCommas(nextPayment.amount.toString())}
          </Text>
        </View>
      ) : null}

      <View style={styles.rows}>
        {visibleEntries.map((entry) => (
          <View
            key={entry.uid}
            style={styles.row}
          >
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.rankBadge,
                  {
                    backgroundColor: changeOpacity(
                      resolveParticipantColor(entry.color, entry.uid),
                      0.25,
                    ),
                  },
                ]}
              >
                <Text style={styles.rankText}>#{entry.rank}</Text>
              </View>
              <Text style={styles.name}>{entry.displayName}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.amount}>
                $
                {numberWithCommas(
                  (entry.amountToPay > 0
                    ? entry.amountToPay
                    : entry.amountToReceive
                  ).toString(),
                )}
              </Text>
              <Text style={styles.helper}>
                {entry.amountToPay > 0
                  ? "Owes"
                  : entry.amountToReceive > 0
                    ? "Gets back"
                    : "Settled"}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {hasMoreEntries && (
        <Pressable
          onPress={() => setExpanded((value) => !value)}
        >
          <View style={styles.expandRow}>
            <Text style={styles.expandText}>
              {expanded ? "View less" : "View full ranking"}
            </Text>
            <FontAwesomeIcon
              icon={expanded ? faChevronUp : faChevronDown}
              size={12}
              color={colors.textSecondary}
            />
          </View>
        </Pressable>
      )}
    </View>
  );
};

export default TripLeaderboard;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: 10,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      marginTop: 2,
    },
    settleButton: {
      paddingHorizontal: NeumoTokens.control.pill.paddingHorizontal,
      minHeight: NeumoTokens.control.pill.minHeight,
      minWidth: 118,
    },
    settleContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    settleText: {
      color: colors.primary.text,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    nextPaymentCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    nextPaymentText: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.medium as any,
      flex: 1,
    },
    nextPaymentAmount: {
      color: colors.accent,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.bold as any,
    },
    rows: {
      gap: 8,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
      minWidth: 0,
    },
    rankBadge: {
      borderRadius: NeumoTokens.radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    rankText: {
      color: colors.textPrimary,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
    },
    name: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.medium as any,
      flexShrink: 1,
    },
    rowRight: {
      alignItems: "flex-end",
    },
    amount: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
    helper: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      marginTop: 2,
    },
    expandContainer: {
      alignSelf: "center",
    },
    expandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    expandText: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  });
