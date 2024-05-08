import { Divider } from "@rneui/base";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { numberWithCommas, inRange, sumOfValues } from "../helpers/AppHelpers";
import {
  getTransactionString,
  getAmountOfTransactionsString,
  ITransactionResponse,
} from "../helpers/DibbyLogic";
import { useTheme } from "@react-navigation/native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { DibbyTrip } from "../constants/DibbyTypes";
import { LinearGradient } from "expo-linear-gradient";
import { changeOpacity } from "../helpers/GenerateColor";
import {
  linearGradientEnd,
  linearGradientStart,
  windowWidth,
} from "../constants/DeviceWidth";

interface DibbySummary {
  currentTrip: DibbyTrip;
  calculatedTrip: ITransactionResponse;
}
const itemWidth = (windowWidth - 40) / 5;

const DibbySummary: React.FC<DibbySummary> = ({
  currentTrip,
  calculatedTrip,
}) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors);

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: colors.background.paper,
        margin: 16,
        borderRadius: 10,
        borderColor: colors.dark.background,
        borderWidth: 1,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
      }}
    >
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableText, styles.headerText]}>Traveler</Text>
          <Text style={[styles.tableText, styles.headerText]}>Status</Text>
          <Text style={[styles.tableText, styles.headerText]}>Owed</Text>
          <Text style={[styles.tableText, styles.headerText]}>Paid</Text>
        </View>
        <Divider
          color={colors.disabled.button}
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
          }}
        />
        {currentTrip.participants.map((t) => {
          return (
            <View key={t.uid} style={styles.tableRow}>
              <LinearGradient
                colors={[changeOpacity(t.color, 0.7), t.color]}
                start={linearGradientStart}
                end={linearGradientEnd}
                style={{
                  borderRadius: 10,
                  borderColor: colors.background.default,
                  borderWidth: 1,
                }}
              >
                <Text
                  style={{
                    ...styles.tableText,
                    color: colors.background.text,
                    textAlign: "center",
                    margin: 6,
                  }}
                >
                  {t.name}
                </Text>
              </LinearGradient>
              <Text
                style={{
                  ...styles.tableText,
                  color:
                    t.owed > 0
                      ? colors.info.background
                      : t.owed < 0
                      ? colors.danger.button
                      : colors.background.text,
                }}
              >
                {t.owed > 0 ? "is owed" : t.owed < 0 ? "owes" : ""}
              </Text>
              <Text style={styles.tableText}>
                ${numberWithCommas(Math.abs(t.owed).toString())}
              </Text>
              <Text style={styles.tableText}>
                ${numberWithCommas(t.amountPaid.toString())}
              </Text>
            </View>
          );
        })}
        <Divider
          color={colors.disabled.button}
          style={{
            marginBottom: 16,
          }}
        />
        <View style={styles.tableRow}>
          <Text style={[styles.tableText, styles.headerText]}>Total</Text>
          <Text style={[styles.tableText, styles.headerText]}></Text>
          <Text
            style={[
              styles.tableText,
              styles.headerText,
              {
                color: inRange(
                  sumOfValues(currentTrip.participants.map((t) => t.owed)),
                  -0.01,
                  0.01
                )
                  ? colors.success.background
                  : colors.danger.button,
              },
            ]}
          >
            $
            {inRange(
              sumOfValues(
                currentTrip.participants.map((t) => {
                  return t.owed;
                })
              ),
              -0.01,
              0.01
            )
              ? 0
              : sumOfValues(
                  currentTrip.participants.map((t) => {
                    return t.owed;
                  })
                )}
          </Text>
          <Text
            style={[
              styles.tableText,
              styles.headerText,
              {
                color:
                  sumOfValues(
                    currentTrip.participants.map((t) => t.amountPaid)
                  ) === currentTrip.amount
                    ? colors.success.background
                    : colors.danger.button,
              },
            ]}
          >
            $
            {numberWithCommas(
              sumOfValues(
                currentTrip.participants.map((t) => t.amountPaid)
              ).toString()
            )}
          </Text>
        </View>
      </View>

      <View style={{ padding: 16, width: "100%" }}>
        {calculatedTrip.transactions?.map((t, i) => (
          <Text
            style={{
              color: colors.background.text,
              fontSize: 14,
              marginTop: 16,
            }}
            key={i}
          >
            {getTransactionString(t)}
          </Text>
        ))}

        <Text
          numberOfLines={1}
          style={{
            color: colors.background.text,
            fontSize: 14,
            marginVertical: 16,
          }}
        >
          {getAmountOfTransactionsString(
            calculatedTrip.finalNumberOfTransactions
          )}
        </Text>
      </View>
    </View>
  );
};

export default DibbySummary;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    table: {
      display: "flex",
      alignSelf: "stretch",
      marginHorizontal: 16,
    },
    tableRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 20,
      textTransform: "capitalize",
    },
    tableHeader: {
      paddingTop: 16,
    },
    tableText: {
      color: colors.background.text,
      width: itemWidth,
      textAlign: "center",
    },
    headerText: {
      fontWeight: "bold",
    },
  });
