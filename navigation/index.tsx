/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  CommonActions,
  getFocusedRouteNameFromRoute,
  NavigationContainer,
  useNavigation,
  useNavigationState,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import { Text, View } from "react-native";

import { CustomDarkTheme, CustomLightTheme } from "../constants/Colors";
import CreateProfile from "../screens/CreateProfile";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import NotFoundScreen from "../screens/NotFoundScreen";
import {
  ProfileStackParamList,
  RootStackParamList,
  RootTabParamList,
  TripsStackParamList,
} from "../types";
import LinkingConfiguration from "./LinkingConfiguration";
import ViewTrip from "../screens/ViewTrip";
import ViewExpense from "../screens/ViewExpense";
import Payments from "../screens/Payments";
import AddPayment from "../screens/AddPayment";
import PdfScreen from "../screens/PdfScreen";
import { VerifyEmail } from "../screens/VerifyEmail";
import CreateTrip from "../components/CreateTrip";
import { Profile } from "../screens/Profile";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlus, faSuitcase, faUser } from "@fortawesome/free-solid-svg-icons";
import NeumoPressable from "../components/NeumoPressable";
import { FloatingTabBar, NeumoTokens } from "../constants/Neumo";
import useAppTheme from "../hooks/useAppTheme";
import NeumoSurface from "../components/NeumoSurface";
import { useUser } from "../hooks/useUser";
import DibbyLoading from "../components/DibbyLoading";
import DibbyVersion from "../components/DibbyVersion";
import PrivacyPolicy from "../screens/PrivacyPolicy";
import AccountDeletion from "../screens/AccountDeletion";
import { useTheme } from "../context/ThemeContext";
import TripWizard from "../screens/TripWizard";

export default function Navigation() {
  const { scheme } = useTheme();
  return (
    <NavigationContainer
      linking={LinkingConfiguration}
      theme={scheme === "dark" ? CustomDarkTheme : CustomLightTheme}
      documentTitle={{
        enabled: true,
        formatter: (options, route) => {
          const title = options?.title || route?.name;
          if (!title || title === "Root" || title === "TripsTab") {
            return "Dibby";
          }
          return title;
        },
      }}
      fallback={<Text>Loading...</Text>}
    >
      <RootNavigator />
    </NavigationContainer>
  );
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const Stack = createNativeStackNavigator<RootStackParamList>();
const TripsStack = createNativeStackNavigator<TripsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function RootNavigator() {
  const colors = useAppTheme();
  const { loggedInUser, authReady, profileReady, profileStatus } = useUser();
  const needsEmailVerification = Boolean(
    loggedInUser && !loggedInUser.emailVerified,
  );
  const needsProfile =
    loggedInUser && !needsEmailVerification && profileStatus !== "complete";

  if (!authReady || (loggedInUser && !profileReady)) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background.default,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <DibbyLoading />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={
        loggedInUser
          ? needsEmailVerification
            ? "VerifyEmail"
            : needsProfile
              ? "CreateProfile"
              : "Root"
          : "Login"
      }
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.default },
      }}
    >
      {!loggedInUser ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false, title: "Login" }}
        />
      ) : needsEmailVerification ? (
        <Stack.Screen
          name="VerifyEmail"
          component={VerifyEmail}
          options={{ headerShown: false, title: "Verify Email" }}
        />
      ) : needsProfile ? (
        <Stack.Screen
          name="CreateProfile"
          component={CreateProfile}
          options={{ headerShown: false, title: "Create Profile" }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Root"
            component={BottomTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NotFound"
            component={NotFoundScreen}
            options={{ headerShown: false, title: "Oops!" }}
          />
        </>
      )}
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicy}
        options={{ headerShown: false, title: "Privacy Policy" }}
      />
      <Stack.Screen
        name="AccountDeletion"
        component={AccountDeletion}
        options={{ headerShown: false, title: "Delete Account" }}
      />
    </Stack.Navigator>
  );
}

/**
 * A bottom tab navigator displays tab buttons on the bottom of the display to switch screens.
 * https://reactnavigation.org/docs/bottom-tab-navigator
 */
const BottomTab = createBottomTabNavigator<RootTabParamList>();

const AddActionScreen = () => null;

const getActiveRoute = (state: any): any => {
  if (!state || !state.routes || state.index == null) {
    return undefined;
  }
  let route = state.routes[state.index];
  while (route?.state && route.state.index != null) {
    route = route.state.routes[route.state.index];
  }
  return route;
};

function AddTabButton() {
  const colors = useAppTheme();
  const state = useNavigationState((s) => s);
  const activeRoute = getActiveRoute(state);
  const nav = useNavigation<any>();

  const handleAddPress = () => {
    const name = activeRoute?.name;
    const params = activeRoute?.params || {};

    if (name === "ViewTrip") {
      nav.navigate("TripsTab", {
        screen: "ViewTrip",
        params: { ...params, openAddExpense: Date.now() },
      });
      return;
    }

    if (name === "ViewExpense") {
      nav.navigate("TripsTab", {
        screen: "ViewTrip",
        params: {
          tripId: params.tripId,
          tripName: params.tripName,
          openAddExpense: Date.now(),
        },
      });
      return;
    }

    nav.navigate("TripsTab", { screen: "CreateTrip" });
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginTop: -NeumoTokens.spacing.lg,
      }}
    >
      <NeumoPressable
        onPress={handleAddPress}
        tone="accent"
        variant="raised"
        gradient
        gradientColors={colors.gradient}
        radius={NeumoTokens.radius.pill}
        padding={NeumoTokens.spacing.md}
        style={{
          width: 58,
          height: 58,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FontAwesomeIcon icon={faPlus} size={20} color={colors.primary.text} />
      </NeumoPressable>
    </View>
  );
}

function TripsStackNavigator() {
  const colors = useAppTheme();
  return (
    <TripsStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.default },
      }}
    >
      <TripsStack.Screen name="Home" component={HomeScreen} />
      <TripsStack.Screen name="ViewTrip" component={ViewTrip} />
      <TripsStack.Screen name="ViewExpense" component={ViewExpense} />
      <TripsStack.Screen name="Payments" component={Payments} />
      <TripsStack.Screen name="AddPayment" component={AddPayment} />
      <TripsStack.Screen name="CreateTrip" component={CreateTrip} />
      <TripsStack.Screen name="TripWizard" component={TripWizard} />
      <TripsStack.Screen name="PrintPDF" component={PdfScreen} />
    </TripsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  const colors = useAppTheme();
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.default },
      }}
    >
      <ProfileStack.Screen name="Profile" component={Profile} />
    </ProfileStack.Navigator>
  );
}

function BottomTabNavigator() {
  const colors = useAppTheme();
  return (
    <BottomTab.Navigator
      initialRouteName="TripsTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarHideOnKeyboard: true,
        sceneContainerStyle: {
          backgroundColor: colors.background.default,
        },
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          height: FloatingTabBar.height,
          paddingBottom: NeumoTokens.spacing.sm,
          paddingTop: NeumoTokens.spacing.sm,
          position: "absolute",
          left: FloatingTabBar.inset,
          right: FloatingTabBar.inset,
          bottom: FloatingTabBar.inset,
          borderRadius: NeumoTokens.radius.xl,
        },
        tabBarBackground: () => (
          <NeumoSurface
            variant="raised"
            tone="surface"
            radius={NeumoTokens.radius.xl}
            padding={0}
            style={{ flex: 1 }}
            pointerEvents="none"
          />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <BottomTab.Screen
        name="TripsTab"
        component={TripsStackNavigator}
        options={({ route }) => ({
          title: "Trips",
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon icon={faSuitcase} size={18} color={color} />
          ),
          tabBarStyle: ["Payments", "AddPayment"].includes(
            getFocusedRouteNameFromRoute(route) || "",
          )
            ? { display: "none" }
            : undefined,
        })}
      />
      <BottomTab.Screen
        name="AddAction"
        component={AddActionScreen}
        options={{
          title: "",
          tabBarLabel: "",
          tabBarButton: () => <AddTabButton />,
        }}
      />
      <BottomTab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon icon={faUser} size={18} color={color} />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
}

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
