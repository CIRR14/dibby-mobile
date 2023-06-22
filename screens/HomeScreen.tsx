import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

import { useNavigation } from "@react-navigation/native";
import { useUser } from "../hooks/useUser";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import TopBar from "../components/TopBar";

const numColumns = 2;

const HomeScreen = () => {
  const navigation = useNavigation();
  const { username, loggedInUser, photoURL, setUsername, setPhotoURL } =
    useUser();

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

  return (
    <SafeAreaView style={styles.topContainer}>
      <TopBar title="Home" />
      <View style={styles.grid}>
        <FlatList
          key={numColumns}
          data={[
            1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 10, 11, 12, 13, 14, 15, 16, 17, 18,
            19, 20,
          ]}
          renderItem={({ item }) => <Card add />}
          keyExtractor={(item) => item.toString()}
          numColumns={numColumns}
        ></FlatList>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  topContainer: {
    flex: 1,
    // justifyContent: "center",
    // alignItems: "center",
  },
  grid: {
    flex: 1,
    display: "flex",
    // justifyContent: "space-evenly",
    // alignContent: "stretch",
    // flexDirection: "row",
    // flexWrap: "wrap",
    // alignItems: "flex-start",
    margin: 16,
  },
});
