import { Dimensions } from "react-native";

export const windowWidth = Dimensions.get("window").width;
export const wideScreen = windowWidth > 500;

export const linearGradientStart = {x: 0, y: 0.5};
export const linearGradientEnd = {x: 1, y: 0.5};