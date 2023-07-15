import { StyleSheet } from "react-native";
import { ThemeColors } from "./Colors";

// TODO: Add global styles to use in components

export const buttonStyles = StyleSheet.create({
    primaryButton: {},
    secondaryButton: {},
    outlinedButton: {}
});

export const cardStyles = StyleSheet.create({
    primaryCard: {},
    secondaryCard: {},
    outlinedCard: {},
})

export const TextStyles = StyleSheet.create({
    title: {},
    subtitlte: {},
    description: {},
    text: {},
    caption: {},
})


export const TopContainer = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary.background
    }
})
