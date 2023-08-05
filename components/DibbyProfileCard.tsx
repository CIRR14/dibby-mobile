import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DibbyParticipant, DibbyUser } from "../constants/DibbyTypes";
import { useTheme } from "@react-navigation/native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { DibbyAvatar } from "./DibbyAvatars";
import { Divider } from "@rneui/themed";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faUser,
  faAt,
  faEnvelope,
  faAdd,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";

export interface IDibbyProfileCardProps {
  title: string;
  dibbyUser?: DibbyUser | DibbyParticipant;
  subtitle?: (string | undefined)[];
  divider?: boolean;
}

export const DibbyProfileCard: React.FC<IDibbyProfileCardProps> = ({
  title,
  dibbyUser,
  subtitle,
  divider,
}) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors);
  return (
    <View style={{ ...styles.card, justifyContent: "space-around" }}>
      <View style={{ gap: 8, alignItems: "center" }}>
        {dibbyUser && (
          <DibbyAvatar
            shadow={false}
            overlap={false}
            height={72}
            item={dibbyUser}
          />
        )}
        <Text style={{ color: colors.background.text }}>{title}</Text>

        {subtitle?.map(
          (s, i) =>
            s && (
              <Text
                key={i}
                style={{ color: colors.background.text, fontWeight: "200" }}
              >
                {s}
              </Text>
            )
        )}
      </View>

      {divider && (
        <>
          <Divider
            orientation="vertical"
            width={1}
            color={colors.background.text}
          />
          <View style={{ gap: 8 }}>
            <Text
              style={{
                color: colors.background.text,
                ...styles.container,
                fontWeight: "300",
              }}
            >
              <FontAwesomeIcon
                icon={faAt}
                color={colors.background.text}
                size={16}
                style={{ marginRight: 16 }}
              />
              {dibbyUser?.username}
            </Text>
            <View style={{ height: 8 }} />
            <Text
              style={{
                color: colors.background.text,
                ...styles.container,
                fontWeight: "300",
              }}
            >
              <FontAwesomeIcon
                icon={faEnvelope}
                color={colors.background.text}
                size={16}
                style={{ marginRight: 16 }}
              />
              {(dibbyUser as DibbyUser)?.email}
            </Text>
          </View>
        </>
      )}
    </View>
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
      alignItems: "center",
      paddingVertical: 40,
      paddingHorizontal: 24,
      borderRadius: 32,
      flexDirection: "row",
      marginBottom: 24,
    },
    container: {
      alignItems: "center",
    },
  });
