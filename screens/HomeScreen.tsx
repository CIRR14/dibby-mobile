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
import { DibbyTrip, DibbyTripLinkRequest } from "../constants/DibbyTypes";
import { Platform } from "react-native";
import { wideScreen, windowWidth } from "../constants/DeviceWidth";
import DibbyButton from "../components/DibbyButton";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Avatar } from "@rneui/themed";
import { getInitials } from "../helpers/AppHelpers";
import DibbyVersion from "../components/DibbyVersion";
import {
  acceptTripLinkRequest,
  deleteDibbyTrip,
  rejectTripLinkRequest,
} from "../helpers/FirebaseHelpers";
import NeumoSurface from "../components/NeumoSurface";
import { FloatingTabBar, NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";
import { resolveParticipantColor } from "../helpers/GenerateColor";
import NeumoPressable from "../components/NeumoPressable";
import SortFilterBar, { SortFilterOption } from "../components/SortFilterBar";
import { useAvatarUrl } from "../hooks/useAvatarUrl";
import StatsSection from "../components/StatsSection";
import { buildHomeStats, pickStats } from "../helpers/StatsHelpers";
import ScreenState from "../components/ScreenState";
import { useTripLinkRequests } from "../hooks/useTripLinkRequests";
import { TripLinkRequestCard } from "../components/TripLinkRequestCard";

const cardWidth = 500;
const numColumns = Math.floor(windowWidth / cardWidth);

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
  const [busyLinkRequestId, setBusyLinkRequestId] = useState<string | null>(
    null,
  );

  const navigation: any = useNavigation();
  const { dibbyUser, loggedInUser } = useUser();
  const { requests: tripLinkRequests } = useTripLinkRequests(
    "targetUid",
    dibbyUser?.uid,
  );
  const { uri: avatarUrl, imageProps } = useAvatarUrl(
    dibbyUser?.photoURL || loggedInUser?.photoURL,
    96,
  );

  const colors = useAppTheme();
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
  }, [dibbyUser]);

  useEffect(() => {
    const tripsExist = dibbyUser?.trips.length && dibbyUser?.trips.length > 0;
    if (dibbyUser?.uid && tripsExist) {
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
    if (!tripsExist) {
      setLoading(false);
    }
  }, [dibbyUser]);

  const completeTrip = useCallback(
    async (trip: DibbyTrip, complete: boolean) => {
      const tripRef = doc(db, "trips", trip.id);
      await updateDoc(tripRef, { completed: complete });
    },
    [],
  );

  const actionTripLinkRequest = useCallback(
    async (action: "accept" | "reject", request: DibbyTripLinkRequest) => {
      if (!dibbyUser) {
        return;
      }

      setBusyLinkRequestId(request.id);
      try {
        if (action === "accept") {
          await acceptTripLinkRequest(dibbyUser, request);
        } else {
          await rejectTripLinkRequest(dibbyUser, request);
        }
      } catch (err: any) {
        Alert.alert(
          "Trip invite unavailable",
          err?.message || "Unable to update this trip invite right now.",
        );
      } finally {
        setBusyLinkRequestId(null);
      }
    },
    [dibbyUser],
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
  const statsColumns = wideScreen ? 3 : 2;

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
    const filtered = currentTrips.filter((trip) => {
      if (tripFilter === "open") {
        return !trip.completed;
      }
      if (tripFilter === "completed") {
        return Boolean(trip.completed);
      }
      return true;
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
  }, [currentTrips, tripFilter, tripSort]);

  const renderTripItem = useCallback(
    ({ item }: { item: DibbyTrip }) => (
      <DibbyCard
        wideScreen={wideScreen}
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
    [navigation, deleteAlert, completeTrip, wideScreen],
  );

  return (
    <View style={styles.topContainer}>
      <SafeAreaView style={styles.topContainer}>
        <TopBar
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
        {dibbyUser && (
          <View style={styles.grid}>
            <ScreenState status={loading ? "loading" : "ready"}>
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
                key={numColumns}
                data={visibleTrips}
                keyExtractor={(trip) => trip.id}
                numColumns={numColumns}
                initialNumToRender={6}
                maxToRenderPerBatch={8}
                windowSize={7}
                updateCellsBatchingPeriod={50}
                ListHeaderComponent={
                  <View style={styles.listHeader}>
                    {tripLinkRequests.length > 0 && (
                      <View style={styles.pendingRequests}>
                        <Text style={styles.sectionTitle}>Pending invites</Text>
                        {tripLinkRequests.map((request) => (
                          <TripLinkRequestCard
                            key={request.id}
                            request={request}
                            mode="invitee"
                            busy={busyLinkRequestId === request.id}
                            onAccept={(item) =>
                              actionTripLinkRequest("accept", item)
                            }
                            onReject={(item) =>
                              actionTripLinkRequest("reject", item)
                            }
                          />
                        ))}
                      </View>
                    )}
                    <NeumoSurface
                      variant="raised"
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
                    {currentTrips.length > 0 && (
                      <SortFilterBar
                        filterOptions={tripFilterOptions}
                        sortOptions={tripSortOptions}
                        selectedFilter={tripFilter}
                        selectedSort={tripSort}
                        onFilterChange={(value) =>
                          setTripFilter(value as "all" | "open" | "completed")
                        }
                        onSortChange={(value) =>
                          setTripSort(
                            value as "recent" | "oldest" | "amount" | "name",
                          )
                        }
                      />
                    )}
                  </View>
                }
                ListEmptyComponent={
                  currentTrips.length > 0 ? (
                    <NeumoSurface
                      variant="inset"
                      tone="surface"
                      radius={NeumoTokens.radius.lg}
                      style={styles.emptyState}
                    >
                      <Text style={styles.emptyTitle}>
                        No trips match this filter
                      </Text>
                      <Text style={styles.emptyText}>
                        Try changing the filter or sort.
                      </Text>
                      <DibbyButton
                        title="Clear filters"
                        onPress={() => {
                          setTripFilter("all");
                          setTripSort("recent");
                        }}
                        fullWidth
                      />
                    </NeumoSurface>
                  ) : (
                    <NeumoSurface
                      variant="inset"
                      tone="surface"
                      radius={NeumoTokens.radius.lg}
                      style={styles.emptyState}
                    >
                      <Text style={styles.emptyTitle}>
                        Create your first trip
                      </Text>
                      <Text style={styles.emptyText}>
                        Add friends and split expenses in minutes.
                      </Text>
                      <DibbyButton
                        title="Create Trip"
                        onPress={() => navigation.navigate("TripWizard")}
                        fullWidth
                      />
                      <NeumoPressable
                        variant="flat"
                        tone="base"
                        onPress={() => setShowHowItWorks(true)}
                        style={styles.howItWorksButton}
                      >
                        <Text style={styles.howItWorksText}>
                          How it works (30 sec)
                        </Text>
                      </NeumoPressable>
                    </NeumoSurface>
                  )
                }
                renderItem={renderTripItem}
              />
            </ScreenState>
          </View>
        )}
      </SafeAreaView>
      <Modal
        transparent
        animationType="fade"
        visible={showHowItWorks}
        onRequestClose={() => setShowHowItWorks(false)}
      >
        <View style={styles.modalOverlay}>
          <NeumoSurface
            variant="raised"
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
    grid: {
      flex: 1,
      display: "flex",
      paddingHorizontal: 16,
    },
    list: {
      overflow: "visible",
    },
    listContent: {
      paddingHorizontal: NeumoTokens.spacing.xs,
      paddingTop: NeumoTokens.spacing.xs,
      paddingBottom: FloatingTabBar.spacer,
      overflow: "visible",
    },
    listHeader: {
      gap: 12,
      marginBottom: 12,
    },
    hero: {
      marginBottom: 16,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.lg,
      fontWeight: Typography.weight.bold as any,
      marginBottom: 8,
    },
    heroStats: {
      marginTop: 4,
    },
    pendingRequests: {
      gap: 10,
      marginBottom: 4,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
    },
    emptyState: {
      marginVertical: 24,
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
      ...(Platform.OS === "web" ? { boxShadow: "none" } : {}),
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
  });
