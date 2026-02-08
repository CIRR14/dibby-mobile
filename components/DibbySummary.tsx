import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { numberWithCommas, inRange, sumOfValues } from "../helpers/AppHelpers";
import { ITransactionResponse } from "../helpers/DibbyLogic";
import { ThemeColors } from "../constants/Colors";
import { DibbyTrip } from "../constants/DibbyTypes";
import {
  changeOpacity,
  resolveParticipantColor,
} from "../helpers/GenerateColor";
import NeumoSurface from "./NeumoSurface";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";

interface DibbySummary {
  currentTrip: DibbyTrip;
  calculatedTrip: ITransactionResponse;
}
const DibbySummary: React.FC<DibbySummary> = ({
  currentTrip,
  calculatedTrip,
}) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const totalAmount =
    currentTrip.amount ||
    sumOfValues(currentTrip.expenses.map((exp) => exp.amount));
  const perPersonAverage =
    currentTrip.perPersonAverage ||
    (currentTrip.participants.length > 0
      ? totalAmount / currentTrip.participants.length
      : 0);
  const isSettled = currentTrip.participants.every((t) =>
    inRange(t.owed, -0.01, 0.01),
  );
  const sortedBalances = [...currentTrip.participants].sort(
    (a, b) => Math.abs(b.owed) - Math.abs(a.owed),
  );
  const transactions = calculatedTrip.transactions.slice(0, 4);
  const expenseCount = currentTrip.expenses.length;
  const openBalances = currentTrip.participants.filter(
    (t) => !inRange(t.owed, -0.01, 0.01),
  ).length;

  return (
    <NeumoSurface
      variant="raised"
      tone="surface"
      radius={NeumoTokens.radius.lg}
      padding={NeumoTokens.spacing.md}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Settle up</Text>
            <Text style={styles.subtitle}>
              {isSettled
                ? "All balances are settled"
                : `${calculatedTrip.finalNumberOfTransactions} suggested payments`}
            </Text>
          </View>
          <NeumoSurface
            variant="raised"
            tone="surface"
            radius={NeumoTokens.radius.md}
            padding={NeumoTokens.spacing.sm}
          >
            <Text
              style={[
                styles.statusPill,
                {
                  color: isSettled ? colors.success.background : colors.accent,
                },
              ]}
            >
              {isSettled ? "Settled" : "Open"}
            </Text>
          </NeumoSurface>
        </View>

        <View style={styles.statsGrid}>
          <NeumoSurface
            variant="flat"
            tone="surface"
            radius={NeumoTokens.radius.md}
            padding={NeumoTokens.spacing.sm}
            style={styles.statCard}
          >
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>
              ${numberWithCommas(totalAmount.toString())}
            </Text>
          </NeumoSurface>
          <NeumoSurface
            variant="flat"
            tone="surface"
            radius={NeumoTokens.radius.md}
            padding={NeumoTokens.spacing.sm}
            style={styles.statCard}
          >
            <Text style={styles.statLabel}>Per person</Text>
            <Text style={styles.statValue}>
              ${numberWithCommas(perPersonAverage.toString())}
            </Text>
          </NeumoSurface>
          <NeumoSurface
            variant="flat"
            tone="surface"
            radius={NeumoTokens.radius.md}
            padding={NeumoTokens.spacing.sm}
            style={styles.statCard}
          >
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={styles.statValue}>{expenseCount}</Text>
          </NeumoSurface>
          <NeumoSurface
            variant="flat"
            tone="surface"
            radius={NeumoTokens.radius.md}
            padding={NeumoTokens.spacing.sm}
            style={styles.statCard}
          >
            <Text style={styles.statLabel}>Open balances</Text>
            <Text style={styles.statValue}>{openBalances}</Text>
          </NeumoSurface>
        </View>

        <View style={styles.balanceList}>
          <Text style={styles.sectionTitle}>Balances</Text>
          {sortedBalances.map((t) => {
            const status =
              t.owed > 0.01 ? "Gets back" : t.owed < -0.01 ? "Owes" : "Settled";
            const amount = Math.abs(t.owed);
            return (
              <NeumoSurface
                key={t.uid}
                variant="flat"
                tone="surface"
                radius={NeumoTokens.radius.md}
                padding={NeumoTokens.spacing.sm}
                style={styles.balanceRow}
              >
                <View style={styles.balanceUser}>
                  <View
                    style={[
                      styles.userBadge,
                      {
                        backgroundColor: changeOpacity(
                          resolveParticipantColor(
                            t.color,
                            t.uid || t.username || t.name || "",
                          ),
                          0.85,
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {t.name || t.username || "Unknown"}
                    </Text>
                  </View>
                  <Text style={styles.balanceStatus}>{status}</Text>
                </View>
                <Text
                  style={[
                    styles.balanceAmount,
                    {
                      color:
                        t.owed > 0
                          ? colors.info.background
                          : t.owed < 0
                            ? colors.danger.background
                            : colors.textSecondary,
                    },
                  ]}
                >
                  ${numberWithCommas(amount.toString())}
                </Text>
              </NeumoSurface>
            );
          })}
        </View>

        {transactions.length > 0 && (
          <View style={styles.transactions}>
            <Text style={styles.sectionTitle}>Suggested payments</Text>
            {transactions.map((t, index) => (
              <View
                key={`${t.owee.uid}-${index}`}
                style={styles.transactionRow}
              >
                <Text style={styles.transactionText}>
                  {t.owee.name} → {t.owed.name}
                </Text>
                <Text style={styles.transactionAmount}>
                  ${numberWithCommas(t.amount.toString())}
                </Text>
              </View>
            ))}
            {calculatedTrip.transactions.length > transactions.length && (
              <Text style={styles.moreText}>
                +{calculatedTrip.transactions.length - transactions.length} more
                payments
              </Text>
            )}
          </View>
        )}
      </View>
    </NeumoSurface>
  );
};

export default DibbySummary;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      margin: 16,
    },
    content: {
      gap: NeumoTokens.spacing.md,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      fontSize: Typography.size.lg,
      fontWeight: Typography.weight.bold as any,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: Typography.size.sm,
      color: colors.textSecondary,
    },
    statusPill: {
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
      textTransform: "uppercase",
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    statCard: {
      flexBasis: "48%",
      alignItems: "flex-start",
      backgroundColor: colors.surfaceAlt,
    },
    statLabel: {
      fontSize: Typography.size.xs,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    statValue: {
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
      color: colors.textPrimary,
      marginTop: 4,
    },
    balanceList: {
      gap: 10,
    },
    balanceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    balanceUser: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    userBadge: {
      borderRadius: NeumoTokens.radius.md,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    badgeText: {
      fontSize: Typography.size.sm,
      color: colors.textPrimary,
      fontWeight: Typography.weight.semibold as any,
    },
    balanceStatus: {
      fontSize: Typography.size.sm,
      color: colors.textSecondary,
    },
    balanceAmount: {
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
      textAlign: "right",
    },
    transactions: {
      gap: 8,
    },
    sectionTitle: {
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    transactionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    transactionText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
    },
    transactionAmount: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
    moreText: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
    },
  });
