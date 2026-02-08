import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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
import DibbyLoading from "../components/DibbyLoading";
import { numberWithCommas } from "../helpers/AppHelpers";
import { DibbyProfileCard } from "../components/DibbyProfileCard";
import { timestampToString } from "../helpers/TypeHelpers";
import { DibbySearchUsername } from "../components/DibbySearchUsername";
import {
  addDibbyFriends,
  onAcceptDibbyFriend,
  onRejectDibbyFriend,
} from "../helpers/FirebaseHelpers";
import NeumoSurface from "../components/NeumoSurface";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";
import StatsSection from "../components/StatsSection";
import { buildProfileStats, pickStats } from "../helpers/StatsHelpers";

export const Profile = () => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const { dibbyUser } = useUser();
  const [tripsInvolvedIn, setTripsInvolvedIn] = useState<DibbyTrip[]>();
  const [currentFriends, setCurrentFriends] = useState<DibbyUser[]>();
  const [loading, setLoading] = useState<boolean>(true);
  const [addFriendsView, setAddFriendsView] = useState<boolean>(false);
  const [selectedResults, setSelectedResults] = useState<DibbyParticipant[]>(
    [],
  );
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
                <Text style={styles.sectionTitle}>Trips involved in</Text>
                <ScrollView
                  horizontal
                  contentContainerStyle={{
                    gap: 16,
                    width: "100%",
                  }}
                >
                  {tripsInvolvedIn?.map((t) => {
                    return (
                      <DibbyProfileCard
                        key={t.id}
                        title={t.title}
                        subtitle={[
                          `Total: $${t.amount.toString()}`,
                          `Paid: $${t.expenses.reduce((acc, e) => {
                            const usersSpent = e.peopleInExpense.find(
                              (ue) => ue.uid === dibbyUser.uid,
                            )?.amount;
                            return acc + +(usersSpent || 0);
                          }, 0)}`,
                          t.description,
                          timestampToString(t.dateCreated),
                          `Per person Avg: $${numberWithCommas(
                            t.perPersonAverage.toString(),
                          )}`,
                        ]}
                      />
                    );
                  })}
                </ScrollView>
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
            </View>
          )}
        </ScrollView>
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
      paddingBottom: 40,
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
    statsWrap: {
      marginTop: 8,
    },
  });
