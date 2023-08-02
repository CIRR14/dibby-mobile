/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import { ColorSchemeName, Text } from "react-native";

import { CustomDarkTheme, CustomLightTheme } from "../constants/Colors";
import CreateProfile from "../screens/CreateProfile";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import NotFoundScreen from "../screens/NotFoundScreen";
import { RootStackParamList, RootTabParamList } from "../types";
import LinkingConfiguration from "./LinkingConfiguration";
import ViewTrip from "../screens/ViewTrip";
import ViewExpense from "../screens/ViewExpense";
import ViewTravelers from "../screens/ViewTravelers";
import PdfScreen from "../screens/PdfScreen";
import { VerifyEmail } from "../screens/VerifyEmail";
import CreateTrip from "../components/CreateTrip";

export default function Navigation({
  colorScheme,
}: {
  colorScheme: ColorSchemeName;
}) {
  return (
    <NavigationContainer
      linking={LinkingConfiguration}
      theme={
        colorScheme === "dark"
          ? (CustomDarkTheme as unknown as Theme)
          : (CustomLightTheme as unknown as Theme)
      }
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

function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ route }) => ({
        title: `Dibby - ${route.name}`,
        contentStyle: { backgroundColor: "white" },
      })}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false, title: "Login" }}
      />
      <Stack.Screen
        name="CreateProfile"
        component={CreateProfile}
        options={{ headerShown: false, title: "Create Profile" }}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false, title: "Home" }}
      />
      <Stack.Screen
        name="ViewTrip"
        component={ViewTrip}
        options={{ headerShown: false, title: "View Trip" }}
      />
      <Stack.Screen
        name="ViewExpense"
        component={ViewExpense}
        options={{ headerShown: false, title: "View Expense" }}
      />
      <Stack.Screen
        name="ViewTravelers"
        component={ViewTravelers}
        options={{ headerShown: false, title: "View Travelers" }}
      />
      <Stack.Screen
        name="PrintPDF"
        component={PdfScreen}
        options={{ headerShown: false, title: "Print PDF" }}
      />
      <Stack.Screen
        name="VerifyEmail"
        component={VerifyEmail}
        options={{ headerShown: false, title: "Verify Email" }}
      />
      <Stack.Screen
        name="NotFound"
        component={NotFoundScreen}
        options={{ headerShown: false, title: "Oops!" }}
      />
      {/* <Stack.Group screenOptions={{ presentation: "modal" }}> */}
      <Stack.Screen
        name="CreateTrip"
        component={CreateTrip}
        options={{ headerShown: false, title: "Create Trip" }}
      />
      {/* </Stack.Group> */}
    </Stack.Navigator>
  );
}

/**
 * A bottom tab navigator displays tab buttons on the bottom of the display to switch screens.
 * https://reactnavigation.org/docs/bottom-tab-navigator
 */
const BottomTab = createBottomTabNavigator<RootTabParamList>();

// function BottomTabNavigator() {
//   const colorScheme = useColorScheme();

//   return (
//     <BottomTab.Navigator
//       initialRouteName="TabOne"
//       screenOptions={{
//         tabBarActiveTintColor: Colors[colorScheme].tint,
//       }}
//     >
//       <BottomTab.Screen
//         name="TabOne"
//         component={TabOneScreen}
//         options={({ navigation }: RootTabScreenProps<"TabOne">) => ({
//           title: "Tab One",
//           tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
//           headerRight: () => (
//             <Pressable
//               onPress={() => navigation.navigate("Modal")}
//               style={({ pressed }) => ({
//                 opacity: pressed ? 0.5 : 1,
//               })}
//             >
//               <FontAwesome
//                 name="info-circle"
//                 size={25}
//                 color={Colors[colorScheme].text}
//                 style={{ marginRight: 15 }}
//               />
//             </Pressable>
//           ),
//         })}
//       />
//       <BottomTab.Screen
//         name="TabTwo"
//         component={TabTwoScreen}
//         options={{
//           title: "Tab Two",
//           tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
//         }}
//       />
//     </BottomTab.Navigator>
//   );
// }

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
// function TabBarIcon(props: {
//   name: React.ComponentProps<typeof FontAwesome>["name"];
//   color: string;
// }) {
//   return <FontAwesome size={30} style={{ marginBottom: -3 }} {...props} />;
// }
