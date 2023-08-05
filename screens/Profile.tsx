import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useTheme } from "@react-navigation/native";
import TopBar from "../components/TopBar";
import DibbyButton from "../components/DibbyButton";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useNavigation } from "@react-navigation/core";
import { useUser } from "../hooks/useUser";
import { DibbyAvatar } from "../components/DibbyAvatars";
import { Divider } from "@rneui/themed";
import {
  faUser,
  faAt,
  faEnvelope,
  faAdd,
  faChevronLeft,
  faSubtract,
} from "@fortawesome/free-solid-svg-icons";

import {
  linearGradientEnd,
  linearGradientStart,
  windowWidth,
} from "../constants/DeviceWidth";
import {
  collection,
  documentId,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import {
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

export const Profile = () => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();
  const { dibbyUser } = useUser();
  const [tripsInvolvedIn, setTripsInvolvedIn] = useState<DibbyTrip[]>();
  const [currentFriends, setCurrentFriends] = useState<DibbyUser[]>();
  const [loading, setLoading] = useState<boolean>(true);
  const [addFriendsView, setAddFriendsView] = useState<boolean>(false);
  const [selectedResults, setSelectedResults] = useState<DibbyParticipant[]>(
    []
  );

  useEffect(() => {
    const tripsExist = dibbyUser?.trips.length && dibbyUser?.trips.length > 0;
    if (dibbyUser?.uid && tripsExist) {
      const q = query(
        collection(db, "trips"),
        where(documentId(), "in", dibbyUser.trips)
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
    }
  }, [dibbyUser]);

  useEffect(() => {
    const friendsExist =
      dibbyUser?.friends.length && dibbyUser?.trips.length > 0;
    if (dibbyUser?.uid && friendsExist) {
      const q = query(
        collection(db, "users"),
        where(documentId(), "in", dibbyUser.friends)
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
    }
  }, [dibbyUser]);

  const onAddFriend = () => {};

  return (
    <LinearGradient
      style={styles.topContainer}
      colors={[...colors.background.gradient]}
    >
      <SafeAreaView style={styles.topContainer}>
        {loading && <DibbyLoading />}
        <TopBar
          title="Profile"
          leftButton={
            <DibbyButton
              type="clear"
              onPress={() => navigation.navigate("Home")}
              title={
                <FontAwesomeIcon
                  icon={faChevronLeft}
                  size={24}
                  color={colors.background.text}
                />
              }
            />
          }
        />
        <ScrollView>
          {dibbyUser && (
            <View style={styles.content}>
              <DibbyProfileCard
                dibbyUser={dibbyUser}
                title={dibbyUser.displayName || ""}
                divider={true}
              />

              <View
                style={{
                  ...styles.container,
                  gap: 16,
                  marginBottom: 24,
                  marginHorizontal: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <Text
                    style={{
                      color: colors.background.text,
                      fontWeight: "300",
                    }}
                  >
                    Friends
                  </Text>
                  <TouchableOpacity
                    onPress={() => setAddFriendsView(!addFriendsView)}
                    style={{
                      height: 32,
                    }}
                  >
                    <FontAwesomeIcon
                      icon={addFriendsView ? faSubtract : faAdd}
                      color={colors.background.text}
                      size={24}
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
                >
                  {currentFriends?.map((u) => {
                    return (
                      <DibbyProfileCard
                        key={u.uid}
                        dibbyUser={u}
                        title={u.displayName || ""}
                        subtitle={[u.username || undefined]}
                      />
                    );
                  })}
                </ScrollView>
              </View>
              <View style={{ gap: 24, marginBottom: 24, marginLeft: 16 }}>
                <Text
                  style={{ color: colors.background.text, fontWeight: "300" }}
                >
                  Trips involved in:
                </Text>
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
                              (ue) => ue.uid === dibbyUser.uid
                            )?.amount;
                            return acc + +(usersSpent || 0);
                          }, 0)}`,
                          t.description,
                          timestampToString(t.dateCreated),
                          `Per person Avg: $${numberWithCommas(
                            t.perPersonAverage.toString()
                          )}`,
                        ]}
                      />
                    );
                  })}
                </ScrollView>
                <View style={{ ...styles.container }}>
                  <Text
                    style={{ color: colors.background.text, fontWeight: "300" }}
                  >
                    Average spent per trip:
                  </Text>
                  <Text style={{ color: colors.background.text }}>
                    $
                    {tripsInvolvedIn &&
                      tripsInvolvedIn.reduce((acc, t) => {
                        return acc + t.perPersonAverage;
                      }, 0) / tripsInvolvedIn.length}
                  </Text>
                </View>
                <View style={{ ...styles.container }}>
                  <Text
                    style={{ color: colors.background.text, fontWeight: "300" }}
                  >
                    Avg money spent per expense:
                  </Text>

                  <Text style={{ color: colors.background.text }}>
                    $
                    {numberWithCommas(
                      (
                        tripsInvolvedIn &&
                        tripsInvolvedIn.reduce((acc, t) => {
                          return (
                            acc +
                            t.expenses.reduce((acc2, e) => {
                              return acc2 + e.perPersonAverage;
                            }, 0)
                          );
                        }, 0) /
                          tripsInvolvedIn.reduce((acc, t) => {
                            return acc + t.expenses.length;
                          }, 0)
                      )?.toString()
                    )}
                  </Text>
                </View>
              </View>
              {/* <View style={styles.mapContainer}>
              <Text
                style={{ color: colors.background.text, fontWeight: "300" }}
              >
                Map of all trips taken
              </Text>
            </View> */}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
    },
    content: {
      margin: 16,
    },
    card: {
      borderColor: colors.dark.background,
      borderWidth: 1,
      borderLeftWidth: 4,
      borderBottomWidth: 4,
      width: "100%",
      alignItems: "center",
      paddingVertical: 40,
      borderRadius: 32,
      flexDirection: "row",
      marginBottom: 24,
    },
    container: {
      alignItems: "center",
    },
  });
