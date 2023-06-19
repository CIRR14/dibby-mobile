import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faBackward, faChevronLeft } from "@fortawesome/free-solid-svg-icons";

interface ITopBarProps {
  title: string;
  onPressBack: () => void;
}

const TopBar: React.FC<ITopBarProps> = ({ title, onPressBack }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPressBack} style={[styles.innerContainer, styles.backButton]}>
        <FontAwesomeIcon icon={faChevronLeft} size={12} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <View style={styles.innerContainer}>
        <Text style={styles.title}> {title} </Text>
      </View>
      <View style={styles.innerContainer}>
        <Text> </Text>
      </View>
    </View>
  );
};

export default TopBar;

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    height: 64,
    backgroundColor: "#2f95dc",
    padding: 12,
  },
  title: {
    color: "white",
    fontSize: 22,
  },
  innerContainer: {
    width: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    flexDirection: "row",
    borderRadius: 8,
    height: 32,
    backgroundColor: "#ccc",
  },
  backText: {
    color: "#000",
  },
});
