import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import React from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

import { useNavigation, useTheme } from "@react-navigation/native";
import { useUser } from "../hooks/useUser";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import TopBar from "../components/TopBar";
import { ColorTheme, ThemeColors } from "../constants/Colors";

const numColumns = 2;

const HomeScreen = () => {
  const navigation = useNavigation();
  const { username, loggedInUser, photoURL, setUsername, setPhotoURL } =
    useUser();

  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors);

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
      <TopBar title="Home" signOut={handleSignOut} />
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

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    grid: {
      flex: 1,
      display: "flex",
      margin: 16,
    },
  });
