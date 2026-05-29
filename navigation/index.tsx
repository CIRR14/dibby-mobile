/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  CommonActions,
  NavigationContainer,
  useNavigation,
  useNavigationState,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import { Platform, Pressable, Text, View } from "react-native";

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
import PdfScreen from "../screens/PdfScreen";
import { VerifyEmail } from "../screens/VerifyEmail";
import CreateTrip from "../components/CreateTrip";
import { Profile } from "../screens/Profile";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlus, faSuitcase, faUser } from "@fortawesome/free-solid-svg-icons";
import { FloatingTabBar, NeumoTokens } from "../constants/Neumo";
import useAppTheme from "../hooks/useAppTheme";
import { useUser, useUserBootstrap } from "../hooks/useUser";
import DibbyLoading from "../components/DibbyLoading";
import DibbyVersion from "../components/DibbyVersion";
import PrivacyPolicy from "../screens/PrivacyPolicy";
import AccountDeletion from "../screens/AccountDeletion";
import { useTheme } from "../context/ThemeContext";
import TripWizard from "../screens/TripWizard";
import { changeOpacity } from "../helpers/GenerateColor";

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
  useUserBootstrap();
  const { loggedInUser, authReady, profileReady, profileStatus } = useUser();
  const needsEmailVerification = Boolean(
    loggedInUser && !loggedInUser.emailVerified,
  );
  const needsProfile =
    loggedInUser && !needsEmailVerification && profileStatus !== "complete";

  if (!authReady || (loggedInUser && !needsEmailVerification && !profileReady)) {
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
      key={`${loggedInUser ? "user" : "guest"}-${needsEmailVerification ? "verify" : "no-verify"}-${needsProfile ? "needs-profile" : "profile-complete"}`}
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
      {!loggedInUser && (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false, title: "Login" }}
        />
      )}
      {loggedInUser && (
        <>
          <Stack.Screen
            name="VerifyEmail"
            component={VerifyEmail}
            options={{ headerShown: false, title: "Verify Email" }}
          />
          <Stack.Screen
            name="CreateProfile"
            component={CreateProfile}
            options={{ headerShown: false, title: "Create Profile" }}
          />
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
        marginTop: -NeumoTokens.spacing.lg - 2,
      }}
    >
      <Pressable
        onPress={handleAddPress}
        style={{
          width: 60,
          height: 60,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 30,
          backgroundColor: colors.primary.background,
        }}
      >
        <FontAwesomeIcon icon={faPlus} size={20} color={colors.primary.text} />
      </Pressable>
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
      sceneContainerStyle={{
        backgroundColor: colors.background.default,
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          height: FloatingTabBar.height + 4,
          paddingBottom: NeumoTokens.spacing.sm,
          paddingTop: NeumoTokens.spacing.xs,
          position: "absolute",
          left: FloatingTabBar.inset,
          right: FloatingTabBar.inset,
          bottom: FloatingTabBar.inset,
          borderRadius: NeumoTokens.radius.xl,
          shadowOpacity: 0,
          elevation: 0,
          overflow: "visible",
        },
        tabBarBackground: () => (
          <View
            pointerEvents="none"
            style={{
              flex: 1,
              borderRadius: NeumoTokens.radius.xl,
              overflow: "hidden",
              ...(Platform.OS === "web"
                ? ({
                    backdropFilter: "blur(24px) saturate(150%)",
                    WebkitBackdropFilter: "blur(24px) saturate(150%)",
                  } as any)
                : {}),
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: changeOpacity(colors.surfaceGlassStrong, 0.58),
              }}
            />
          </View>
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
        options={{
          title: "Trips",
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon icon={faSuitcase} size={18} color={color} />
          ),
        }}
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
