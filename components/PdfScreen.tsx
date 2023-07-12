import React from "react";
import {
  StyleSheet,
  SafeAreaView,
  View,
  useColorScheme,
  Text,
  TouchableOpacity,
} from "react-native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useTheme } from "@react-navigation/native";
import { faClose, faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Trip } from "../constants/DibbyTypes";
import { ITransactionResponse } from "../helpers/DibbyLogic";
import { generateHTML } from "../constants/PdfTemplate";
import { ScrollView } from "react-native-gesture-handler";

interface IPDFScreenProps {
  calculatedTrip: ITransactionResponse;
  tripInfo: Trip;
  onPressBack: () => void;
  printToFile: () => void;
}

const PdfScreen: React.FC<IPDFScreenProps> = ({
  calculatedTrip,
  tripInfo,
  onPressBack,
  printToFile,
}) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const theme = useColorScheme();
  const styles = makeStyles(colors as unknown as ThemeColors);

  return (
    <SafeAreaView style={styles.topContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onPressBack}>
          <FontAwesomeIcon icon={faClose} size={24} color={colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Summary</Text>
        <TouchableOpacity onPress={printToFile}>
          <FontAwesomeIcon
            icon={faDownload}
            size={24}
            style={{ color: colors.light.text }}
          />
        </TouchableOpacity>
      </View>
      <ScrollView>
        <View style={styles.content}>
          <div
            dangerouslySetInnerHTML={{
              __html: generateHTML(calculatedTrip, tripInfo),
            }}
          ></div>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PdfScreen;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      backgroundColor: colors.light.background,
      // height: "100%",
      flex: 1,
    },
    header: {
      display: "flex",
      margin: 16,
      justifyContent: "space-between",
      flexDirection: "row",
    },
    title: {
      color: colors.light.text,
      fontSize: 22,
      width: 120,
    },
    content: {
      backgroundColor: colors.light.background,
      margin: 16,
      display: "flex",
    },
  });
