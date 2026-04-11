import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../components/TopBar";
import { useNavigation } from "@react-navigation/native";
import { ThemeColors } from "../constants/Colors";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  formatTitleWithEmoji,
  getTravelerFromId,
  inRange,
  numberWithCommas,
} from "../helpers/AppHelpers";
import DibbyButton from "../components/DibbyButton";
import { faChevronLeft, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  DibbyExpense,
  DibbySplitMethod,
  DibbyTrip,
} from "../constants/DibbyTypes";
import {
  changeOpacity,
  resolveParticipantColor,
} from "../helpers/GenerateColor";
import { deleteDibbyExpense } from "../helpers/FirebaseHelpers";
import NeumoSurface from "../components/NeumoSurface";
import { FloatingTabBar, NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";
import StatsSection from "../components/StatsSection";
import { buildExpenseStats, pickStats } from "../helpers/StatsHelpers";
import { useUser } from "../hooks/useUser";
import { getDibbySplitMethodString } from "../helpers/TypeHelpers";
import ScreenState, { ScreenStateStatus } from "../components/ScreenState";
import ScreenLayout from "../components/ScreenLayout";
import useResponsiveLayout from "../hooks/useResponsiveLayout";
import ActionMenu, { ActionMenuItem } from "../components/ActionMenu";
import { subscribeTripExpenses } from "../helpers/TripRepository";

const ViewExpense = ({ route }: any) => {
  const colors = useAppTheme();
  const responsive = useResponsiveLayout();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();
  const { tripName, tripId, expenseId } = route.params;
  const { dibbyUser } = useUser();
  const [currentExpense, setCurrentExpense] = useState<DibbyExpense>();
  const [currentTrip, setCurrentTrip] = useState<DibbyTrip>();
  const [tripExpenses, setTripExpenses] = useState<DibbyExpense[]>([]);
  const expenseStats = useMemo(
    () =>
      currentExpense
        ? buildExpenseStats(currentExpense, currentTrip, dibbyUser?.uid)
        : [],
    [currentExpense, currentTrip, dibbyUser?.uid],
  );
  const expenseCompactStats = useMemo(
    () =>
      pickStats(expenseStats, [
        "expense-amount",
        "expense-split",
        "expense-participants",
        "expense-paid-by",
      ]),
    [expenseStats],
  );
  const statsColumns = responsive.isDesktop ? 2 : 2;
  const safeNumber = (value?: number | null) =>
    Number.isFinite(value as number) ? (value as number) : 0;

  const expenseBreakdown = useMemo(() => {
    if (!currentExpense) {
      return [];
    }
    const total = safeNumber(currentExpense.amount);
    return currentExpense.peopleInExpense.map((split) => {
      const traveler = getTravelerFromId(currentTrip, split.uid);
      const amount = safeNumber(split.amount);
      const percent = total > 0 ? (amount / total) * 100 : 0;
      const color = resolveParticipantColor(
        traveler?.color,
        traveler?.uid || traveler?.username || split.uid || split.name || "",
      );
      return {
        uid: split.uid,
        name: traveler?.name || split.name || "Unknown",
        amount,
        percent,
        color,
        paidBy: currentExpense.paidBy === split.uid,
      };
    });
  }, [currentExpense, currentTrip]);

  const splitLabel = currentExpense
    ? getDibbySplitMethodString(currentExpense.splitMethod)
    : "";
  const participantIds = currentExpense?.peopleInExpense.map((p) => p.uid) || [];
  const hasDuplicateParticipants =
    participantIds.length !== new Set(participantIds).size;
  const paidByIncluded = Boolean(
    currentExpense?.paidBy &&
      participantIds.includes(currentExpense.paidBy),
  );
  const splitTotal = expenseBreakdown.reduce(
    (acc, item) => acc + item.amount,
    0,
  );
  const remainder = safeNumber(currentExpense?.amount) - splitTotal;
  const isBalanced = inRange(remainder, -0.01, 0.01);
  const expenseTitle = formatTitleWithEmoji(
    currentExpense?.title,
    currentExpense?.emoji,
  );
  const tripTitle = formatTitleWithEmoji(tripName, currentTrip?.emoji);
  const expenseScreenStatus: ScreenStateStatus = useMemo(() => {
    if (!currentTrip) {
      return "loading";
    }
    if (!currentExpense) {
      return "empty";
    }
    return "ready";
  }, [currentTrip, currentExpense]);
  const expenseActions = useMemo<ActionMenuItem[]>(
    () =>
      currentExpense && currentTrip
        ? [
            {
              key: "delete",
              label: "Delete expense",
              icon: faTrash,
              destructive: true,
              onPress: () => deleteDibbyExpense(currentExpense, currentTrip),
            },
          ]
        : [],
    [currentExpense, currentTrip],
  );

  const renderHeaderMeta = () => (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{expenseTitle}</Text>
        <Text style={styles.title}>
          ${numberWithCommas((currentExpense?.amount || 0).toString())}
        </Text>
      </View>
      <Text style={styles.metaText}>Trip: {tripTitle}</Text>
    </>
  );

  const renderStatsCard = () =>
    currentExpense ? (
      <NeumoSurface
        variant="glass"
        tone="surface"
        radius={NeumoTokens.radius.lg}
        style={styles.statsCard}
      >
        <StatsSection
          title="Expense stats"
          compactItems={expenseCompactStats}
          fullItems={expenseStats}
          compactColumns={2}
          expandedColumns={statsColumns}
        />
      </NeumoSurface>
    ) : null;

  const renderBreakdownCard = () =>
    currentExpense ? (
      <NeumoSurface
        variant="glass"
        tone="surface"
        radius={NeumoTokens.radius.lg}
        style={styles.breakdownCard}
      >
        <View style={styles.breakdownHeader}>
          <Text style={styles.breakdownTitle}>Breakdown</Text>
          <Text style={styles.breakdownMeta}>Split: {splitLabel}</Text>
        </View>
        <View style={styles.breakdownList}>
          {expenseBreakdown.map((item) => (
            <NeumoSurface
              key={item.uid}
              variant="solid"
              tone="surface"
              radius={NeumoTokens.radius.md}
              style={[
                styles.breakdownRow,
                {
                  backgroundColor: changeOpacity(item.color, 0.85),
                },
              ]}
            >
              <View style={styles.breakdownLeft}>
                <Text style={styles.breakdownName}>{item.name}</Text>
                {item.paidBy && <Text style={styles.breakdownBadge}>Paid</Text>}
              </View>
              <View style={styles.breakdownRight}>
                {currentExpense.splitMethod === DibbySplitMethod.PERCENTAGE && (
                  <Text style={styles.breakdownPercent}>
                    {item.percent.toFixed(0)}%
                  </Text>
                )}
                <Text style={styles.breakdownAmount}>
                  ${numberWithCommas(item.amount.toString())}
                </Text>
              </View>
            </NeumoSurface>
          ))}
        </View>
        {(hasDuplicateParticipants || !paidByIncluded || !isBalanced) && (
          <View style={styles.breakdownWarning}>
            {!paidByIncluded && (
              <Text style={styles.warningText}>
                Paid-by person isn’t included in this expense.
              </Text>
            )}
            {hasDuplicateParticipants && (
              <Text style={styles.warningText}>
                Duplicate participants detected in the split.
              </Text>
            )}
            {!isBalanced && (
              <Text style={styles.warningText}>
                Split amounts don’t add up to the expense total.
              </Text>
            )}
          </View>
        )}
      </NeumoSurface>
    ) : null;

  const renderBalanceRow = () => (
    <View style={styles.totalRow}>
      <Text style={styles.remainderLabel}>
        {isBalanced ? "Balanced" : "Unallocated"}
      </Text>
      <Text
        style={[
          styles.remainderValue,
          {
            color: isBalanced ? colors.success.background : colors.danger.button,
          },
        ]}
      >
        ${numberWithCommas((isBalanced ? 0 : remainder).toString())}
      </Text>
    </View>
  );

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "trips", tripId), (docSnap) => {
      if (!docSnap.exists()) {
        setCurrentTrip(undefined);
        setCurrentExpense(undefined);
        setTripExpenses([]);
        return;
      }
      const newData: DibbyTrip = {
        ...(docSnap.data() as DibbyTrip),
        id: docSnap.id,
      };
      setCurrentTrip(newData);
    });

    return () => {
      unsub();
    };
  }, [tripId]);

  useEffect(() => {
    if (!currentTrip) {
      setTripExpenses([]);
      return;
    }
    const unsub = subscribeTripExpenses(currentTrip, (expenses) => {
      setTripExpenses(expenses);
    });
    return () => unsub();
  }, [currentTrip?.id, currentTrip?.dateUpdated]);

  useEffect(() => {
    if (!currentTrip) {
      setCurrentExpense(undefined);
      return;
    }
    const expense = tripExpenses.find((item) => item.id === expenseId);
    if (expense) {
      setCurrentExpense(expense);
      return;
    }
    const legacyExpense = currentTrip.expenses.find((item) => item.id === expenseId);
    setCurrentExpense(legacyExpense);
  }, [tripExpenses, currentTrip, expenseId]);

  return (
    <View style={styles.topContainer}>
      <SafeAreaView style={styles.topContainer}>
        <TopBar
          withSurface={false}
          title={expenseTitle}
          leftButton={
            <DibbyButton
              type="clear"
              onPress={() =>
                navigation.navigate("ViewTrip", { tripName, tripId })
              }
              title={
                <FontAwesomeIcon
                  icon={faChevronLeft}
                  size={24}
                  color={colors.textPrimary}
                />
              }
            />
          }
          rightButton={
            <ActionMenu items={expenseActions} compact />
          }
        />

        <ScreenLayout contentStyle={styles.layoutContent}>
          <ScreenState
            status={expenseScreenStatus}
            title="Expense not found"
            description="This expense may have been deleted."
            actionLabel="Back to trip"
            onAction={() => navigation.navigate("ViewTrip", { tripName, tripId })}
          >
            <ScrollView
              contentContainerStyle={
                responsive.isDesktop
                  ? styles.desktopScrollContent
                  : styles.scrollContent
              }
              showsVerticalScrollIndicator={false}
            >
              {responsive.isDesktop ? (
                <View style={styles.desktopShell}>
                  <View style={styles.desktopPrimary}>
                    <View style={styles.content}>
                      {renderHeaderMeta()}
                      {renderBreakdownCard()}
                      {renderBalanceRow()}
                    </View>
                  </View>
                  <View style={styles.desktopAside}>{renderStatsCard()}</View>
                </View>
              ) : (
                <View style={styles.content}>
                  {renderHeaderMeta()}
                  {renderStatsCard()}
                  {renderBreakdownCard()}
                  {renderBalanceRow()}
                </View>
              )}
            </ScrollView>
          </ScreenState>
        </ScreenLayout>
      </SafeAreaView>
    </View>
  );
};

export default ViewExpense;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    layoutContent: {
      flex: 1,
      paddingTop: 74,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: FloatingTabBar.spacer + NeumoTokens.spacing.xs,
      overflow: "visible",
    },
    desktopScrollContent: {
      padding: 16,
      paddingBottom: FloatingTabBar.spacer + NeumoTokens.spacing.md,
      overflow: "visible",
    },
    content: {
      gap: 16,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontSize: Typography.size.lg,
      color: colors.textPrimary,
      textTransform: "capitalize",
      fontWeight: Typography.weight.semibold as any,
    },
    metaText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      marginTop: 4,
    },
    statsCard: {
      marginTop: 8,
      gap: 8,
    },
    breakdownCard: {
      marginTop: 8,
      gap: 12,
    },
    breakdownHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    breakdownTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
    },
    breakdownMeta: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
    },
    breakdownList: {
      gap: 10,
    },
    breakdownRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    breakdownLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    breakdownName: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
    breakdownBadge: {
      color: colors.success.background,
      backgroundColor: changeOpacity(colors.background.paper, 0.35),
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: NeumoTokens.radius.pill,
      overflow: "hidden",
    },
    breakdownRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    breakdownPercent: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
    },
    breakdownAmount: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
    breakdownWarning: {
      marginTop: 6,
      gap: 4,
    },
    warningText: {
      color: colors.warning.button,
      fontSize: Typography.size.xs,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.surfaceGlass,
    },
    remainderLabel: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
    },
    remainderValue: {
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
    desktopShell: {
      flex: 1,
      flexDirection: "row",
      gap: 20,
      overflow: "visible",
    },
    desktopPrimary: {
      flex: 1.3,
      minWidth: 0,
      overflow: "visible",
    },
    desktopAside: {
      flex: 0.9,
      minWidth: 0,
      alignSelf: "flex-start",
      position: Platform.OS === "web" ? ("sticky" as any) : "relative",
      top: Platform.OS === "web" ? 0 : undefined,
    },
  });
