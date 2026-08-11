import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import RNPickerSelect from "react-native-picker-select";

import TopBar from "../components/TopBar";
import DibbyButton from "../components/DibbyButton";
import DibbyInput from "../components/DibbyInput";
import NeumoSurface from "../components/NeumoSurface";
import { ThemeColors } from "../constants/Colors";
import { db } from "../firebase";
import useAppTheme from "../hooks/useAppTheme";
import { DibbyTrip } from "../constants/DibbyTypes";
import { FloatingTabBar, NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import { useUser } from "../hooks/useUser";
import { createTripPayment } from "../helpers/FirebaseHelpers";
import { formatTitleWithEmoji } from "../helpers/AppHelpers";
import { calculateTrip } from "../helpers/DibbyLogic";

const AddPayment = ({ route }: any) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation: any = useNavigation();
  const { tripName, tripId } = route.params || {};
  const { dibbyUser } = useUser();

  const [currentTrip, setCurrentTrip] = useState<DibbyTrip>();
  const [customFromUid, setCustomFromUid] = useState<string | null>(null);
  const [customToUid, setCustomToUid] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tripId) {
      return () => undefined;
    }

    const unsub = onSnapshot(doc(db, "trips", tripId), (snap) => {
      if (snap.exists()) {
        setCurrentTrip(snap.data() as DibbyTrip);
      }
    });
    return () => unsub();
  }, [tripId]);

  useEffect(() => {
    if (!currentTrip || currentTrip.participants.length < 2) {
      return;
    }

    const participantUids = currentTrip.participants.map(
      (participant) => participant.uid,
    );
    const defaultFromUid = participantUids.includes(dibbyUser?.uid || "")
      ? dibbyUser?.uid || participantUids[0]
      : participantUids[0];
    const defaultToUid =
      participantUids.find((uid) => uid !== defaultFromUid) ||
      participantUids[1];

    setCustomFromUid((prev) => prev || defaultFromUid);
    setCustomToUid((prev) => prev || defaultToUid);
  }, [currentTrip, dibbyUser?.uid]);

  const participantOptions = useMemo(() => {
    if (!currentTrip) {
      return [];
    }

    return currentTrip.participants.map((participant) => ({
      label: participant.name || participant.username || participant.uid,
      value: participant.uid,
    }));
  }, [currentTrip]);

  const renderWebParticipantSelector = (
    selectedUid: string | null,
    onChange: (uid: string) => void,
  ) => (
    <View style={styles.webSelectorWrap}>
      {participantOptions.map((option) => {
        const selected = selectedUid === option.value;
        return (
          <DibbyButton
            key={option.value}
            title={option.label}
            type={selected ? "solid" : "outline"}
            size="sm"
            onPress={() => onChange(option.value)}
          />
        );
      })}
    </View>
  );

  const tripTitle = useMemo(
    () =>
      formatTitleWithEmoji(currentTrip?.title || tripName, currentTrip?.emoji),
    [currentTrip?.title, currentTrip?.emoji, tripName],
  );

  const calculatedTrip = useMemo(() => {
    if (!currentTrip) {
      return undefined;
    }
    return calculateTrip(JSON.parse(JSON.stringify(currentTrip)));
  }, [currentTrip]);

  const suggestedAmountForSelection = useMemo(() => {
    if (!calculatedTrip || !customFromUid || !customToUid) {
      return 0;
    }
    const transaction = calculatedTrip.transactions.find(
      (item) =>
        item.owee.uid === customFromUid && item.owed.uid === customToUid,
    );
    return Number(transaction?.amount || 0);
  }, [calculatedTrip, customFromUid, customToUid]);

  useEffect(() => {
    if (suggestedAmountForSelection > 0) {
      setCustomAmount(String(suggestedAmountForSelection));
    }
  }, [suggestedAmountForSelection]);

  const notify = (title: string, message: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const parseMoneyValue = (value: string): number => {
    const normalized = (value || "").replace(/[^0-9.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const onSavePayment = async () => {
    if (!dibbyUser || !currentTrip) {
      return;
    }

    if (currentTrip.participants.length < 2) {
      notify(
        "Unable to add payment",
        "This trip needs at least two travelers.",
      );
      return;
    }

    if (!customFromUid || !customToUid) {
      notify(
        "Select travelers",
        "Choose who paid and who received this payment.",
      );
      return;
    }

    if (customFromUid === customToUid) {
      notify(
        "Invalid travelers",
        "Payer and recipient must be different travelers.",
      );
      return;
    }

    const paid = parseMoneyValue(amountPaid);
    const parsedTotal = parseMoneyValue(customAmount);
    const amount = parsedTotal > 0 ? parsedTotal : paid;

    const isTripOwner = currentTrip.createdBy === dibbyUser.uid;
    const isDebtor = customFromUid === dibbyUser.uid;
    if (!isTripOwner && !isDebtor) {
      notify(
        "You can’t record this payment",
        "Only the trip owner or the traveler who owes can save this payment. Select yourself as 'Paid by', or ask the owner to record it.",
      );
      return;
    }

    if (amount <= 0) {
      notify(
        "Enter a total amount",
        "Enter amount paid, or set the total settlement amount when this is a partial payment against a larger obligation.",
      );
      return;
    }

    if (paid <= 0) {
      notify(
        "Enter a payment amount",
        "Payment amount must be greater than zero.",
      );
      return;
    }

    if (paid > amount) {
      notify(
        "Invalid amount",
        "Amount paid cannot be greater than total amount.",
      );
      return;
    }

    setSaving(true);
    try {
      await createTripPayment(dibbyUser, currentTrip, {
        fromUid: customFromUid,
        toUid: customToUid,
        amount,
        amountPaid: paid,
        note: note || null,
      });
      notify("Saved", "Custom payment added.");
      navigation.goBack();
    } catch (error: any) {
      notify("Unable to save payment", error?.message || "Try again later.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.topContainer}>
      <SafeAreaView style={styles.topContainer}>
        <TopBar
          title="Add Payment"
          leftButton={
            <DibbyButton
              type="clear"
              onPress={() => navigation.goBack()}
              title={
                <FontAwesomeIcon
                  icon={faChevronLeft}
                  size={24}
                  color={colors.textPrimary}
                />
              }
            />
          }
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <NeumoSurface
              variant="raised"
              tone="surface"
              radius={NeumoTokens.radius.lg}
              style={styles.heroCard}
            >
              <Text style={styles.tripTitle}>{tripTitle}</Text>
              <Text style={styles.subtitle}>
                Record a custom payment between any two travelers.
              </Text>
            </NeumoSurface>

            <NeumoSurface
              variant="raised"
              tone="surface"
              radius={NeumoTokens.radius.lg}
              style={styles.formCard}
            >
              <Text style={styles.inputLabel}>Paid by</Text>
              {Platform.OS === "web" ? (
                renderWebParticipantSelector(customFromUid, (uid) =>
                  setCustomFromUid(uid),
                )
              ) : (
                <NeumoSurface
                  variant="inset"
                  tone="surface"
                  radius={NeumoTokens.radius.md}
                  padding={NeumoTokens.spacing.xs}
                  style={styles.pickerInset}
                >
                  <RNPickerSelect
                    onValueChange={(value) => setCustomFromUid(value || null)}
                    value={customFromUid}
                    placeholder={{ label: "Select payer", value: null }}
                    items={participantOptions}
                    style={{
                      inputIOS: styles.pickerInput,
                      inputAndroid: styles.pickerInput,
                      inputIOSContainer: styles.pickerContainer,
                      inputAndroidContainer: styles.pickerContainer,
                      placeholder: styles.pickerPlaceholder,
                    }}
                  />
                </NeumoSurface>
              )}

              <Text style={styles.inputLabel}>Received by</Text>
              {Platform.OS === "web" ? (
                renderWebParticipantSelector(customToUid, (uid) =>
                  setCustomToUid(uid),
                )
              ) : (
                <NeumoSurface
                  variant="inset"
                  tone="surface"
                  radius={NeumoTokens.radius.md}
                  padding={NeumoTokens.spacing.xs}
                  style={styles.pickerInset}
                >
                  <RNPickerSelect
                    onValueChange={(value) => setCustomToUid(value || null)}
                    value={customToUid}
                    placeholder={{ label: "Select recipient", value: null }}
                    items={participantOptions}
                    style={{
                      inputIOS: styles.pickerInput,
                      inputAndroid: styles.pickerInput,
                      inputIOSContainer: styles.pickerContainer,
                      inputAndroidContainer: styles.pickerContainer,
                      placeholder: styles.pickerPlaceholder,
                    }}
                  />
                </NeumoSurface>
              )}

              <View style={styles.balanceSummary}>
                <Text style={styles.inputLabel}>Current balance owed</Text>
                <Text style={styles.balanceValue}>
                  ${customAmount ? Number(customAmount).toFixed(2) : "0.00"}
                </Text>
              </View>
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

              <View style={styles.actionRow}>
                <DibbyButton
                  title="Cancel"
                  type="clear"
                  onPress={() => navigation.goBack()}
                />
                <DibbyButton
                  title={saving ? "Saving..." : "Save payment"}
                  onPress={onSavePayment}
                  disabled={saving}
                />
              </View>
            </NeumoSurface>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default AddPayment;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    scrollContent: {
      paddingBottom: FloatingTabBar.inset,
    },
    content: {
      margin: 16,
      gap: 16,
    },
    heroCard: {
      gap: 8,
    },
    tripTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.lg,
      fontWeight: Typography.weight.bold as any,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
    },
    formCard: {
      gap: 10,
    },
    webSelectorWrap: {
      marginTop: 2,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    inputLabel: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
      marginTop: 2,
    },
    pickerInset: {
      marginTop: 2,
    },
    pickerContainer: {
      backgroundColor: colors.input.background,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    pickerInput: {
      color: colors.textPrimary,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    pickerPlaceholder: {
      color: colors.textSecondary,
    },
    actionRow: {
      marginTop: 4,
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
      flexWrap: "wrap",
    },
    balanceSummary: {
      gap: 4,
      paddingVertical: 4,
    },
    balanceValue: {
      color: colors.textPrimary,
      fontSize: Typography.size.lg,
      fontWeight: Typography.weight.bold as any,
    },
  });
