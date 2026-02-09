/**
 * Learn more about deep linking with React Navigation
 * https://reactnavigation.org/docs/deep-linking
 * https://reactnavigation.org/docs/configuring-links
 */

import { LinkingOptions } from "@react-navigation/native";
import * as Linking from "expo-linking";

import { RootStackParamList } from "../types";

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/")],
  config: {
    screens: {
      Root: {
        screens: {
          TripsTab: {
            screens: {
              Home: "home",
              ViewTrip: "viewTrip",
              ViewExpense: "viewExpense",
              CreateTrip: "createTrip",
              PrintPDF: "printPDF",
            },
          },
          ProfileTab: {
            screens: {
              Profile: "profile",
            },
          },
        },
      },
      Login: "login",
      CreateProfile: "createProfile",
      VerifyEmail: "verifyEmail",
      PrivacyPolicy: "privacy",
      AccountDeletion: "account-delete",
      NotFound: "*",
    },
  },
};

export default linking;
