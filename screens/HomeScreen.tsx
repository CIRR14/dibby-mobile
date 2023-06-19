import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { useNavigation } from "@react-navigation/native";
import { useUser } from "../hooks/useUser";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import TopBar from "../components/TopBar";

const HomeScreen = () => {
  const navigation = useNavigation();
  const { username, loggedInUser, photoURL, setUsername, setPhotoURL } = useUser();

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
    <SafeAreaView style={styles.container}>
      <TopBar title="Home" onPressBack={() => navigation.navigate("CreateProfile")} />
      <View style={styles.container}>
        <Text style={styles.text}> Profile Picture: {photoURL} </Text>
        <Text style={styles.text}>Email: {loggedInUser?.email}</Text>
        <Text style={styles.text}>DisplayName: {loggedInUser?.displayName} </Text>
      </View>
      <View>
        <Card />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}> Sign Out </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {},
  button: {
    backgroundColor: "#2f95dc",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "grey",
    width: "20%",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
