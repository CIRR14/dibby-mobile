import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
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
  DibbySubTrip,
  DibbyTrip,
} from "../constants/DibbyTypes";
import { db } from "../firebase";
import { DibbyCard } from "../components/DibbyCard";
import CreateExpense from "../components/CreateExpense";
import {
  formatTitleWithEmoji,
  numberWithCommas,
} from "../helpers/AppHelpers";
import {
  changeOpacity,
  resolveParticipantColor,
} from "../helpers/GenerateColor";
import { calculateTrip } from "../helpers/DibbyLogic";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faChevronLeft,
  faPlus,
  faSearch,
  faShareNodes,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import { generateHTML } from "../constants/PdfTemplate";
import useAppTheme from "../hooks/useAppTheme";
import DibbyButton from "../components/DibbyButton";
import DibbyAvatars from "../components/DibbyAvatars";
import DibbyLoading from "../components/DibbyLoading";
import DibbySummary from "../components/DibbySummary";
import {
  addDibbyParticipant,
  deleteDibbyExpense,
} from "../helpers/FirebaseHelpers";
import { FloatingTabBar, NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import { DibbySearchUsername } from "../components/DibbySearchUsername";
import SortFilterBar, { SortFilterOption } from "../components/SortFilterBar";
import ScreenState, { ScreenStateStatus } from "../components/ScreenState";
import { track } from "../helpers/track";
import ScreenLayout from "../components/ScreenLayout";
import useResponsiveLayout from "../hooks/useResponsiveLayout";
import ActionMenu, { ActionMenuItem } from "../components/ActionMenu";
import {
  ALL_SUB_TRIPS_ID,
  MAIN_SUB_TRIP_ID,
  computeLeaderboard,
  createSubTrip,
  subscribeSubTrips,
  subscribeTripExpenses,
} from "../helpers/TripRepository";
import TripLeaderboard from "../components/TripLeaderboard";
import { useDebounce } from "../hooks/useDebounce";
import DibbyInput from "../components/DibbyInput";
import EmojiSelector from "../components/EmojiSelector";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const cardWidth = 500;

const ViewTrip = ({ route }: any) => {
  const colors = useAppTheme();
  const responsive = useResponsiveLayout();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
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
  const [tripExpenses, setTripExpenses] = useState<DibbyExpense[]>([]);
  const [subTrips, setSubTrips] = useState<DibbySubTrip[]>([]);
  const [selectedSubTripId, setSelectedSubTripId] =
    useState<string>(ALL_SUB_TRIPS_ID);
  const [isSettleModalVisible, setIsSettleModalVisible] = useState(false);
  const [isCreateExpenseModalVisible, setIsCreateExpenseModalVisible] =
    useState(false);
  const [isCreateGroupModalVisible, setIsCreateGroupModalVisible] =
    useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [newGroupEmoji, setNewGroupEmoji] = useState<string | null>("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [segment, setSegment] = useState<"expenses" | "travelers">("expenses");
  const [expenseFilter, setExpenseFilter] = useState<"all" | "paidByMe">("all");
  const [expenseSort, setExpenseSort] = useState<
    "recent" | "oldest" | "amount" | "name"
  >("recent");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedResults, setSelectedResults] = useState<DibbyParticipant[]>(
    [],
  );
  const debouncedSearch = useDebounce(searchValue, 150);

  const [loadingIndicator, setLoadingIndicator] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isSettleSheetExpanded, setIsSettleSheetExpanded] = useState(false);
  const settleSheetTranslateY = useMemo(() => new Animated.Value(0), []);
  const expandedSheetHeight = useMemo(
    () => Math.max(420, windowHeight - insets.top - 12),
    [windowHeight, insets.top],
  );
  const collapsedSheetHeight = useMemo(
    () => Math.max(360, Math.round(windowHeight * 0.68)),
    [windowHeight],
  );
  const collapsedSheetOffset = useMemo(
    () => Math.max(0, expandedSheetHeight - collapsedSheetHeight),
    [expandedSheetHeight, collapsedSheetHeight],
  );
  const hydratedTrip = useMemo(
    () =>
      currentTrip
        ? {
            ...currentTrip,
            expenses: tripExpenses,
          }
        : undefined,
    [currentTrip, tripExpenses],
  );
  const scopedExpenses = useMemo(
    () =>
      selectedSubTripId === ALL_SUB_TRIPS_ID
        ? tripExpenses
        : tripExpenses.filter(
            (expense) =>
              (expense.subTripId || MAIN_SUB_TRIP_ID) === selectedSubTripId,
          ),
    [tripExpenses, selectedSubTripId],
  );
  const leaderboard = useMemo(
    () =>
      hydratedTrip
        ? computeLeaderboard(hydratedTrip, tripExpenses, selectedSubTripId)
        : { entries: [], nextPayment: undefined },
    [hydratedTrip, tripExpenses, selectedSubTripId],
  );
  const scopedTrip = useMemo(() => {
    if (!hydratedTrip) {
      return undefined;
    }

    const leaderboardRows = leaderboard.entries;
    const rowByUid = new Map(leaderboardRows.map((row) => [row.uid, row]));
    const participants = hydratedTrip.participants.map((participant) => {
      const row = rowByUid.get(participant.uid);
      return {
        ...participant,
        amountPaid: row?.paid || 0,
        owed: row?.netBalance || 0,
      };
    });
    const amount = scopedExpenses.reduce(
      (sum, expense) => sum + (expense.amount || 0),
      0,
    );
    const perPersonAverage =
      participants.length > 0 ? amount / participants.length : 0;
    return {
      ...hydratedTrip,
      participants,
      expenses: scopedExpenses,
      amount,
      perPersonAverage,
    };
  }, [hydratedTrip, scopedExpenses, leaderboard.entries]);
  const tripTitle = useMemo(
    () =>
      formatTitleWithEmoji(currentTrip?.title || tripName, currentTrip?.emoji),
    [currentTrip?.title, currentTrip?.emoji, tripName],
  );
  const selectedSubTripLabel = useMemo(() => {
    if (selectedSubTripId === ALL_SUB_TRIPS_ID) {
      return "All groups";
    }
    const group = subTrips.find((item) => item.id === selectedSubTripId);
    if (!group) {
      return "Main";
    }
    return formatTitleWithEmoji(group.title, group.emoji);
  }, [selectedSubTripId, subTrips]);
  const calculatedTrip = useMemo(
    () => (scopedTrip ? calculateTrip(scopedTrip) : undefined),
    [scopedTrip],
  );
  const hasOpenBalances = useMemo(
    () => leaderboard.entries.some((entry) => entry.amountToPay > 0),
    [leaderboard.entries],
  );
  const summaryNumbers = useMemo(() => {
    const openBalances = leaderboard.entries.filter(
      (entry) => entry.amountToPay > 0 || entry.amountToReceive > 0,
    ).length;
    return [
      {
        key: "total",
        label: "Total",
        value: `$${numberWithCommas(
          scopedTrip?.amount?.toFixed(2) || "0",
        )}`,
      },
      {
        key: "expenses",
        label: "Expenses",
        value: `${scopedExpenses.length}`,
      },
      {
        key: "balances",
        label: "Open balances",
        value: `${openBalances}`,
      },
    ];
  }, [scopedTrip?.amount, scopedExpenses.length, leaderboard.entries]);
  const tripScreenStatus: ScreenStateStatus = useMemo(() => {
    if (loadingIndicator && !hydratedTrip) {
      return "loading";
    }
    if (!hydratedTrip) {
      return "empty";
    }
    return "ready";
  }, [loadingIndicator, hydratedTrip]);

  const fetchTrip = useCallback(async () => {
    const docRef = doc(db, "trips", tripId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setCurrentTrip({ ...(docSnap.data() as DibbyTrip), id: docSnap.id });
    } else {
      setCurrentTrip(undefined);
    }
  }, [tripId]);

  const onRefresh = useCallback(async () => {
    if (dibbyUser?.uid) {
      setRefreshing(true);
      await fetchTrip();
      setRefreshing(false);
    }
  }, [dibbyUser?.uid, fetchTrip]);

  useEffect(() => {
    setLoadingIndicator(true);
    const unsub = onSnapshot(doc(db, "trips", tripId), (trip) => {
      if (!trip.exists()) {
        setCurrentTrip(undefined);
        setLoadingIndicator(false);
        return;
      }
      setCurrentTrip({ ...(trip.data() as DibbyTrip), id: trip.id });
    });

    return () => {
      unsub();
    };
  }, [tripId]);

  useEffect(() => {
    if (!currentTrip) {
      setTripExpenses([]);
      setSubTrips([]);
      setLoadingIndicator(false);
      return;
    }

    const unsubSubTrips = subscribeSubTrips(currentTrip, (groups) => {
      setSubTrips(groups);
    });
    const unsubExpenses = subscribeTripExpenses(currentTrip, (expenses) => {
      setTripExpenses(expenses);
      setLoadingIndicator(false);
    });

    return () => {
      unsubSubTrips();
      unsubExpenses();
    };
  }, [currentTrip?.id, currentTrip?.dateUpdated]);

  useEffect(() => {
    const hasSelected = subTrips.some((group) => group.id === selectedSubTripId);
    if (!hasSelected && selectedSubTripId !== ALL_SUB_TRIPS_ID) {
      setSelectedSubTripId(ALL_SUB_TRIPS_ID);
    }
  }, [subTrips, selectedSubTripId]);

  useEffect(() => {
    if (shouldOpenAddExpense && currentTrip) {
      setIsCreateExpenseModalVisible(true);
      navigation.setParams({ openAddExpense: false });
    }
  }, [navigation, shouldOpenAddExpense, currentTrip]);

  const expenses = useMemo(() => {
    return [...tripExpenses];
  }, [tripExpenses]);

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

    const searchTerm = debouncedSearch.trim().toLowerCase();
    const filtered = expenses.filter((expense) => {
      const inSelectedSubTrip =
        selectedSubTripId === ALL_SUB_TRIPS_ID
          ? true
          : (expense.subTripId || MAIN_SUB_TRIP_ID) === selectedSubTripId;
      if (!inSelectedSubTrip) {
        return false;
      }

      if (expenseFilter === "paidByMe") {
        if (!(dibbyUser?.uid ? expense.paidBy === dibbyUser.uid : false)) {
          return false;
        }
      }

      if (!searchTerm) {
        return true;
      }

      const payerName =
        currentTrip?.participants.find(
          (participant) => participant.uid === expense.paidBy,
        )?.name || "";
      const participantNames = expense.peopleInExpense
        .map((person) => person.name || "")
        .join(" ");
      const searchableText = [
        expense.title,
        expense.emoji,
        payerName,
        participantNames,
        expense.amount?.toString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
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
  }, [
    expenses,
    expenseFilter,
    expenseSort,
    dibbyUser?.uid,
    selectedSubTripId,
    debouncedSearch,
    currentTrip?.participants,
  ]);

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
        wideScreen={responsive.isDesktop}
        onPress={() =>
          navigation.navigate("ViewExpense", {
            tripName,
            tripId,
            expenseId: item.id,
          })
        }
      />
    ),
    [currentTrip, deleteAlert, navigation, tripId, tripName, responsive.isDesktop],
  );

  const toggleCreateExpenseModal = () => {
    setIsCreateExpenseModalVisible(!isCreateExpenseModalVisible);
  };
  const resetExpenseControls = () => {
    setExpenseFilter("all");
    setExpenseSort("recent");
    setSearchValue("");
    setSearchOpen(false);
    setSelectedSubTripId(ALL_SUB_TRIPS_ID);
  };

  const createGroup = async () => {
    if (!currentTrip || creatingGroup) {
      return;
    }
    const title = newGroupTitle.trim();
    if (!title) {
      Alert.alert("Group name required", "Add a name for this group.");
      return;
    }
    setCreatingGroup(true);
    try {
      const newGroup = await createSubTrip(currentTrip, {
        title,
        emoji: newGroupEmoji || null,
        participantIds: currentTrip.participants.map((participant) => participant.uid),
      });
      setSelectedSubTripId(newGroup.id);
      setIsCreateGroupModalVisible(false);
      setNewGroupTitle("");
      setNewGroupEmoji("");
      track("sub_trip_create", {
        tripId: currentTrip.id,
        subTripId: newGroup.id,
      });
    } catch (error) {
      Alert.alert("Could not create group", "Try again in a moment.");
    } finally {
      setCreatingGroup(false);
    }
  };

  const printToFile = async () => {
    if (!calculatedTrip || !scopedTrip) {
      Alert.alert(
        "Preparing summary",
        "Trip summary is still loading. Try again in a moment.",
      );
      return;
    }
    setLoadingIndicator(true);
    const exportHtml = generateHTML(calculatedTrip, scopedTrip);
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

  const toggleSearch = () => {
    if (searchOpen && searchValue) {
      setSearchValue("");
      return;
    }
    if (searchOpen) {
      setSearchOpen(false);
      return;
    }
    setSearchOpen(true);
  };

  const animateSettleSheet = useCallback(
    (expand: boolean) => {
      Animated.spring(settleSheetTranslateY, {
        toValue: expand ? 0 : collapsedSheetOffset,
        useNativeDriver: true,
        damping: 24,
        stiffness: 210,
        mass: 0.9,
      }).start();
      setIsSettleSheetExpanded(expand);
    },
    [settleSheetTranslateY, collapsedSheetOffset],
  );

  const settlePanResponder = useMemo(() => {
    let startY = 0;
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 6,
      onPanResponderGrant: () => {
        settleSheetTranslateY.stopAnimation((value: number) => {
          startY = value;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const nextY = Math.min(
          collapsedSheetOffset,
          Math.max(0, startY + gestureState.dy),
        );
        settleSheetTranslateY.setValue(nextY);
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldExpand =
          gestureState.vy < -0.2 ||
          gestureState.dy < -40 ||
          (!isSettleSheetExpanded && gestureState.dy < 0);
        const shouldCollapse =
          gestureState.vy > 0.2 ||
          gestureState.dy > 40 ||
          (isSettleSheetExpanded && gestureState.dy > 0);

        if (shouldExpand && !shouldCollapse) {
          animateSettleSheet(true);
          return;
        }
        if (shouldCollapse && !shouldExpand) {
          animateSettleSheet(false);
          return;
        }

        settleSheetTranslateY.stopAnimation((value: number) => {
          animateSettleSheet(value < collapsedSheetOffset / 2);
        });
      },
    });
  }, [
    settleSheetTranslateY,
    collapsedSheetOffset,
    isSettleSheetExpanded,
    animateSettleSheet,
  ]);

  useEffect(() => {
    if (isSettleModalVisible) {
      settleSheetTranslateY.setValue(collapsedSheetOffset);
      setIsSettleSheetExpanded(false);
    }
  }, [isSettleModalVisible, settleSheetTranslateY, collapsedSheetOffset]);

  const tripActions: ActionMenuItem[] = [
    {
      key: "share",
      label: "Share summary",
      icon: faShareNodes,
      onPress: handleShare,
    },
  ];

  const renderTripSummaryPanel = () => (
    <View style={styles.headerStack}>
      <View
        style={styles.headerCard}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.tripTitle}>{tripTitle}</Text>
            <Text style={styles.tripMeta}>
              {selectedSubTripLabel} • {currentTrip?.participants.length || 0}{" "}
              travelers
            </Text>
          </View>
          {currentTrip?.participants ? (
            <DibbyAvatars travelers={currentTrip?.participants} />
          ) : null}
        </View>
        <View style={styles.summaryStatRow}>
          {summaryNumbers.map((item) => (
            <View
              key={item.key}
              style={styles.summaryStatCard}
            >
              <Text style={styles.summaryStatLabel}>{item.label}</Text>
              <Text style={styles.summaryStatValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <TripLeaderboard
        entries={leaderboard.entries}
        nextPayment={leaderboard.nextPayment}
        onSettleNow={() => setIsSettleModalVisible(true)}
      />

      <Pressable
        onPress={() => setIsSettleModalVisible(true)}
        style={styles.summaryToggle}
      >
        <View style={styles.summaryToggleContent}>
          <Text style={styles.sectionTitle}>
            {hasOpenBalances ? "Open settle details" : "View balances"}
          </Text>
        </View>
      </Pressable>
    </View>
  );

  const renderTripControls = () => (
    <View style={styles.controlsStack}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.groupChipRow}
      >
        <Pressable
          onPress={() => setSelectedSubTripId(ALL_SUB_TRIPS_ID)}
          style={styles.groupChip}
        >
          <Text
            style={[
              styles.groupChipText,
              selectedSubTripId === ALL_SUB_TRIPS_ID &&
                styles.groupChipTextActive,
            ]}
          >
            All groups
          </Text>
        </Pressable>
        {subTrips.map((group) => {
          const isActive = selectedSubTripId === group.id;
          return (
            <Pressable
              key={group.id}
              onPress={() => setSelectedSubTripId(group.id)}
              style={styles.groupChip}
            >
              <Text
                style={[styles.groupChipText, isActive && styles.groupChipTextActive]}
              >
                {formatTitleWithEmoji(group.title, group.emoji)}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setIsCreateGroupModalVisible(true)}
          style={styles.groupChip}
        >
          <View style={styles.addGroupContent}>
            <FontAwesomeIcon icon={faPlus} size={10} color={colors.textSecondary} />
            <Text style={styles.groupChipText}>Group</Text>
          </View>
        </Pressable>
      </ScrollView>

      <View
        style={styles.segmentContainer}
      >
        <View style={styles.segmentRow}>
          <Pressable
            onPress={() => setSegment("expenses")}
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
          </Pressable>
          <Pressable
            onPress={() => setSegment("travelers")}
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
          </Pressable>
        </View>
      </View>
      {segment === "expenses" && (
        <>
          {searchOpen && (
            <View
              style={styles.searchSurface}
            >
              <DibbyInput
                placeholder="Search expenses, payer, participant, amount"
                value={searchValue}
                onChangeText={setSearchValue}
                clearButtonMode="while-editing"
              />
            </View>
          )}
          <View style={styles.expenseMetaRow}>
            <Text style={styles.expenseMetaText}>
              {visibleExpenses.length} result
              {visibleExpenses.length === 1 ? "" : "s"}
            </Text>
            {searchValue.trim() ? (
              <Pressable
                onPress={() => setSearchValue("")}
                style={styles.clearSearchButton}
              >
                <Text style={styles.clearSearchText}>Clear search</Text>
              </Pressable>
            ) : null}
          </View>
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
        </>
      )}
    </View>
  );

  return (
    <View style={styles.topContainer}>
      <SafeAreaView style={styles.topContainer}>
        <TopBar
          withSurface={false}
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
            <View style={styles.topActions}>
              {segment === "expenses" ? (
                <DibbyButton
                  type="clear"
                  size="sm"
                  onPress={toggleSearch}
                  title={
                    <FontAwesomeIcon
                      icon={searchOpen ? faTimes : faSearch}
                      size={16}
                      color={colors.textPrimary}
                    />
                  }
                />
              ) : null}
              <ActionMenu items={tripActions} compact />
            </View>
          }
        />

        <ScreenLayout contentStyle={styles.layoutContent}>
          <ScreenState
            status={tripScreenStatus}
            title="Trip not found"
            description="We couldn’t load this trip yet."
            actionLabel="Back to trips"
            onAction={() => navigation.navigate("Home")}
          >
            {responsive.isDesktop ? (
              <View style={styles.desktopShell}>
                <View style={styles.desktopPrimary}>
                  {renderTripControls()}
                  {segment === "expenses" ? (
                    <FlatList
                      removeClippedSubviews={false}
                      data={visibleExpenses}
                      key="trip-expenses-desktop"
                      numColumns={1}
                      keyExtractor={(expense) => expense.id}
                      contentContainerStyle={styles.desktopListContent}
                      ListEmptyComponent={
                        loadingIndicator ? (
                          <DibbyLoading />
                        ) : (
                          <View
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
                                onPress={resetExpenseControls}
                                fullWidth
                              />
                            )}
                          </View>
                        )
                      }
                      refreshControl={
                        <RefreshControl
                          refreshing={refreshing}
                          onRefresh={onRefresh}
                        />
                      }
                      style={styles.list}
                      initialNumToRender={8}
                      maxToRenderPerBatch={10}
                      windowSize={9}
                      updateCellsBatchingPeriod={50}
                      renderItem={renderExpenseItem}
                    />
                  ) : (
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.desktopTravelersContent}
                      style={styles.list}
                    >
                      <View style={styles.travelersContainer}>
                        <View
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
                                <View
                                  key={t.uid}
                                  style={[
                                    styles.travelerPill,
                                    {
                                      backgroundColor: changeOpacity(
                                        participantColor,
                                        0.25,
                                      ),
                                    },
                                  ]}
                                >
                                  <Text style={styles.travelerText}>{t.name}</Text>
                                </View>
                              );
                            })}
                          </View>
                        </View>

                        <View
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
                        </View>
                      </View>
                    </ScrollView>
                  )}
                </View>
                <View style={styles.desktopAside}>{renderTripSummaryPanel()}</View>
              </View>
            ) : segment === "expenses" ? (
              <FlatList
                removeClippedSubviews={false}
                data={visibleExpenses}
                key="trip-expenses-mobile"
                numColumns={1}
                keyExtractor={(expense) => expense.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                  <View>
                    {renderTripSummaryPanel()}
                    {renderTripControls()}
                  </View>
                }
                ListEmptyComponent={
                  loadingIndicator ? (
                    <DibbyLoading />
                  ) : (
                    <View
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
                          onPress={resetExpenseControls}
                          fullWidth
                        />
                      )}
                    </View>
                  )
                }
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
                {renderTripSummaryPanel()}
                {renderTripControls()}
                <View style={styles.travelersContainer}>
                  <View
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
                          <View
                            key={t.uid}
                            style={[
                              styles.travelerPill,
                              {
                                backgroundColor: changeOpacity(
                                  participantColor,
                                  0.25,
                                ),
                              },
                            ]}
                          >
                            <Text style={styles.travelerText}>{t.name}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  <View
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
                  </View>
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
                defaultSubTripId={
                  selectedSubTripId === ALL_SUB_TRIPS_ID
                    ? MAIN_SUB_TRIP_ID
                    : selectedSubTripId
                }
              />
            )}
          </Modal>
          <Modal
            transparent
            animationType="fade"
            visible={isSettleModalVisible}
            onRequestClose={() => setIsSettleModalVisible(false)}
          >
            <View style={styles.sheetOverlay}>
              <Pressable
                onPress={() => setIsSettleModalVisible(false)}
                style={styles.sheetBackdrop}
              >
                <View />
              </Pressable>
              <Animated.View
                style={[
                  styles.settleSheetWrap,
                  {
                    height: expandedSheetHeight,
                    paddingBottom: Math.max(insets.bottom, NeumoTokens.spacing.sm),
                    transform: [{ translateY: settleSheetTranslateY }],
                  },
                ]}
                {...settlePanResponder.panHandlers}
              >
                <View
                  style={styles.settleSheet}
                >
                  <View style={styles.settleSheetHeader}>
                    <View style={styles.grabber} />
                    <View style={styles.settleHeaderRow}>
                      <Text style={styles.settleSheetTitle}>
                        {selectedSubTripLabel} settle up
                      </Text>
                      <View style={styles.settleHeaderActions}>
                        <Pressable
                          onPress={() => animateSettleSheet(!isSettleSheetExpanded)}
                          style={styles.settleHeaderButton}
                        >
                          <Text style={styles.settleHeaderButtonText}>
                            {isSettleSheetExpanded ? "Collapse" : "Expand"}
                          </Text>
                        </Pressable>
                        <DibbyButton
                          type="clear"
                          size="sm"
                          onPress={() => setIsSettleModalVisible(false)}
                          title={
                            <FontAwesomeIcon
                              icon={faTimes}
                              size={16}
                              color={colors.textPrimary}
                            />
                          }
                        />
                      </View>
                    </View>
                  </View>
                  <ScrollView contentContainerStyle={styles.settleModalContent}>
                    {calculatedTrip && scopedTrip ? (
                      <DibbySummary
                        currentTrip={scopedTrip}
                        calculatedTrip={calculatedTrip}
                      />
                    ) : (
                      <DibbyLoading />
                    )}
                  </ScrollView>
                </View>
              </Animated.View>
            </View>
          </Modal>
          <Modal
            transparent
            animationType="fade"
            visible={isCreateGroupModalVisible}
            onRequestClose={() => setIsCreateGroupModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View
                style={styles.modalCard}
              >
                <Text style={styles.modalTitle}>Create a group</Text>
                <Text style={styles.modalDescription}>
                  Use groups to split subset expenses without extra screens.
                </Text>
                <View style={styles.modalInputRow}>
                  <EmojiSelector
                    value={newGroupEmoji}
                    onChange={(emoji) => setNewGroupEmoji(emoji || "")}
                    label="Group emoji"
                    size={42}
                  />
                  <View style={styles.modalInputField}>
                    <DibbyInput
                      placeholder="Group name"
                      value={newGroupTitle}
                      onChangeText={setNewGroupTitle}
                    />
                  </View>
                </View>
                <View style={styles.modalActions}>
                  <DibbyButton
                    title="Cancel"
                    onPress={() => setIsCreateGroupModalVisible(false)}
                    size="sm"
                  />
                  <DibbyButton
                    title="Create"
                    onPress={createGroup}
                    disabled={!newGroupTitle.trim().length || creatingGroup}
                    loading={creatingGroup}
                    size="sm"
                  />
                </View>
              </View>
            </View>
          </Modal>
        </ScreenLayout>
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
    layoutContent: {
      flex: 1,
      overflow: "visible",
      paddingTop: 74,
    },
    headerStack: {
      gap: NeumoTokens.spacing.sm,
    },
    controlsStack: {
      gap: NeumoTokens.spacing.sm,
      marginBottom: NeumoTokens.spacing.sm,
    },
    topActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    headerCard: {
      marginBottom: 8,
      gap: 12,
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
    summaryStatRow: {
      flexDirection: "row",
      gap: 8,
    },
    summaryStatCard: {
      flex: 1,
      minHeight: 64,
      justifyContent: "center",
    },
    summaryStatLabel: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      textTransform: "uppercase",
      letterSpacing: Typography.tracking.normal,
    },
    summaryStatValue: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
      marginTop: 4,
    },
    groupChipRow: {
      gap: 8,
      paddingRight: 12,
    },
    groupChip: {
      minHeight: NeumoTokens.control.pill.minHeight,
    },
    groupChipText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.medium as any,
    },
    groupChipTextActive: {
      color: colors.textPrimary,
      fontWeight: Typography.weight.semibold as any,
    },
    addGroupContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    listContent: {
      paddingBottom: FloatingTabBar.spacer + NeumoTokens.spacing.xs,
      paddingHorizontal: NeumoTokens.spacing.xxs,
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
      alignItems: "center",
    },
    settleModalContent: {
      width: "100%",
      flexGrow: 1,
      paddingHorizontal: NeumoTokens.spacing.sm,
      paddingBottom: NeumoTokens.spacing.md,
    },
    sheetOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.28)",
      justifyContent: "flex-end",
    },
    sheetBackdrop: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 0,
    },
    settleSheetWrap: {
      width: "100%",
    },
    settleSheet: {
      flex: 1,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      overflow: "hidden",
      paddingTop: 8,
    },
    settleSheetHeader: {
      paddingHorizontal: NeumoTokens.spacing.sm,
      paddingBottom: 6,
    },
    settleHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
      gap: 8,
    },
    settleSheetTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
      flex: 1,
    },
    settleHeaderActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    settleHeaderButton: {
      minHeight: NeumoTokens.control.pill.minHeight - 4,
      paddingHorizontal: NeumoTokens.spacing.sm,
    },
    settleHeaderButtonText: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
      textTransform: "uppercase",
      letterSpacing: Typography.tracking.normal,
    },
    grabber: {
      alignSelf: "center",
      width: 44,
      height: 5,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
    },
    segmentContainer: {
      marginBottom: 0,
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
    searchSurface: {
      paddingVertical: 0,
      paddingHorizontal: 4,
    },
    expenseMetaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 4,
    },
    expenseMetaText: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      textTransform: "uppercase",
      letterSpacing: Typography.tracking.normal,
    },
    clearSearchButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    clearSearchText: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold as any,
    },
    emptyState: {
      marginVertical: 10,
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
      borderWidth: 0,
    },
    travelerText: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
    },
    desktopShell: {
      flex: 1,
      flexDirection: "row",
      gap: 20,
      overflow: "visible",
    },
    desktopPrimary: {
      flex: 1.25,
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
    desktopListContent: {
      paddingBottom: FloatingTabBar.spacer + NeumoTokens.spacing.md,
      overflow: "visible",
    },
    desktopTravelersContent: {
      paddingBottom: FloatingTabBar.spacer + NeumoTokens.spacing.md,
      overflow: "visible",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalCard: {
      width: "100%",
      maxWidth: 460,
      gap: 12,
    },
    modalTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
    },
    modalDescription: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
    },
    modalInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    modalInputField: {
      flex: 1,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
    },
  });
