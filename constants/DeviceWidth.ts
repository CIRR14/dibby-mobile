import { Dimensions } from "react-native";

export const windowWidth = Dimensions.get("window").width;
export const wideScreen = windowWidth > 500;