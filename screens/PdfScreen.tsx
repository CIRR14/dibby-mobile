import React, { useEffect, useState } from "react";
import { StyleSheet, SafeAreaView, useColorScheme } from "react-native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useTheme } from "@react-navigation/native";
import { faClose, faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { DibbyTrip } from "../constants/DibbyTypes";
import { ITransactionResponse, calculateTrip } from "../helpers/DibbyLogic";
import { generateHTML } from "../constants/PdfTemplate";
import { useNavigation } from "@react-navigation/core";
import { useUser } from "../hooks/useUser";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../firebase";
import TopBar from "../components/TopBar";
import DibbyButton from "../components/DibbyButton";
import { LinearGradient } from "expo-linear-gradient";

const PdfScreen = ({ route }: any) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation();
  const { tripId } = route.params;
  const { dibbyUser } = useUser();

  const [calculatedTrip, setCalculatedTrip] = useState<ITransactionResponse>();
  const [currentTrip, setCurrentTrip] = useState<DibbyTrip>();

  useEffect(() => {
    if (dibbyUser?.uid) {
      const unsub = onSnapshot(doc(db, dibbyUser.uid, tripId), (doc) => {
        const newData: DibbyTrip = { ...(doc.data() as DibbyTrip), id: doc.id };
        setCurrentTrip(newData);
      });

      return () => {
        unsub();
      };
    }
  }, [dibbyUser, tripId]);

  useEffect(() => {
    if (dibbyUser?.uid && currentTrip) {
      const copyOfTrip = JSON.parse(JSON.stringify(currentTrip));
      const newCalculatedTrip = calculateTrip(copyOfTrip);
      setCalculatedTrip(newCalculatedTrip);
    }
  }, [dibbyUser, currentTrip]);

  return (
    <LinearGradient
      style={styles.topContainer}
      colors={[...colors.background.gradient]}
    >
      <SafeAreaView style={styles.topContainer}>
        <TopBar
          title={"Summary"}
          leftButton={
            <DibbyButton
              title={
                <FontAwesomeIcon
                  icon={faClose}
                  size={24}
                  color={colors.light.text}
                />
              }
              type="clear"
              onPress={() => navigation.goBack()}
            />
          }
          rightButton={
            <DibbyButton
              title={
                <FontAwesomeIcon
                  icon={faDownload}
                  size={24}
                  color={colors.light.text}
                />
              }
              type="clear"
              onPress={() => {
                try {
                  document.execCommand("print", false, undefined);
                } catch (e) {
                  window.print();
                }
              }}
            />
          }
        />
        {calculatedTrip && currentTrip && (
          <div
            dangerouslySetInnerHTML={{
              __html: generateHTML(calculatedTrip, currentTrip),
            }}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

export default PdfScreen;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      // backgroundColor: colors.light.background,
      margin: 16,
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
