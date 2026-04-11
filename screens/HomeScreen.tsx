import {
  FlatList,
  StyleSheet,
  View,
  Text,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";

import { useNavigation } from "@react-navigation/native";
import { useUser } from "../hooks/useUser";
import { SafeAreaView } from "react-native-safe-area-context";
import { DibbyCard } from "../components/DibbyCard";
import TopBar from "../components/TopBar";
import { ThemeColors } from "../constants/Colors";
import {
  onSnapshot,
  collection,
  doc,
  query,
  updateDoc,
  getDocs,
  where,
  documentId,
} from "firebase/firestore";
import { DibbyTrip } from "../constants/DibbyTypes";
import { Platform } from "react-native";
import DibbyButton from "../components/DibbyButton";
import {
  faSearch,
  faSignOutAlt,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Avatar } from "@rneui/themed";
import { getInitials, normalizePhotoURL } from "../helpers/AppHelpers";
import { deleteDibbyTrip } from "../helpers/FirebaseHelpers";
import NeumoSurface from "../components/NeumoSurface";
import { FloatingTabBar, NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";
import { resolveParticipantColor } from "../helpers/GenerateColor";
import NeumoPressable from "../components/NeumoPressable";
import SortFilterBar, { SortFilterOption } from "../components/SortFilterBar";
import StatsSection from "../components/StatsSection";
import { buildHomeStats, pickStats } from "../helpers/StatsHelpers";
import ScreenState from "../components/ScreenState";
import ScreenLayout from "../components/ScreenLayout";
import useResponsiveLayout from "../hooks/useResponsiveLayout";
import { useDebounce } from "../hooks/useDebounce";
import DibbyInput from "../components/DibbyInput";
import { useAvatarUrl } from "../hooks/useAvatarUrl";

const cardWidth = 500;
const HomeScreen = () => {
  const [currentTrips, setCurrentTrips] = useState<DibbyTrip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);
  const [tripFilter, setTripFilter] = useState<"all" | "open" | "completed">(
    "all",
  );
  const [tripSort, setTripSort] = useState<
    "recent" | "oldest" | "amount" | "name"
  >("recent");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 150);

  const navigation = useNavigation();
  const { dibbyUser, loggedInUser, authReady, profileReady } = useUser();
  const { uri: avatarUrl, imageProps } = useAvatarUrl(
    dibbyUser?.photoURL || loggedInUser?.photoURL,
    96,
  );

  const colors = useAppTheme();
  const responsive = useResponsiveLayout();
  const styles = makeStyles(colors as unknown as ThemeColors);

  const fetchTrips = useCallback(async () => {
    if (dibbyUser?.trips.length && dibbyUser?.trips.length > 0) {
      const q = query(
        collection(db, "trips"),
        where(documentId(), "in", dibbyUser!!.trips),
        // orderBy("dateCreated", "desc")
      );
      const querySnapshot = await getDocs(q);
      const trips: DibbyTrip[] = [];
      querySnapshot.forEach((doc) => {
        trips.push(doc.data() as DibbyTrip);
      });
      return trips;
    } else {
      return [];
    }
  }, [dibbyUser?.trips]);

  const onRefresh = useCallback(async () => {
    if (dibbyUser?.uid) {
      setRefreshing(true);
      const trips = await fetchTrips();
      setCurrentTrips(trips);
      setRefreshing(false);
    }
  }, [dibbyUser?.uid, fetchTrips]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUrl]);

  useEffect(() => {
    if (!authReady || !profileReady) {
      setLoading(true);
      return;
    }

    if (!dibbyUser?.uid) {
      setCurrentTrips([]);
      setLoading(false);
      return;
    }

    const tripsExist =
      Array.isArray(dibbyUser.trips) && dibbyUser.trips.length > 0;

    if (tripsExist) {
      setLoading(true);
      const q = query(
        collection(db, "trips"),
        where(documentId(), "in", dibbyUser.trips),
        // orderBy("dateCreated", "desc")
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const trips: DibbyTrip[] = [];
        querySnapshot.forEach((doc) => {
          trips.push(doc.data() as DibbyTrip);
        });
        setCurrentTrips(trips);
        setLoading(false);
      });

      return () => unsubscribe();
    }
    setCurrentTrips([]);
    setLoading(false);
  }, [authReady, profileReady, dibbyUser?.uid, dibbyUser?.trips]);

  const screenStatus = loading || !authReady || !profileReady ? "loading" : "ready";

  const completeTrip = useCallback(
    async (trip: DibbyTrip, complete: boolean) => {
      const tripRef = doc(db, "trips", trip.id);
      await updateDoc(tripRef, { completed: complete });
    },
    [],
  );

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      })
      .catch((err) => {
        alert(err.message);
      });
  };

  const deleteAlert = useCallback(
    (item: DibbyTrip) => {
      const tripOwner = dibbyUser?.uid === item.createdBy;
      const title = tripOwner
        ? `Are you sure you want to delete ${item.title}?`
        : "Only the owner can delete this trip!";
      const message = tripOwner ? "This will be permanently deleted." : "";
      const options: {
        text: string;
        onPress?: (value?: string) => void;
        style?: "cancel" | "default" | "destructive" | undefined;
      }[] = [
        {
          text: tripOwner ? "Cancel" : "Close",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
      ];

      tripOwner &&
        options.push({
          text: "Delete",
          onPress: async () => await deleteDibbyTrip(item),
          style: "destructive",
        });

      if (Platform.OS === "web") {
        const result = window.confirm(
          [title, message].filter(Boolean).join("\n"),
        );

        if (result) {
          const confirmOption = options.find(({ style }) => style !== "cancel");
          confirmOption && confirmOption.onPress && confirmOption.onPress();
        } else {
          const cancelOption = options.find(({ style }) => style === "cancel");
          cancelOption && cancelOption.onPress && cancelOption.onPress();
        }
      } else {
        Alert.alert(title, message, options);
      }
    },
    [dibbyUser],
  );

  const homeStats = useMemo(
    () => buildHomeStats(currentTrips, dibbyUser?.uid),
    [currentTrips, dibbyUser?.uid],
  );
  const homeCompactStats = useMemo(
    () =>
      pickStats(homeStats, [
        "home-trips",
        "home-user-spent",
        // "home-total-cost",
        // "home-avg-trip",
      ]),
    [homeStats],
  );
  const statsColumns = responsive.isDesktop ? 2 : 2;

  const tripFilterOptions: SortFilterOption[] = [
    { label: "All", value: "all" },
    { label: "Open", value: "open" },
    { label: "Completed", value: "completed" },
  ];
  const tripSortOptions: SortFilterOption[] = [
    { label: "Newest", value: "recent" },
    { label: "Oldest", value: "oldest" },
    { label: "Amount", value: "amount" },
    { label: "Name", value: "name" },
  ];

  const visibleTrips = useMemo(() => {
    const searchTerm = debouncedSearch.trim().toLowerCase();
    const filtered = currentTrips.filter((trip) => {
      if (tripFilter === "open") {
        if (trip.completed) {
          return false;
        }
      }
      if (tripFilter === "completed" && !trip.completed) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      const participantText = trip.participants
        .map((participant) => `${participant.name || ""} ${participant.username || ""}`)
        .join(" ");
      const searchableText = [
        trip.title,
        trip.emoji,
        participantText,
        trip.amount?.toString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });

    const resolveTripDate = (trip: DibbyTrip) => {
      const dateValue: any = trip.dateCreated;
      if (!dateValue) {
        return 0;
      }
      if (typeof dateValue.toDate === "function") {
        return dateValue.toDate().getTime();
      }
      return new Date(dateValue).getTime();
    };

    return [...filtered].sort((a, b) => {
      switch (tripSort) {
        case "oldest":
          return resolveTripDate(a) - resolveTripDate(b);
        case "amount":
          return (b.amount || 0) - (a.amount || 0);
        case "name":
          return (a.title || "").localeCompare(b.title || "");
        case "recent":
        default:
          return resolveTripDate(b) - resolveTripDate(a);
      }
    });
  }, [currentTrips, tripFilter, tripSort, debouncedSearch]);

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

  const clearControls = () => {
    setTripFilter("all");
    setTripSort("recent");
    setSearchValue("");
    setSearchOpen(false);
  };

  const renderTripItem = useCallback(
    ({ item }: { item: DibbyTrip }) => (
      <DibbyCard
        wideScreen={responsive.isDesktop}
        cardWidth={cardWidth}
        trip={item}
        completed={item.completed}
        onDeleteItem={() => deleteAlert(item)}
        onCompleteItem={(complete) => completeTrip(item, complete)}
        onPress={() =>
          navigation.navigate("ViewTrip", {
            tripName: item.title,
            tripId: item.id,
          })
        }
      />
    ),
    [navigation, deleteAlert, completeTrip, responsive.isDesktop],
  );

  const renderHeroCard = () => (
    <NeumoSurface
      variant="glass"
      tone="surface"
      radius={NeumoTokens.radius.lg}
      style={styles.hero}
    >
      <Text style={styles.heroTitle}>Your trips</Text>
      <View style={styles.heroStats}>
        <StatsSection
          compactItems={homeCompactStats}
          fullItems={homeStats}
          compactColumns={2}
          expandedColumns={statsColumns}
        />
      </View>
    </NeumoSurface>
  );

  const renderSortFilter = () =>
    currentTrips.length > 0 ? (
      <SortFilterBar
        filterOptions={tripFilterOptions}
        sortOptions={tripSortOptions}
        selectedFilter={tripFilter}
        selectedSort={tripSort}
        onFilterChange={(value) =>
          setTripFilter(value as "all" | "open" | "completed")
        }
        onSortChange={(value) =>
          setTripSort(value as "recent" | "oldest" | "amount" | "name")
        }
      />
    ) : null;

  const renderEmptyState = () =>
    currentTrips.length > 0 ? (
      <NeumoSurface
        variant="inset"
        tone="surface"
        radius={NeumoTokens.radius.lg}
        style={styles.emptyState}
      >
        <Text style={styles.emptyTitle}>No trips match this filter</Text>
        <Text style={styles.emptyText}>Try changing the filter or sort.</Text>
        <DibbyButton
          title="Clear filters"
          onPress={clearControls}
          fullWidth
        />
      </NeumoSurface>
    ) : (
      <NeumoSurface
        variant="glass"
        tone="surface"
        radius={NeumoTokens.radius.lg}
        style={styles.emptyState}
      >
        <Text style={styles.emptyTitle}>Create your first trip</Text>
        <Text style={styles.emptyText}>
          Add friends and split expenses in minutes.
        </Text>
        <DibbyButton
          title="Create Trip"
          onPress={() => navigation.navigate("TripWizard")}
          fullWidth
        />
        <NeumoPressable
          variant="solid"
          tone="base"
          onPress={() => setShowHowItWorks(true)}
          style={styles.howItWorksButton}
        >
          <Text style={styles.howItWorksText}>How it works (30 sec)</Text>
        </NeumoPressable>
      </NeumoSurface>
    );

  return (
    <View style={styles.topContainer}>
      <SafeAreaView style={styles.topContainer}>
        <TopBar
          withSurface={false}
          title="Trips"
          leftButton={
            <DibbyButton
              type="clear"
              onPress={handleSignOut}
              title={
                <FontAwesomeIcon
                  icon={faSignOutAlt}
                  size={24}
                  color={colors.textPrimary}
                />
              }
            />
          }
          rightButton={
            <DibbyButton
              type="clear"
              onPress={() => {
                navigation.navigate("ProfileTab");
              }}
              title={
                <Avatar
                  size="small"
                  rounded
                  source={
                    avatarUrl
                      ? {
                          uri: avatarUrl,
                          cache: "force-cache",
                        }
                      : undefined
                  }
                  imageProps={imageProps}
                  title={getInitials(
                    dibbyUser?.displayName || loggedInUser?.displayName,
                  )}
                  containerStyle={{
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: colors.background.default,
                  }}
                  overlayContainerStyle={{
                    backgroundColor: resolveParticipantColor(
                      dibbyUser?.color,
                      dibbyUser?.uid ||
                        dibbyUser?.username ||
                        dibbyUser?.displayName ||
                        "",
                    ),
                  }}
                  titleStyle={{
                    color: colors.primary.text,
                  }}
                />
              }
            />
          }
        />
        <ScreenLayout contentStyle={styles.layoutContent}>
          <ScreenState status={screenStatus}>
            {responsive.isDesktop ? (
              <View style={styles.desktopShell}>
                <View style={styles.desktopPrimary}>
                  <View style={styles.desktopListHeader}>
                    {searchOpen && (
                      <NeumoSurface
                        variant="inset"
                        tone="surface"
                        radius={NeumoTokens.radius.md}
                        style={styles.searchSurface}
                      >
                        <DibbyInput
                          placeholder="Search trips, travelers, amount"
                          value={searchValue}
                          onChangeText={setSearchValue}
                        />
                      </NeumoSurface>
                    )}
                    <Text style={styles.resultsText}>
                      {visibleTrips.length} trip
                      {visibleTrips.length === 1 ? "" : "s"}
                    </Text>
                    {renderSortFilter()}
                  </View>
                  <FlatList
                    removeClippedSubviews={false}
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                      />
                    }
                    style={styles.list}
                    contentContainerStyle={styles.desktopListContent}
                    key="home-desktop-list"
                    data={visibleTrips}
                    keyExtractor={(trip) => trip.id}
                    numColumns={1}
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={9}
                    updateCellsBatchingPeriod={50}
                    ListEmptyComponent={renderEmptyState()}
                    renderItem={renderTripItem}
                  />
                </View>
                <View style={styles.desktopAside}>{renderHeroCard()}</View>
              </View>
            ) : (
              <FlatList
                removeClippedSubviews={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
                style={styles.list}
                contentContainerStyle={styles.listContent}
                key="home-mobile-list"
                data={visibleTrips}
                keyExtractor={(trip) => trip.id}
                numColumns={1}
                initialNumToRender={6}
                maxToRenderPerBatch={8}
                windowSize={7}
                updateCellsBatchingPeriod={50}
                ListHeaderComponent={
                  <View style={styles.listHeader}>
                    {renderHeroCard()}
                    {searchOpen && (
                      <NeumoSurface
                        variant="inset"
                        tone="surface"
                        radius={NeumoTokens.radius.md}
                        style={styles.searchSurface}
                      >
                        <DibbyInput
                          placeholder="Search trips, travelers, amount"
                          value={searchValue}
                          onChangeText={setSearchValue}
                        />
                      </NeumoSurface>
                    )}
                    <Text style={styles.resultsText}>
                      {visibleTrips.length} trip
                      {visibleTrips.length === 1 ? "" : "s"}
                    </Text>
                    {renderSortFilter()}
                  </View>
                }
                ListEmptyComponent={renderEmptyState()}
                renderItem={renderTripItem}
              />
            )}
          </ScreenState>
        </ScreenLayout>
      </SafeAreaView>
      <Modal
        transparent
        animationType="fade"
        visible={showHowItWorks}
        onRequestClose={() => setShowHowItWorks(false)}
      >
        <View style={styles.modalOverlay}>
          <NeumoSurface
            variant="glass-strong"
            tone="surface"
            radius={NeumoTokens.radius.lg}
            style={styles.modalCard}
          >
            <Text style={styles.modalTitle}>How it works</Text>
            <Text style={styles.modalText}>
              1. Create a trip and add travelers.
            </Text>
            <Text style={styles.modalText}>
              2. Add expenses and choose how to split.
            </Text>
            <Text style={styles.modalText}>
              3. See balances and settle up easily.
            </Text>
            <DibbyButton
              title="Got it"
              onPress={() => setShowHowItWorks(false)}
              fullWidth
            />
          </NeumoSurface>
        </View>
      </Modal>
    </View>
  );
};

export default HomeScreen;

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
    topActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    list: {
      overflow: "visible",
      flex: 1,
    },
    listContent: {
      paddingHorizontal: NeumoTokens.spacing.xxs,
      paddingTop: NeumoTokens.spacing.xs,
      paddingBottom: FloatingTabBar.spacer + NeumoTokens.spacing.xs,
      overflow: "visible",
    },
    listHeader: {
      gap: 10,
      marginBottom: 10,
    },
    searchSurface: {
      paddingHorizontal: 4,
      paddingVertical: 0,
    },
    resultsText: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      textTransform: "uppercase",
      letterSpacing: Typography.tracking.normal,
    },
    hero: {
      marginBottom: 0,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.lg,
      fontWeight: Typography.weight.bold as any,
      marginBottom: 6,
    },
    heroStats: {
      marginTop: 4,
    },
    emptyState: {
      marginVertical: 16,
      gap: 12,
    },
    emptyTitle: {
      color: colors.textPrimary,
      textAlign: "center",
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
    },
    emptyText: {
      color: colors.textSecondary,
      textAlign: "center",
      fontSize: Typography.size.sm,
    },
    howItWorksButton: {
      marginTop: 4,
    },
    howItWorksText: {
      color: colors.accent,
      textAlign: "center",
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
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
      maxWidth: 420,
      gap: 10,
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
      paddingTop: NeumoTokens.spacing.xs,
      alignSelf: "flex-start",
    },
    desktopListHeader: {
      marginBottom: 8,
    },
    desktopListContent: {
      paddingBottom: FloatingTabBar.spacer + NeumoTokens.spacing.md,
      overflow: "visible",
    },
  });
