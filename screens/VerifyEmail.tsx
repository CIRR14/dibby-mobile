import React, { useEffect } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { useUser } from "../hooks/useUser";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Button, Card } from "@rneui/base";
import { CardTitle } from "@rneui/base/dist/Card/Card.Title";
import { CardFeaturedSubtitle } from "@rneui/base/dist/Card/Card.FeaturedSubtitle";
import { LinearGradient } from "expo-linear-gradient";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import {
  faEnvelopeCircleCheck,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { User, reload, sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "../firebase";
import TopBar from "../components/TopBar";
import DibbyButton from "../components/DibbyButton";

export const VerifyEmail = () => {
  const { loggedInUser, dibbyUser } = useUser();
  const navigation = useNavigation();
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors);

  const navigateTo = (userObj: User) => {
    if (userObj.displayName && userObj.emailVerified && dibbyUser) {
      navigation.navigate("Home");
    } else {
      navigation.navigate("CreateProfile");
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (loggedInUser) {
        reload(loggedInUser);
        if (loggedInUser.emailVerified) {
          clearInterval(interval);
          navigateTo(loggedInUser);
        }
      }
    }, 2000);
  }, [loggedInUser]);

  const resendVerificationEmail = async () => {
    if (loggedInUser) {
      await sendEmailVerification(loggedInUser);
    }
  };

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
    <LinearGradient
      style={styles.topContainer}
      colors={[...colors.background.gradient]}
    >
      <SafeAreaView style={styles.topContainer}>
        <TopBar
          title={""}
          leftButton={
            <DibbyButton
              type="clear"
              onPress={handleSignOut}
              title={
                <FontAwesomeIcon
                  icon={faSignOutAlt}
                  size={24}
                  color={colors.background.text}
                />
              }
            />
          }
        />
        <Card
          containerStyle={styles.cardContainer}
          wrapperStyle={{ margin: 16 }}
        >
          <CardTitle
            h4
            h4Style={{
              textAlign: "left",
              fontWeight: "200",
              color: colors.background.text,
            }}
          >
            Verify your email
          </CardTitle>
          <CardFeaturedSubtitle style={{ color: colors.background.text }}>
            Account activation link has been sent to the e-mail address you
            provided
          </CardFeaturedSubtitle>
          <FontAwesomeIcon
            icon={faEnvelopeCircleCheck}
            size={100}
            color={colors.primary.background}
            style={{
              alignSelf: "center",
              margin: 20,
            }}
          />
          <Button
            onPress={resendVerificationEmail}
            title="Didnt get the email? Send it again"
            type="clear"
            titleStyle={{ fontSize: 14, color: colors.primary.background }}
          />
        </Card>
      </SafeAreaView>
    </LinearGradient>
  );
};

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
    },
    cardContainer: {
      borderRadius: 20,
      backgroundColor: colors.background.paper,
      borderWidth: 1,
      borderLeftWidth: 4,
      borderBottomWidth: 4,
      borderColor: colors.dark.background,
    },
  });
