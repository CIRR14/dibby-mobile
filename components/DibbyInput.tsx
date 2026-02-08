import React from "react";
import {
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  StyleSheet,
  View,
  Text,
} from "react-native";
import { ThemeColors } from "../constants/Colors";
import { Input } from "@rneui/themed";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faAt,
  faDollarSign,
  faPercentage,
} from "@fortawesome/free-solid-svg-icons";
import NeumoSurface from "./NeumoSurface";
import { NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";

interface IDibbyInputProps {
  placeholder: string;
  value: string;
  onChangeText: (value: any) => void;

  errorText?: string;
  money?: boolean;
  percentage?: boolean;
  username?: boolean;
  label?: string;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  keyboardType?: KeyboardTypeOptions;
  clearButtonMode?: "always" | "never" | "while-editing" | "unless-editing";
  disabled?: boolean;
  secureTextEntry?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  valid?: boolean;
  clearTextOnFocus?: boolean;
  maxLength?: number;
}

const DibbyInput: React.FC<IDibbyInputProps> = ({
  placeholder,
  value,
  onChangeText,
  label,
  money,
  percentage,
  username,
  onBlur = () => {},
  onSubmitEditing = () => {},
  keyboardType = "default",
  clearButtonMode = "always",
  secureTextEntry,
  disabled,
  returnKeyType = "next",
  errorText,
  valid,
  clearTextOnFocus = false,
  maxLength,
}) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const errorStyle = errorText ? styles.errorText : styles.errorTextHidden;
  return (
    <View style={styles.inputContainer}>
      {label && <Text style={styles.inputLabel}> {label} </Text>}
      <NeumoSurface
        variant="flat"
        radius={NeumoTokens.radius.md}
        padding={0}
        style={styles.inputSurface}
      >
        <Input
          autoCapitalize="words"
          style={styles.input}
          placeholder={placeholder}
          keyboardType={keyboardType}
          value={value}
          maxLength={maxLength}
          onChangeText={onChangeText}
          onBlur={onBlur}
          clearButtonMode={clearButtonMode}
          secureTextEntry={secureTextEntry}
          placeholderTextColor={colors.textSecondary}
          disabled={disabled}
          clearTextOnFocus={clearTextOnFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          containerStyle={styles.inputOuterContainer}
          inputContainerStyle={styles.inputInnerContainer}
          underlineColorAndroid={"transparent"}
          leftIconContainerStyle={styles.leftIconContainer}
          errorMessage={errorText}
          errorStyle={errorStyle}
          leftIcon={
            (money || username || percentage) && (
              <FontAwesomeIcon
                icon={money ? faDollarSign : percentage ? faPercentage : faAt}
                size={16}
                color={
                  errorText
                    ? colors.danger.button
                    : valid
                      ? colors.success.background
                      : colors.textPrimary
                }
              />
            )
          }
        />
      </NeumoSurface>
    </View>
  );
};

export default DibbyInput;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    inputContainer: {
      // minWidth: "80%",
    },
    inputOuterContainer: {
      paddingHorizontal: 0,
      paddingVertical: 0,
      marginBottom: 0,
    },
    inputInnerContainer: {
      borderBottomWidth: 0,
      paddingVertical: 0,
      minHeight: 44,
      alignItems: "center",
    },
    leftIconContainer: {
      marginRight: 8,
      alignSelf: "center",
    },
    inputLabel: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      textAlign: "left",
      marginBottom: 8,
    },
    inputSurface: {
      backgroundColor: colors.surfaceAlt,
    },
    input: {
      backgroundColor: "transparent",
      color: colors.textPrimary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: NeumoTokens.radius.md,
      fontSize: Typography.size.md,
      lineHeight: Typography.size.md * 1.2,
      textAlignVertical: "center",
    },
    errorText: {
      color: colors.danger.background,
      marginBottom: 8,
      alignSelf: "flex-end",
      fontSize: Typography.size.xs,
    },
    errorTextHidden: {
      height: 0,
      marginBottom: 0,
    },
  });
