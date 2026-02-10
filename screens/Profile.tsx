import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import { ThemeColors } from "../constants/Colors";
import TopBar from "../components/TopBar";
import DibbyButton from "../components/DibbyButton";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useUser } from "../hooks/useUser";
import { faAdd, faSubtract } from "@fortawesome/free-solid-svg-icons";

import { wideScreen, windowWidth } from "../constants/DeviceWidth";
import {
  Timestamp,
  collection,
  documentId,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import {
  DibbyFriend,
  DibbyParticipant,
  DibbyTrip,
  DibbyUser,
} from "../constants/DibbyTypes";
import { db } from "../firebase";
import {
  appleProvider,
  auth,
  facebookProvider,
  googleProvider,
} from "../firebase";
import DibbyLoading from "../components/DibbyLoading";
import { numberWithCommas } from "../helpers/AppHelpers";
import { DibbyProfileCard } from "../components/DibbyProfileCard";
import { timestampToString } from "../helpers/TypeHelpers";
import { DibbySearchUsername } from "../components/DibbySearchUsername";
import {
  addDibbyFriends,
  deleteDibbyUserData,
  onAcceptDibbyFriend,
  onRejectDibbyFriend,
} from "../helpers/FirebaseHelpers";
import NeumoSurface from "../components/NeumoSurface";
import NeumoPressable from "../components/NeumoPressable";
import { FloatingTabBar, NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";
import StatsSection from "../components/StatsSection";
import { buildProfileStats, pickStats } from "../helpers/StatsHelpers";
import { useNavigation } from "@react-navigation/native";
import DibbyInput from "../components/DibbyInput";
import { useTheme } from "../context/ThemeContext";
import ScreenState, { ScreenStateStatus } from "../components/ScreenState";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";
import DibbyVersion from "../components/DibbyVersion";

export const Profile = () => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation<any>();
  const { themeMode, setThemeMode } = useTheme();
  const { dibbyUser } = useUser();
  const [tripsInvolvedIn, setTripsInvolvedIn] = useState<DibbyTrip[]>();
  const [currentFriends, setCurrentFriends] = useState<DibbyUser[]>();
  const [loading, setLoading] = useState<boolean>(true);
  const [addFriendsView, setAddFriendsView] = useState<boolean>(false);
  const [selectedResults, setSelectedResults] = useState<DibbyParticipant[]>(
    [],
  );
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const profileStats = useMemo(
    () =>
      buildProfileStats(
        tripsInvolvedIn || [],
        dibbyUser?.uid,
        currentFriends?.length || 0,
      ),
    [tripsInvolvedIn, dibbyUser?.uid, currentFriends?.length],
  );
  const profileCompactStats = useMemo(
    () =>
      pickStats(profileStats, [
        "profile-trips",
        "profile-friends",
        "profile-total-spent",
        "profile-net",
      ]),
    [profileStats],
  );
  const hasPasswordProvider = Boolean(
    auth.currentUser?.providerData?.some((p) => p.providerId === "password"),
  );
  const profileStatus: ScreenStateStatus = dibbyUser ? "ready" : "empty";

  const resetDeleteState = () => {
    setDeleteError(null);
    setDeletePassword("");
  };

  const openDeleteModal = () => {
    resetDeleteState();
    setDeleteModalVisible(true);
  };

  const reauthenticateUser = async () => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user.");
    }
    if (hasPasswordProvider) {
      if (!deletePassword || !user.email) {
        setDeleteError("Enter your password to continue.");
        return false;
      }
      const credential = EmailAuthProvider.credential(
        user.email,
        deletePassword,
      );
      await reauthenticateWithCredential(user, credential);
      return true;
    }

    if (Platform.OS === "web") {
      const providerId =
        user.providerData.find((p) => p.providerId !== "password")
          ?.providerId || "";
      const provider =
        providerId === "google.com"
          ? googleProvider
          : providerId === "facebook.com"
            ? facebookProvider
            : providerId === "apple.com"
              ? appleProvider
              : null;

      if (provider) {
        await reauthenticateWithPopup(user, provider);
        return true;
      }
    }

    setDeleteError("Please log out and log back in, then try deleting again.");
    return false;
  };

  const confirmDeleteAccount = async () => {
    if (!dibbyUser || !auth.currentUser) {
      return;
    }
    setLoading(true);
    try {
      const reauthed = await reauthenticateUser();
      if (!reauthed) {
        setLoading(false);
        return;
      }
      await deleteDibbyUserData(dibbyUser);
      await deleteUser(auth.currentUser);
      setDeleteModalVisible(false);
      resetDeleteState();
      setLoading(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (err: any) {
      setLoading(false);
      if (err?.code === "auth/requires-recent-login") {
        setDeleteError(
          "Please log out and log back in, then try deleting again.",
        );
        return;
      }
      setDeleteError("Unable to delete account right now. Try again later.");
      console.log(err);
    }
  };

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
        setTripsInvolvedIn(trips);
      });

      return () => unsubscribe();
    }
    if (!tripsExist) {
      setLoading(false);
      setTripsInvolvedIn([]);
    }
  }, [dibbyUser, setLoading]);

  useEffect(() => {
    const friendsExist = dibbyUser?.friends.length;
    if (dibbyUser?.uid && friendsExist) {
      const q = query(
        collection(db, "users"),
        where(
          documentId(),
          "in",
          dibbyUser.friends.map((f) => f.uid),
        ),
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const friends: DibbyUser[] = [];
        querySnapshot.forEach((doc) => {
          friends.push(doc.data() as DibbyUser);
        });
        setCurrentFriends(friends);
      });

      return () => unsubscribe();
    }
    if (!friendsExist) {
      setLoading(false);
      setCurrentFriends([]);
    }
  }, [dibbyUser, setLoading]);

  const onAddFriend = async () => {
    if (dibbyUser) {
      setLoading(true);
      const addFriends: DibbyFriend[] = selectedResults.map((r) => {
        return {
          uid: r.uid,
          displayName: r.name || "",
          dateFriendAdded: Timestamp.now(),
          requestPending: true,
          requestedBy: dibbyUser.uid,
        };
      });
      await addDibbyFriends(dibbyUser, addFriends).finally(() => {
        setLoading(false);
        setAddFriendsView(false);
        setSelectedResults([]);
      });
    }
  };

  const actionTaken = async (
    action: "accept" | "reject",
    friend: DibbyUser,
  ) => {
    if (dibbyUser) {
      if (action === "accept") {
        setLoading(true);
        await onAcceptDibbyFriend(dibbyUser, friend);
        setLoading(false);
      } else if (action === "reject") {
        setLoading(true);
        await onRejectDibbyFriend(dibbyUser, friend);
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.topContainer}>
      <SafeAreaView style={styles.topContainer}>
        {loading && <DibbyLoading />}
        <TopBar title="Profile" />
        <ScreenState
          status={profileStatus}
          title="Profile unavailable"
          description="We couldn’t load your profile yet."
          actionLabel="Back to trips"
          onAction={() => navigation.navigate("Home")}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {dibbyUser && (
              <View style={styles.content}>
                <DibbyProfileCard
                  dibbyUser={dibbyUser}
                  title={dibbyUser.displayName || ""}
                  divider={true}
                />

                <NeumoSurface
                  variant="raised"
                  tone="surface"
                  radius={NeumoTokens.radius.lg}
                  style={styles.sectionCard}
                >
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Friends</Text>
                    <TouchableOpacity
                      onPress={() => setAddFriendsView(!addFriendsView)}
                      style={{ height: 32 }}
                    >
                      <FontAwesomeIcon
                        icon={addFriendsView ? faSubtract : faAdd}
                        color={colors.textPrimary}
                        size={20}
                      />
                    </TouchableOpacity>
                  </View>
                  {addFriendsView && (
                    <View style={{ width: windowWidth - 64 }}>
                      <DibbySearchUsername
                        results={(res) => setSelectedResults(res)}
                        selectLoggedInUser={false}
                        useDefaultSuggestion={false}
                      />
                      <DibbyButton
                        disabled={selectedResults.length < 1}
                        title={`Add Friend`}
                        onPress={onAddFriend}
                      />
                    </View>
                  )}
                  <ScrollView
                    horizontal
                    contentContainerStyle={{
                      gap: 16,
                      width: "100%",
                    }}
                    style={{ width: "100%" }}
                  >
                    {currentFriends?.map((u) => {
                      return (
                        <DibbyProfileCard
                          key={u.uid}
                          dibbyUser={u}
                          title={
                            u.displayName ||
                            dibbyUser.friends.find((f) => f.uid === u.uid)
                              ?.displayName ||
                            ""
                          }
                          pending={
                            dibbyUser.friends.find((f) => f.uid === u.uid)
                              ?.requestPending
                          }
                          subtitle={[`@${u.username}` || undefined]}
                          actionNeeded={
                            dibbyUser.friends.find((f) => f.uid === u.uid)
                              ?.requestedBy !== dibbyUser.uid
                          }
                          actionTaken={(action) => actionTaken(action, u)}
                        />
                      );
                    })}
                    {(currentFriends?.length === 0 || !currentFriends) && (
                      <View style={{ justifyContent: "center" }}>
                        <Text style={{ color: colors.textSecondary }}>
                          No friends yet.
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </NeumoSurface>

                <NeumoSurface
                  variant="raised"
                  tone="surface"
                  radius={NeumoTokens.radius.lg}
                  style={styles.sectionCard}
                >
                  <View style={styles.statsWrap}>
                    <StatsSection
                      title="Your stats"
                      compactItems={profileCompactStats}
                      fullItems={profileStats}
                      compactColumns={2}
                      expandedColumns={wideScreen ? 3 : 2}
                    />
                  </View>
                </NeumoSurface>

                <NeumoSurface
                  variant="raised"
                  tone="surface"
                  radius={NeumoTokens.radius.lg}
                  style={styles.sectionCard}
                >
                  <Text style={styles.sectionTitle}>Account</Text>
                  <View style={styles.themeBlock}>
                    <Text style={styles.sectionSubtitle}>Theme</Text>
                    <NeumoSurface
                      variant="inset"
                      tone="surface"
                      radius={NeumoTokens.radius.pill}
                      padding={NeumoTokens.control.pill.padding}
                      style={styles.themeToggle}
                    >
                      <View style={styles.themeToggleRow}>
                        <NeumoPressable
                          variant={themeMode === "light" ? "raised" : "flat"}
                          tone="surface"
                          onPress={() => setThemeMode("light")}
                          radius={NeumoTokens.radius.pill}
                          padding={NeumoTokens.control.pill.padding}
                          containerStyle={styles.themeToggleButton}
                          style={styles.themeToggleButtonSurface}
                        >
                          <Text
                            style={[
                              styles.themeToggleText,
                              themeMode === "light" &&
                                styles.themeToggleTextActive,
                            ]}
                          >
                            Light
                          </Text>
                        </NeumoPressable>
                        <NeumoPressable
                          variant={themeMode === "dark" ? "raised" : "flat"}
                          tone="surface"
                          onPress={() => setThemeMode("dark")}
                          radius={NeumoTokens.radius.pill}
                          padding={NeumoTokens.control.pill.padding}
                          containerStyle={styles.themeToggleButton}
                          style={styles.themeToggleButtonSurface}
                        >
                          <Text
                            style={[
                              styles.themeToggleText,
                              themeMode === "dark" &&
                                styles.themeToggleTextActive,
                            ]}
                          >
                            Dark
                          </Text>
                        </NeumoPressable>
                      </View>
                    </NeumoSurface>
                  </View>
                  <DibbyButton
                    title="Privacy policy"
                    type="clear"
                    onPress={() => navigation.navigate("PrivacyPolicy")}
                  />
                  <DibbyButton
                    title="Account deletion info"
                    type="clear"
                    onPress={() => navigation.navigate("AccountDeletion")}
                  />
                  <DibbyButton
                    type={"danger"}
                    title="Delete account"
                    onPress={openDeleteModal}
                  />
                </NeumoSurface>
              </View>
            )}
            <Modal
              transparent
              visible={deleteModalVisible}
              animationType="fade"
              onRequestClose={() => setDeleteModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <NeumoSurface
                  variant="raised"
                  tone="surface"
                  radius={NeumoTokens.radius.lg}
                  style={styles.modalCard}
                >
                  <Text style={styles.modalTitle}>Delete your account?</Text>
                  <Text style={styles.modalText}>
                    This permanently removes your profile data and anonymizes
                    your participation in shared trips. This action cannot be
                    undone.
                  </Text>
                  {hasPasswordProvider && (
                    <DibbyInput
                      placeholder="Password"
                      secureTextEntry
                      value={deletePassword}
                      onChangeText={setDeletePassword}
                    />
                  )}
                  {deleteError && (
                    <Text style={styles.modalError}>{deleteError}</Text>
                  )}
                  <View style={styles.modalActions}>
                    <DibbyButton
                      title="Cancel"
                      type="clear"
                      onPress={() => setDeleteModalVisible(false)}
                    />
                    <DibbyButton
                      title="Delete account"
                      onPress={confirmDeleteAccount}
                      type="danger"
                    />
                  </View>
                </NeumoSurface>
              </View>
            </Modal>
          </ScrollView>
        </ScreenState>
        <DibbyVersion bottom={2} />
      </SafeAreaView>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    content: {
      margin: 16,
      gap: 16,
    },
    scrollContent: {
      paddingBottom: FloatingTabBar.spacer,
    },
    sectionCard: {
      gap: 12,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
    },
    sectionSubtitle: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.medium as any,
    },
    statsWrap: {
      marginTop: 8,
    },
    themeBlock: {
      gap: 8,
    },
    themeToggle: {
      width: "100%",
    },
    themeToggleRow: {
      flexDirection: "row",
      gap: 8,
    },
    themeToggleButton: {
      flex: 1,
    },
    themeToggleButtonSurface: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: NeumoTokens.control.pill.minHeight,
    },
    themeToggleText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
    themeToggleTextActive: {
      color: colors.textPrimary,
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
      gap: 12,
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
      lineHeight: 20,
    },
    modalError: {
      color: colors.danger.button,
      fontSize: Typography.size.sm,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
  });
