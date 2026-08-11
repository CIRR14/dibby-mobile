import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { doc, onSnapshot } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronLeft, faPlus } from "@fortawesome/free-solid-svg-icons";

import TopBar from "../components/TopBar";
import { ThemeColors } from "../constants/Colors";
import {
  DibbyPaymentStatus,
  DibbyTrip,
  DibbyTripPayment,
} from "../constants/DibbyTypes";
import { db } from "../firebase";
import useAppTheme from "../hooks/useAppTheme";
import { calculateTrip } from "../helpers/DibbyLogic";
import {
  formatTitleWithEmoji,
  getTravelerFromId,
  numberWithCommas,
} from "../helpers/AppHelpers";
import { buildTripStats, pickStats } from "../helpers/StatsHelpers";
import StatsSection from "../components/StatsSection";
import NeumoSurface from "../components/NeumoSurface";
import { FloatingTabBar, NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import ScreenState, { ScreenStateStatus } from "../components/ScreenState";
import DibbyButton from "../components/DibbyButton";
import DibbyInput from "../components/DibbyInput";
import NeumoPressable from "../components/NeumoPressable";
import { useUser } from "../hooks/useUser";
import {
  createTripPayment,
  deleteTripPayment,
  updateTripPayment,
} from "../helpers/FirebaseHelpers";
import { useTripPayments } from "../hooks/useTripPayments";

const Payments = ({ route }: any) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation: any = useNavigation();
  const { tripName, tripId } = route.params || {};
  const { dibbyUser } = useUser();
  const [currentTrip, setCurrentTrip] = useState<DibbyTrip>();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] =
    useState<DibbyTripPayment | null>(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [note, setNote] = useState("");
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<
    "all" | DibbyPaymentStatus
  >("all");
  const { payments } = useTripPayments(tripId);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "trips", tripId), (snap) => {
      if (snap.exists()) {
        setCurrentTrip(snap.data() as DibbyTrip);
      }
    });
    return () => unsub();
  }, [tripId]);

  const calculatedTrip = useMemo(() => {
    if (!currentTrip) {
      return undefined;
    }
    return calculateTrip(JSON.parse(JSON.stringify(currentTrip)));
  }, [currentTrip]);

  const tripTitle = useMemo(
    () =>
      formatTitleWithEmoji(currentTrip?.title || tripName, currentTrip?.emoji),
    [currentTrip?.title, currentTrip?.emoji, tripName],
  );

  const tripStats = useMemo(
    () => (currentTrip ? buildTripStats(currentTrip, dibbyUser?.uid) : []),
    [currentTrip, dibbyUser?.uid],
  );
  const tripCompactStats = useMemo(
    () => pickStats(tripStats, ["trip-total", "trip-user-spent", "trip-open"]),
    [tripStats],
  );
  const statsColumns = 2;
  const screenStatus: ScreenStateStatus = useMemo(() => {
    if (!currentTrip) {
      return "loading";
    }
    return "ready";
  }, [currentTrip]);

  const openPaymentModal = (transaction: any) => {
    setSelectedPayment(null);
    setSelectedTransaction(transaction);
    setAmountPaid(String(transaction.amount || 0));
    setNote("");
    setCreateModalVisible(true);
  };

  const openEditPaymentModal = (payment: DibbyTripPayment) => {
    setSelectedTransaction(null);
    setSelectedPayment(payment);
    setAmountPaid(String(payment.amountPaid || payment.amount || 0));
    setNote(payment.note || "");
    setCreateModalVisible(true);
  };

  const submitPayment = async () => {
    if (!dibbyUser || !currentTrip) {
      return;
    }

    const isEditing = Boolean(selectedPayment);
    const fromUid = isEditing
      ? selectedPayment?.fromUid
      : selectedTransaction?.owee?.uid;
    const toUid = isEditing
      ? selectedPayment?.toUid
      : selectedTransaction?.owed?.uid;
    const amount = isEditing
      ? Number(selectedPayment?.amount) || 0
      : Number(selectedTransaction?.amount) || 0;
    const paid = Number(amountPaid) || 0;

    if (!fromUid || !toUid) {
      Alert.alert(
        "Select travelers",
        "Choose who paid and who received this payment.",
      );
      return;
    }

    if (fromUid === toUid) {
      Alert.alert(
        "Invalid travelers",
        "Payer and recipient must be different travelers.",
      );
      return;
    }

    if (amount <= 0) {
      Alert.alert(
        "Enter a total amount",
        "Payment total must be greater than zero.",
      );
      return;
    }

    if (paid <= 0) {
      Alert.alert(
        "Enter a payment amount",
        "Payment amount must be greater than zero.",
      );
      return;
    }

    if (paid > amount) {
      Alert.alert(
        "Invalid amount",
        "Partial payment cannot exceed the suggested amount.",
      );
      return;
    }

    const busyId = selectedPayment
      ? selectedPayment.id
      : `${selectedTransaction.owee.uid}_${selectedTransaction.owed.uid}`;
    setBusyPaymentId(busyId);
    try {
      if (selectedPayment) {
        await updateTripPayment(dibbyUser, selectedPayment, {
          fromUid,
          toUid,
          amount,
          amountPaid: paid,
          note: note || null,
        });
      } else {
        await createTripPayment(dibbyUser, currentTrip, {
          fromUid,
          toUid,
          amount,
          amountPaid: paid,
          note: note || null,
        });
      }
      setCreateModalVisible(false);
      setSelectedTransaction(null);
      setSelectedPayment(null);
      setAmountPaid("");
      setNote("");
    } catch (error: any) {
      Alert.alert(
        "Unable to save payment",
        error?.message || "Try again later.",
      );
    } finally {
      setBusyPaymentId(null);
    }
  };

  const suggestedPayments = calculatedTrip?.transactions || [];
  const openBalances =
    currentTrip?.participants?.filter((p) => Math.abs(p.owed) > 0.01).length ||
    0;

  const resolveDate = (value: any) => {
    if (!value) {
      return new Date(0);
    }
    if (typeof value?.toDate === "function") {
      return value.toDate();
    }
    return new Date(value);
  };

  const formatDateLabel = (value: Date) => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfValueDay = new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
    );
    const diffMs = startOfToday.getTime() - startOfValueDay.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (diffMs === 0) {
      return "Today";
    }

    if (diffMs === oneDay) {
      return "Yesterday";
    }

    return value.toLocaleDateString();
  };

  const groupedPayments = useMemo(() => {
    const sortedPayments = [...payments].sort((a, b) => {
      const dateA = resolveDate(a.dateUpdated || a.dateCreated).getTime();
      const dateB = resolveDate(b.dateUpdated || b.dateCreated).getTime();
      return dateB - dateA;
    });

    const groups: { label: string; key: string; items: DibbyTripPayment[] }[] =
      [];
    sortedPayments.forEach((payment) => {
      const paymentDate = resolveDate(
        payment.dateUpdated || payment.dateCreated,
      );
      const key = paymentDate.toISOString().slice(0, 10);
      const label = formatDateLabel(paymentDate);
      const existingGroup = groups.find((group) => group.key === key);
      if (existingGroup) {
        existingGroup.items.push(payment);
        return;
      }
      groups.push({ key, label, items: [payment] });
    });

    return groups;
  }, [payments]);

  const filteredGroupedPayments = useMemo(() => {
    if (historyFilter === "all") {
      return groupedPayments;
    }

    return groupedPayments
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (payment) => payment.status === historyFilter,
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groupedPayments, historyFilter]);

  const paidCount = payments.filter(
    (payment) => payment.status === DibbyPaymentStatus.PAID,
  ).length;
  const partialCount = payments.filter(
    (payment) => payment.status === DibbyPaymentStatus.PARTIAL,
  ).length;

  const deleteRecordedPayment = async (payment: DibbyTripPayment) => {
    if (!dibbyUser) {
      return;
    }

    const executeDelete = async () => {
      setBusyPaymentId(payment.id);
      try {
        await deleteTripPayment(dibbyUser, payment);
      } catch (error: any) {
        Alert.alert(
          "Unable to delete payment",
          error?.message || "Try again later.",
        );
      } finally {
        setBusyPaymentId(null);
      }
    };

    if (Platform.OS === "web") {
      const confirmed =
        typeof window !== "undefined"
          ? window.confirm(
              "Delete payment? This will restore the trip balances from before this payment.",
            )
          : false;
      if (confirmed) {
        await executeDelete();
      }
      return;
    }

    Alert.alert(
      "Delete payment?",
      "This will restore the trip balances from before this payment.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: executeDelete,
        },
      ],
    );
  };

  const markPaymentAsPaid = async (transaction: any, index: number) => {
    if (!dibbyUser || !currentTrip) {
      return;
    }

    const actionId = `${transaction.owee.uid}_${transaction.owed.uid}_${index}`;
    setBusyPaymentId(actionId);
    try {
      await createTripPayment(dibbyUser, currentTrip, {
        fromUid: transaction.owee.uid,
        toUid: transaction.owed.uid,
        amount: transaction.amount,
        amountPaid: transaction.amount,
        note: null,
      });
      Alert.alert("Saved", "Payment marked as paid.");
    } catch (error: any) {
      Alert.alert(
        "Unable to save payment",
        error?.message || "Try again later.",
      );
    } finally {
      setBusyPaymentId(null);
    }
  };

  return (
    <View style={styles.topContainer}>
      <SafeAreaView style={styles.topContainer}>
        <TopBar
          title="Payments"
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
            <DibbyButton
              type="clear"
              onPress={() =>
                navigation.navigate("AddPayment", { tripName, tripId })
              }
              title={
                <FontAwesomeIcon
                  icon={faPlus}
                  size={22}
                  color={colors.textPrimary}
                />
              }
            />
          }
        />

        <ScreenState
          status={screenStatus}
          title="Payments unavailable"
          description="We couldn’t load this trip yet."
          actionLabel="Back to trip"
          onAction={() => navigation.navigate("ViewTrip", { tripName, tripId })}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <NeumoSurface
                variant="raised"
                tone="surface"
                radius={NeumoTokens.radius.lg}
                style={styles.hero}
              >
                <Text style={styles.heroTitle}>{tripTitle}</Text>
                <Text style={styles.heroSubtitle}>
                  {openBalances > 0
                    ? `${openBalances} open balances`
                    : "All balances settled"}
                </Text>
                {currentTrip && (
                  <StatsSection
                    compactItems={tripCompactStats}
                    fullItems={tripStats}
                    compactColumns={2}
                    expandedColumns={statsColumns}
                  />
                )}
              </NeumoSurface>

              <NeumoSurface
                variant="raised"
                tone="surface"
                radius={NeumoTokens.radius.lg}
                style={styles.sectionCard}
              >
                <Text style={styles.sectionTitle}>Suggested payments</Text>
                {suggestedPayments.length === 0 ? (
                  <Text style={styles.emptyText}>
                    No payments suggested right now.
                  </Text>
                ) : (
                  suggestedPayments.map((transaction: any, index: number) => (
                    <NeumoSurface
                      key={`${transaction.owee.uid}-${transaction.owed.uid}-${index}`}
                      variant="flat"
                      tone="surface"
                      radius={NeumoTokens.radius.md}
                      style={styles.paymentRow}
                    >
                      <View style={styles.paymentRowTop}>
                        <View style={styles.paymentCopy}>
                          <Text style={styles.paymentName}>
                            {transaction.owee.name} → {transaction.owed.name}
                          </Text>
                          <Text style={styles.paymentMeta}>
                            Suggested $
                            {numberWithCommas(transaction.amount.toString())}
                          </Text>
                        </View>
                        <NeumoSurface
                          variant="flat"
                          tone="surface"
                          radius={NeumoTokens.radius.pill}
                          padding={NeumoTokens.control.pill.padding}
                        >
                          <Text style={styles.paymentAmount}>
                            ${numberWithCommas(transaction.amount.toString())}
                          </Text>
                        </NeumoSurface>
                      </View>
                      <View style={styles.paymentActions}>
                        <DibbyButton
                          title="Mark paid"
                          size="sm"
                          disabled={Boolean(
                            busyPaymentId || transaction.amount <= 0,
                          )}
                          onPress={() => markPaymentAsPaid(transaction, index)}
                        />
                        <DibbyButton
                          title="Partial"
                          type="outline"
                          size="sm"
                          disabled={Boolean(busyPaymentId)}
                          onPress={() => openPaymentModal(transaction)}
                        />
                      </View>
                    </NeumoSurface>
                  ))
                )}
              </NeumoSurface>

              {groupedPayments.length > 0 && (
                <NeumoSurface
                  variant="raised"
                  tone="surface"
                  radius={NeumoTokens.radius.lg}
                  style={styles.sectionCard}
                >
                  <Text style={styles.sectionTitle}>Recorded payments</Text>
                  <View style={styles.filterRow}>
                    <NeumoPressable
                      variant={historyFilter === "all" ? "inset" : "raised"}
                      tone="surface"
                      radius={NeumoTokens.radius.pill}
                      padding={NeumoTokens.control.pill.padding}
                      onPress={() => setHistoryFilter("all")}
                      style={styles.filterChip}
                    >
                      <Text
                        style={
                          historyFilter === "all"
                            ? styles.filterChipTextActive
                            : styles.filterChipText
                        }
                      >
                        {`All (${payments.length})`}
                      </Text>
                    </NeumoPressable>
                    <NeumoPressable
                      variant={
                        historyFilter === DibbyPaymentStatus.PAID
                          ? "inset"
                          : "raised"
                      }
                      tone="surface"
                      radius={NeumoTokens.radius.pill}
                      padding={NeumoTokens.control.pill.padding}
                      onPress={() => setHistoryFilter(DibbyPaymentStatus.PAID)}
                      style={styles.filterChip}
                    >
                      <Text
                        style={
                          historyFilter === DibbyPaymentStatus.PAID
                            ? styles.filterChipTextActive
                            : styles.filterChipText
                        }
                      >
                        {`Paid (${paidCount})`}
                      </Text>
                    </NeumoPressable>
                    <NeumoPressable
                      variant={
                        historyFilter === DibbyPaymentStatus.PARTIAL
                          ? "inset"
                          : "raised"
                      }
                      tone="surface"
                      radius={NeumoTokens.radius.pill}
                      padding={NeumoTokens.control.pill.padding}
                      onPress={() =>
                        setHistoryFilter(DibbyPaymentStatus.PARTIAL)
                      }
                      style={styles.filterChip}
                    >
                      <Text
                        style={
                          historyFilter === DibbyPaymentStatus.PARTIAL
                            ? styles.filterChipTextActive
                            : styles.filterChipText
                        }
                      >
                        {`Partial (${partialCount})`}
                      </Text>
                    </NeumoPressable>
                  </View>
                  {filteredGroupedPayments.length === 0 ? (
                    <Text style={styles.emptyText}>
                      No payments match this filter.
                    </Text>
                  ) : (
                    filteredGroupedPayments.map((group) => (
                      <View key={group.key} style={styles.paymentGroup}>
                        <Text style={styles.paymentGroupTitle}>
                          {group.label}
                        </Text>
                        {group.items.map((payment) => {
                          const timestamp = resolveDate(
                            payment.dateUpdated || payment.dateCreated,
                          );
                          return (
                            <View key={payment.id} style={styles.recordedRow}>
                              <View style={styles.paymentCopy}>
                                <Text style={styles.paymentName}>
                                  {payment.fromName ||
                                    getTravelerFromId(
                                      currentTrip,
                                      payment.fromUid,
                                    )?.name ||
                                    payment.fromUsername ||
                                    payment.fromUid}
                                  {" → "}
                                  {payment.toName ||
                                    getTravelerFromId(
                                      currentTrip,
                                      payment.toUid,
                                    )?.name ||
                                    payment.toUsername ||
                                    payment.toUid}
                                </Text>
                                <Text style={styles.paymentMeta}>
                                  {payment.status === DibbyPaymentStatus.PAID
                                    ? "Paid in full"
                                    : `Partial $${numberWithCommas(payment.amountPaid.toString())} of $${numberWithCommas(payment.amount.toString())}`}
                                  {` • ${timestamp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                                </Text>
                              </View>
                              <View style={styles.recordedActions}>
                                <View style={styles.recordedTopMeta}>
                                  <Text style={styles.paymentAmount}>
                                    $
                                    {numberWithCommas(
                                      payment.amountPaid.toString(),
                                    )}
                                  </Text>
                                  <NeumoSurface
                                    variant="flat"
                                    tone="surface"
                                    radius={NeumoTokens.radius.pill}
                                    padding={NeumoTokens.control.pill.padding}
                                    style={
                                      payment.status === DibbyPaymentStatus.PAID
                                        ? styles.paidChip
                                        : styles.partialChip
                                    }
                                  >
                                    <Text
                                      style={
                                        payment.status ===
                                        DibbyPaymentStatus.PAID
                                          ? styles.paidChipText
                                          : styles.partialChipText
                                      }
                                    >
                                      {payment.status ===
                                      DibbyPaymentStatus.PAID
                                        ? "Paid"
                                        : "Partial"}
                                    </Text>
                                  </NeumoSurface>
                                </View>
                                <View style={styles.recordedActionButtons}>
                                  <DibbyButton
                                    title="Edit"
                                    type="outline"
                                    size="sm"
                                    disabled={Boolean(busyPaymentId)}
                                    onPress={() =>
                                      openEditPaymentModal(payment)
                                    }
                                  />
                                  <DibbyButton
                                    title="Delete"
                                    type="danger"
                                    size="sm"
                                    disabled={Boolean(busyPaymentId)}
                                    onPress={() =>
                                      deleteRecordedPayment(payment)
                                    }
                                  />
                                </View>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ))
                  )}
                </NeumoSurface>
              )}
            </View>
          </ScrollView>
        </ScreenState>

        <Modal
          transparent
          visible={createModalVisible}
          animationType="fade"
          onRequestClose={() => setCreateModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <NeumoSurface
              variant="raised"
              tone="surface"
              radius={NeumoTokens.radius.lg}
              style={styles.modalCard}
            >
              <Text style={styles.modalTitle}>
                {selectedPayment ? "Edit payment" : "Partial payment"}
              </Text>
              <Text style={styles.modalText}>
                {selectedPayment
                  ? `Editing payment between ${selectedPayment.fromName || selectedPayment.fromUsername} and ${selectedPayment.toName || selectedPayment.toUsername}.`
                  : `${selectedTransaction?.owee?.name} is paying ${selectedTransaction?.owed?.name}.`}
              </Text>
              <DibbyInput
                placeholder="Amount paid"
                value={amountPaid}
                onChangeText={setAmountPaid}
                money
              />
              <DibbyInput
                placeholder="Note (optional)"
                value={note}
                onChangeText={setNote}
              />
              <View style={styles.modalActions}>
                <DibbyButton
                  title="Cancel"
                  type="clear"
                  onPress={() => {
                    setCreateModalVisible(false);
                    setSelectedTransaction(null);
                    setSelectedPayment(null);
                    setAmountPaid("");
                    setNote("");
                  }}
                />
                <DibbyButton title="Save" onPress={submitPayment} />
              </View>
            </NeumoSurface>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

export default Payments;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    scrollContent: {
      paddingBottom: FloatingTabBar.spacer,
    },
    content: {
      margin: 16,
      gap: 16,
    },
    hero: {
      gap: 12,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.lg,
      fontWeight: Typography.weight.bold as any,
    },
    heroSubtitle: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
    },
    sectionCard: {
      gap: 12,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
    },
    paymentRow: {
      gap: 10,
      marginTop: 10,
    },
    paymentRowTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 10,
    },
    paymentCopy: {
      flex: 1,
      gap: 2,
    },
    paymentName: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
    paymentMeta: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
    },
    paymentAmount: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
    paymentActions: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    filterRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: NeumoTokens.control.pill.paddingHorizontal,
    },
    filterChipText: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
      textTransform: "uppercase",
    },
    filterChipTextActive: {
      color: colors.textPrimary,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
      textTransform: "uppercase",
    },
    paymentGroup: {
      gap: 10,
    },
    paymentGroupTitle: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    recordedRow: {
      gap: 8,
      alignItems: "flex-start",
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    recordedActions: {
      width: "100%",
      gap: 8,
    },
    recordedTopMeta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    recordedActionButtons: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    paidChip: {
      backgroundColor: colors.success.background,
    },
    partialChip: {
      backgroundColor: colors.warning.background,
    },
    paidChipText: {
      color: colors.success.text,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
      textTransform: "uppercase",
    },
    partialChipText: {
      color: colors.warning.text,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
      textTransform: "uppercase",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    modalCard: {
      width: "100%",
      maxWidth: 440,
      gap: 12,
    },
    modalTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.lg,
      fontWeight: Typography.weight.bold as any,
    },
    modalText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
    },
  });
