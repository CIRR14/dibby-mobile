import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DibbyParticipant, DibbyUser } from "../constants/DibbyTypes";
import { useTheme } from "@react-navigation/native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { DibbyAvatar } from "./DibbyAvatars";
import { Divider } from "@rneui/themed";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faAt, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import DibbyButton from "./DibbyButton";

export interface IDibbyProfileCardProps {
  title: string;
  dibbyUser?: DibbyUser | DibbyParticipant;
  subtitle?: (string | undefined)[];
  divider?: boolean;
  pending?: boolean;
  actionNeeded?: boolean;
  actionTaken?: (action: "reject" | "accept") => void;
}

export const DibbyProfileCard: React.FC<IDibbyProfileCardProps> = ({
  title,
  dibbyUser,
  subtitle,
  divider,
  pending,
  actionNeeded,
  actionTaken = () => {},
}) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors);

  return (
    <View
      style={{
        ...styles.card,
        justifyContent: "space-around",
        backgroundColor: pending ? colors.disabled.button : "transparent",
      }}
    >
      <View style={{ gap: 8, alignItems: "center" }}>
        {pending && !actionNeeded && (
          <View
            style={
              {
                // borderRadius: 8,
                // borderColor: colors.background.text,
                // borderWidth: 2,
                // padding: 6,
              }
            }
          >
            <Text style={{ color: colors.background.text }}>
              Request pending
            </Text>
          </View>
        )}
        {dibbyUser && (
          <DibbyAvatar
            shadow={false}
            overlap={false}
            height={72}
            item={dibbyUser}
          />
        )}
        <Text style={{ color: colors.background.text }}>{title}</Text>

        {subtitle
          ?.filter((t) => t)
          .map((s, i) => (
            <View key={i}>
              <Text
                style={{ color: colors.background.text, fontWeight: "200" }}
              >
                {s}
              </Text>
            </View>
          ))}
        {actionNeeded && pending && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 8,
              marginTop: 16,
            }}
          >
            <DibbyButton
              title="ACCEPT"
              onPress={() => {
                actionTaken("accept");
              }}
            />
            <DibbyButton
              type="danger"
              title="REJECT"
              onPress={() => {
                actionTaken("reject");
              }}
            />
          </View>
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
