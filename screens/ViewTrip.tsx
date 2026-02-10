import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../components/TopBar";
import { useNavigation } from "@react-navigation/core";
import { ThemeColors } from "../constants/Colors";
import { FlatList } from "react-native-gesture-handler";
import { useUser } from "../hooks/useUser";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import {
  DibbyExpense,
  DibbyParticipant,
  DibbyTrip,
} from "../constants/DibbyTypes";
import { db } from "../firebase";
import { DibbyCard } from "../components/DibbyCard";
import CreateExpense from "../components/CreateExpense";
import {
  formatTitleWithEmoji,
  inRange,
  numberWithCommas,
} from "../helpers/AppHelpers";
import {
  changeOpacity,
  resolveParticipantColor,
} from "../helpers/GenerateColor";
import { ITransactionResponse, calculateTrip } from "../helpers/DibbyLogic";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faCaretDown,
  faCaretUp,
  faChevronLeft,
  faMoneyBillWave,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import { generateHTML } from "../constants/PdfTemplate";
import { wideScreen, windowWidth } from "../constants/DeviceWidth";
import useAppTheme from "../hooks/useAppTheme";
import DibbyButton from "../components/DibbyButton";
import DibbyAvatars from "../components/DibbyAvatars";
import DibbyLoading from "../components/DibbyLoading";
import DibbySummary from "../components/DibbySummary";
import {
  addDibbyParticipant,
  deleteDibbyExpense,
} from "../helpers/FirebaseHelpers";
import NeumoSurface from "../components/NeumoSurface";
import NeumoPressable from "../components/NeumoPressable";
import { FloatingTabBar, NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import { DibbySearchUsername } from "../components/DibbySearchUsername";
import SortFilterBar, { SortFilterOption } from "../components/SortFilterBar";
import StatsSection from "../components/StatsSection";
import { buildTripStats, pickStats } from "../helpers/StatsHelpers";
import ScreenState, { ScreenStateStatus } from "../components/ScreenState";
import { track } from "../helpers/track";

const cardWidth = 500;
const numColumns = Math.floor(windowWidth / cardWidth);

const ViewTrip = ({ route }: any) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation: any = useNavigation();
  const { tripName, tripId, openAddExpense } = route.params || {};
  const shouldOpenAddExpense = (() => {
    if (openAddExpense === true || openAddExpense === "true") {
      return true;
    }
    if (
      openAddExpense === false ||
      openAddExpense === "false" ||
      openAddExpense == null
    ) {
      return false;
    }
    const numeric = Number(openAddExpense);
    return Number.isFinite(numeric) && numeric > 0;
  })();
  const { dibbyUser } = useUser();
  const [currentTrip, setCurrentTrip] = useState<DibbyTrip>();
  const [calculatedTrip, setCalculatedTrip] = useState<ITransactionResponse>();
  const [summaryOpen, setSummaryOpen] = useState<boolean>(false);
  const [isCreateExpenseModalVisible, setIsCreateExpenseModalVisible] =
    useState(false);
  const [segment, setSegment] = useState<"expenses" | "travelers">("expenses");
  const [expenseFilter, setExpenseFilter] = useState<"all" | "paidByMe">("all");
  const [expenseSort, setExpenseSort] = useState<
    "recent" | "oldest" | "amount" | "name"
  >("recent");
  const [selectedResults, setSelectedResults] = useState<DibbyParticipant[]>(
    [],
  );

  const [loadingIndicator, setLoadingIndicator] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const tripTitle = useMemo(
    () =>
      formatTitleWithEmoji(currentTrip?.title || tripName, currentTrip?.emoji),
    [currentTrip?.title, currentTrip?.emoji, tripName],
  );
  const tripStats = useMemo(
    () => (currentTrip ? buildTripStats(currentTrip, dibbyUser?.uid) : []),
    [currentTrip, dibbyUser?.uid],
  );
  const hasOpenBalances = useMemo(
    () =>
      currentTrip?.participants?.some((t) => !inRange(t.owed, -0.01, 0.01)) ||
      false,
    [currentTrip],
  );
  const tripCompactStats = useMemo(
    () =>
      pickStats(tripStats, [
        "trip-total",
        "trip-user-spent",
        // "trip-avg-expense",
        // "trip-expenses",
      ]),
    [tripStats],
  );
  const statsColumns = wideScreen ? 3 : 2;
  const tripScreenStatus: ScreenStateStatus = useMemo(() => {
    if (loadingIndicator && !currentTrip) {
      return "loading";
    }
    if (!currentTrip) {
      return "empty";
    }
    return "ready";
  }, [loadingIndicator, currentTrip]);

  const fetchTrip = useCallback(async () => {
    const docRef = doc(db, "trips", tripId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setCurrentTrip(docSnap.data() as DibbyTrip);
    } else {
      console.log("No such document!");
    }
  }, [tripId]);

  const onRefresh = useCallback(async () => {
    if (dibbyUser?.uid) {
      setRefreshing(true);
      await fetchTrip();
      setRefreshing(false);
    }
  }, [dibbyUser]);

  useEffect(() => {
    setLoadingIndicator(true);
    const unsub = onSnapshot(doc(db, "trips", tripId), (trip) => {
      setCurrentTrip(trip.data() as DibbyTrip);
      setLoadingIndicator(false);
    });

    return () => {
      unsub();
    };
  }, [tripId]);

  useEffect(() => {
    if (shouldOpenAddExpense) {
      setIsCreateExpenseModalVisible(true);
      navigation.setParams({ openAddExpense: false });
    }
  }, [openAddExpense]);

  useEffect(() => {
    if (dibbyUser?.uid && currentTrip) {
      const copyOfTrip = JSON.parse(JSON.stringify(currentTrip));
      const newCalculatedTrip = calculateTrip(copyOfTrip);
      setCalculatedTrip(newCalculatedTrip);
    }
  }, [dibbyUser, currentTrip]);

  const expenses = useMemo(() => {
    if (!currentTrip) {
      return [];
    }
    return [...currentTrip.expenses];
  }, [currentTrip]);

  const expenseFilterOptions: SortFilterOption[] = [
    { label: "All", value: "all" },
    { label: "Paid by me", value: "paidByMe" },
  ];
  const expenseSortOptions: SortFilterOption[] = [
    { label: "Newest", value: "recent" },
    { label: "Oldest", value: "oldest" },
    { label: "Amount", value: "amount" },
    { label: "Name", value: "name" },
  ];

  const visibleExpenses = useMemo(() => {
    const resolveExpenseDate = (expense: DibbyExpense) => {
      const dateValue: any = expense.dateCreated;
      if (!dateValue) {
        return 0;
      }
      if (typeof dateValue.toDate === "function") {
        return dateValue.toDate().getTime();
      }
      return new Date(dateValue).getTime();
    };

    const filtered = expenses.filter((expense) => {
      if (expenseFilter === "paidByMe") {
        return dibbyUser?.uid ? expense.paidBy === dibbyUser.uid : false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (expenseSort) {
        case "oldest":
          return resolveExpenseDate(a) - resolveExpenseDate(b);
        case "amount":
          return (b.amount || 0) - (a.amount || 0);
        case "name":
          return (a.title || "").localeCompare(b.title || "");
        case "recent":
        default:
          return resolveExpenseDate(b) - resolveExpenseDate(a);
      }
    });
  }, [expenses, expenseFilter, expenseSort, dibbyUser?.uid]);

  const deleteExpense = useCallback(
    async (expense: DibbyExpense) => {
      if (currentTrip) {
        await deleteDibbyExpense(expense, currentTrip);
      }
    },
    [currentTrip],
  );

  const addTravelers = async () => {
    if (currentTrip && selectedResults.length > 0) {
      await addDibbyParticipant(selectedResults, currentTrip);
      track("traveler_add", {
        tripId: currentTrip.id,
        count: selectedResults.length,
      });
      setSelectedResults([]);
    }
  };

  const deleteAlert = useCallback(
    (item: DibbyExpense) =>
      Alert.alert(
        `Are you sure you want to delete ${item.title}?`,
        "This will be permanently deleted.",
        [
          {
            text: "Cancel",
            onPress: () => console.log("Cancel Pressed"),
            style: "cancel",
          },
          { text: "OK", onPress: () => deleteExpense(item) },
        ],
      ),
    [deleteExpense],
  );

  const renderExpenseItem = useCallback(
    ({ item }: { item: DibbyExpense }) => (
      <DibbyCard
        expense={item}
        trip={currentTrip}
        onDeleteItem={() => deleteAlert(item)}
        cardWidth={cardWidth}
        wideScreen={wideScreen}
        onPress={() =>
          navigation.navigate("ViewExpense", {
            tripName,
            tripId,
            expenseId: item.id,
          })
        }
      />
    ),
    [currentTrip, deleteAlert, navigation, tripId, tripName, wideScreen],
  );

  const toggleCreateExpenseModal = () => {
    setIsCreateExpenseModalVisible(!isCreateExpenseModalVisible);
  };

  const printToFile = async () => {
    if (!calculatedTrip || !currentTrip) {
      Alert.alert(
        "Preparing summary",
        "Trip summary is still loading. Try again in a moment.",
      );
      return;
    }
    setLoadingIndicator(true);
    const exportHtml = generateHTML(calculatedTrip, currentTrip);
    try {
      const res = await Print.printToFileAsync({ html: exportHtml });
      setLoadingIndicator(false);
      if (res) {
        await shareAsync(res.uri, {
          UTI: ".pdf",
          mimeType: "application/pdf",
        });
      }
    } catch (err) {
      setLoadingIndicator(false);
      console.log(err);
    }
  };

  const handleShare = () => {
    if (Platform.OS === "web") {
      navigation.navigate("PrintPDF", { tripId });
      return;
    }
    printToFile();
  };

  const renderTripHeader = () => (
    <View style={styles.headerStack}>
      <NeumoSurface
        variant="raised"
        tone="surface"
        radius={NeumoTokens.radius.lg}
        style={styles.headerCard}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.tripTitle}>{tripTitle}</Text>
            <Text style={styles.tripMeta}>
              ${numberWithCommas(currentTrip?.amount.toString() || "0")} •{" "}
              {currentTrip?.participants.length || 0} travelers
            </Text>
          </View>
          {currentTrip?.participants && (
            <DibbyAvatars travelers={currentTrip?.participants} />
          )}
        </View>
      </NeumoSurface>

      <NeumoSurface
        variant="raised"
        tone="surface"
        radius={NeumoTokens.radius.lg}
        style={styles.quickSummary}
      >
        <StatsSection
          title="Trip stats"
          compactItems={tripCompactStats}
          fullItems={tripStats}
          compactColumns={2}
          expandedColumns={statsColumns}
        />
      </NeumoSurface>

      <NeumoPressable
        variant={hasOpenBalances ? "raised" : "flat"}
        tone="surface"
        radius={NeumoTokens.radius.pill}
        padding={NeumoTokens.control.pill.padding}
        onPress={() => hasOpenBalances && setSummaryOpen(true)}
        style={styles.settleButton}
        containerStyle={styles.settleButtonContainer}
      >
        <View style={styles.settleButtonContent}>
          <FontAwesomeIcon
            icon={faMoneyBillWave}
            size={14}
            color={hasOpenBalances ? colors.accent : colors.textSecondary}
          />
          <Text
            style={[
              styles.settleButtonText,
              !hasOpenBalances && styles.settleButtonTextMuted,
            ]}
          >
            {hasOpenBalances ? "Settle up" : "All settled"}
          </Text>
        </View>
      </NeumoPressable>

      <NeumoPressable
        variant="flat"
        tone="base"
        onPress={() => setSummaryOpen(!summaryOpen)}
        style={styles.summaryToggle}
      >
        <View style={styles.summaryToggleContent}>
          <Text style={styles.sectionTitle}>
            {summaryOpen ? "Hide details" : "Details"}
          </Text>
          <FontAwesomeIcon
            icon={summaryOpen ? faCaretUp : faCaretDown}
            size={16}
            color={colors.textSecondary}
          />
        </View>
      </NeumoPressable>

      {calculatedTrip && summaryOpen && currentTrip && (
        <DibbySummary
          currentTrip={currentTrip}
          calculatedTrip={calculatedTrip}
        />
      )}

      <NeumoSurface
        variant="inset"
        tone="surface"
        radius={NeumoTokens.radius.pill}
        style={styles.segmentContainer}
        padding={NeumoTokens.control.pill.padding}
      >
        <View style={styles.segmentRow}>
          <NeumoPressable
            variant={segment === "expenses" ? "raised" : "flat"}
            tone="surface"
            onPress={() => setSegment("expenses")}
            radius={NeumoTokens.radius.pill}
            padding={NeumoTokens.control.pill.padding}
            containerStyle={styles.segmentButton}
            style={styles.segmentButtonSurface}
          >
            <Text
              style={[
                styles.segmentText,
                segment === "expenses" && styles.segmentTextActive,
              ]}
            >
              Expenses
            </Text>
          </NeumoPressable>
          <NeumoPressable
            variant={segment === "travelers" ? "raised" : "flat"}
            tone="surface"
            onPress={() => setSegment("travelers")}
            radius={NeumoTokens.radius.pill}
            padding={NeumoTokens.control.pill.padding}
            containerStyle={styles.segmentButton}
            style={styles.segmentButtonSurface}
          >
            <Text
              style={[
                styles.segmentText,
                segment === "travelers" && styles.segmentTextActive,
              ]}
            >
              Travelers
            </Text>
          </NeumoPressable>
        </View>
      </NeumoSurface>
      {segment === "expenses" && (
        <SortFilterBar
          filterOptions={expenseFilterOptions}
          sortOptions={expenseSortOptions}
          selectedFilter={expenseFilter}
          selectedSort={expenseSort}
          onFilterChange={(value) =>
            setExpenseFilter(value as "all" | "paidByMe")
          }
          onSortChange={(value) =>
            setExpenseSort(value as "recent" | "oldest" | "amount" | "name")
          }
        />
      )}
    </View>
  );

  return (
    <View style={styles.topContainer}>
      <SafeAreaView style={styles.topContainer}>
        <TopBar
          title={tripTitle}
          leftButton={
            <DibbyButton
              type="clear"
              onPress={() => navigation.navigate("Home")}
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
              onPress={handleShare}
              type="clear"
              title={
                <FontAwesomeIcon
                  icon={faShareNodes}
                  size={24}
                  color={colors.textPrimary}
                />
              }
            />
          }
        />

        <View style={styles.content}>
          <ScreenState
            status={tripScreenStatus}
            title="Trip not found"
            description="We couldn’t load this trip yet."
            actionLabel="Back to trips"
            onAction={() => navigation.navigate("Home")}
          >
            {segment === "expenses" ? (
              <FlatList
                removeClippedSubviews={false}
                data={visibleExpenses}
                key={numColumns}
                numColumns={numColumns}
                keyExtractor={(expense) => expense.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderTripHeader}
                ListEmptyComponent={
                  loadingIndicator ? (
                    <DibbyLoading />
                  ) : (
                    <NeumoSurface
                      variant="inset"
                      tone="surface"
                      radius={NeumoTokens.radius.lg}
                      style={styles.emptyState}
                    >
                      <Text style={styles.emptyText}>
                        {expenses.length > 0
                          ? "No expenses match this filter."
                          : "No expenses yet. Tap + to add the first one."}
                      </Text>
                      {expenses.length > 0 && (
                        <DibbyButton
                          title="Clear filters"
                          onPress={() => {
                            setExpenseFilter("all");
                            setExpenseSort("recent");
                          }}
                          fullWidth
                        />
                      )}
                    </NeumoSurface>
                  )
                }
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
                style={styles.list}
                initialNumToRender={6}
                maxToRenderPerBatch={8}
                windowSize={7}
                updateCellsBatchingPeriod={50}
                renderItem={renderExpenseItem}
              />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                style={styles.list}
              >
                {renderTripHeader()}
                <View style={styles.travelersContainer}>
                  <NeumoSurface
                    variant="raised"
                    tone="surface"
                    radius={NeumoTokens.radius.lg}
                    style={styles.travelersCard}
                  >
                    <Text style={styles.sectionTitle}>Participants</Text>
                    <View style={styles.travelersList}>
                      {currentTrip?.participants.map((t) => {
                        const participantColor = resolveParticipantColor(
                          t.color,
                          t.uid || t.username || t.name || "",
                        );
                        return (
                          <NeumoSurface
                            key={t.uid}
                            variant="flat"
                            tone="surface"
                            radius={NeumoTokens.radius.pill}
                            style={[
                              styles.travelerPill,
                              {
                                backgroundColor: changeOpacity(
                                  participantColor,
                                  0.25,
                                ),
                                borderColor: changeOpacity(
                                  participantColor,
                                  0.5,
                                ),
                              },
                            ]}
                            padding={NeumoTokens.control.pill.padding}
                          >
                            <Text style={styles.travelerText}>{t.name}</Text>
                          </NeumoSurface>
                        );
                      })}
                    </View>
                  </NeumoSurface>

                  <NeumoSurface
                    variant="inset"
                    tone="surface"
                    radius={NeumoTokens.radius.lg}
                    style={styles.travelersCard}
                  >
                    <Text style={styles.sectionTitle}>Add travelers</Text>
                    <DibbySearchUsername
                      results={(res) => setSelectedResults(res)}
                      currentTrip={currentTrip}
                    />
                    <DibbyButton
                      disabled={selectedResults.length < 1}
                      title={`Add to ${tripTitle}`}
                      onPress={addTravelers}
                      fullWidth
                    />
                  </NeumoSurface>
                </View>
              </ScrollView>
            )}
          </ScreenState>

          <Modal
            animationType="slide"
            visible={isCreateExpenseModalVisible}
            onRequestClose={toggleCreateExpenseModal}
          >
            {dibbyUser && (
              <CreateExpense
                currentUser={dibbyUser}
                onPressBack={toggleCreateExpenseModal}
                tripInfo={currentTrip}
              />
            )}
          </Modal>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default ViewTrip;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    headerStack: {
      gap: NeumoTokens.spacing.sm,
    },
    headerCard: {
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    tripTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.lg,
      fontWeight: Typography.weight.bold as any,
    },
    tripMeta: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      marginTop: 4,
    },
    listContent: {
      paddingBottom: FloatingTabBar.spacer,
      paddingHorizontal: NeumoTokens.spacing.xs,
      paddingTop: NeumoTokens.spacing.xs,
      overflow: "visible",
    },
    list: {
      overflow: "visible",
    },
    scrollContent: {
      paddingBottom: NeumoTokens.spacing.xxl,
    },
    sectionTitle: {
      fontSize: Typography.size.md,
      color: colors.textPrimary,
      fontWeight: Typography.weight.semibold as any,
    },
    summaryToggle: {
      marginBottom: 8,
    },
    summaryToggleContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    segmentContainer: {
      marginBottom: 16,
    },
    quickSummary: {
      marginVertical: 12,
      gap: 8,
    },
    segmentRow: {
      flexDirection: "row",
      gap: 0,
    },
    segmentButton: {
      flex: 1,
      paddingHorizontal: 2,
    },
    segmentButtonSurface: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: NeumoTokens.control.pill.minHeight,
    },
    segmentText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      textAlign: "center",
    },
    segmentTextActive: {
      color: colors.textPrimary,
      fontWeight: Typography.weight.semibold as any,
    },
    settleButtonContainer: {
      alignItems: "flex-start",
    },
    settleButton: {
      alignSelf: "flex-start",
    },
    settleButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    settleButtonText: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
    settleButtonTextMuted: {
      color: colors.textSecondary,
    },
    emptyState: {
      marginVertical: 12,
    },
    emptyText: {
      color: colors.textSecondary,
      textAlign: "center",
      fontSize: Typography.size.sm,
    },
    travelersContainer: {
      gap: 16,
      marginBottom: 24,
    },
    travelersCard: {
      gap: 12,
    },
    travelersList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    travelerPill: {
      borderWidth: 1,
    },
    travelerText: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
    },
  });
