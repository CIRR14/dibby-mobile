/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */

import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackParamList = {
  Root: NavigatorScreenParams<RootTabParamList> | undefined;
  NotFound: undefined;
  Login: undefined;
  CreateProfile: undefined;
  VerifyEmail: undefined;
  PrivacyPolicy: undefined;
  AccountDeletion: undefined;
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Screen>;

export type RootTabParamList = {
  TripsTab: NavigatorScreenParams<TripsStackParamList> | undefined;
  AddAction: undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type RootTabScreenProps<Screen extends keyof RootTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<RootTabParamList, Screen>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type TripsStackParamList = {
  Home: undefined;
  ViewTrip: {
    tripName: string;
    tripId: string;
    openAddExpense?: boolean | number | string;
  };
  ViewExpense: {
    tripName: string;
    tripId: string;
    expenseId: string;
  };
  Payments: {
    tripName: string;
    tripId: string;
  };
  AddPayment: {
    tripName: string;
    tripId: string;
  };
  CreateTrip: undefined;
  TripWizard: undefined;
  PrintPDF: { tripId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
};

export type TripsStackScreenProps<Screen extends keyof TripsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<TripsStackParamList, Screen>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type ProfileStackScreenProps<
  Screen extends keyof ProfileStackParamList,
> = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, Screen>,
  NativeStackScreenProps<RootStackParamList>
>;
