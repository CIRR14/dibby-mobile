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
  helperText?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
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
  helperText,
  autoCapitalize = "none",
}) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const hasError = Boolean(errorText);
  return (
    <View style={styles.inputContainer}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <NeumoSurface
        variant="inset"
        radius={NeumoTokens.radius.md}
        padding={0}
        style={styles.inputSurface}
      >
        <Input
          autoCapitalize={autoCapitalize}
          inputStyle={styles.input}
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
          renderErrorMessage={hasError}
          errorStyle={styles.errorText}
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
      {helperText && !hasError ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

export default DibbyInput;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    inputContainer: {},
    inputOuterContainer: {
      paddingHorizontal: 0,
      paddingVertical: 0,
      marginBottom: 0,
      minHeight: NeumoTokens.touch.minTarget,
    },
    inputInnerContainer: {
      borderBottomWidth: 0,
      minHeight: NeumoTokens.touch.minTarget,
      paddingHorizontal: 12,
      paddingVertical: 0,
      alignItems: "center",
      marginBottom: 0,
    },
    leftIconContainer: {
      marginRight: 6,
      alignSelf: "center",
    },
    inputLabel: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      textAlign: "left",
      marginBottom: 6,
    },
    inputSurface: {
      backgroundColor: colors.surfaceAlt,
    },
    input: {
      backgroundColor: "transparent",
      color: colors.textPrimary,
      paddingHorizontal: 6,
      paddingVertical: 0,
      marginVertical: 0,
      borderRadius: NeumoTokens.radius.md,
      fontSize: Typography.size.md,
      lineHeight: Typography.size.md * Typography.lineHeight.tight,
      textAlignVertical: "center",
      includeFontPadding: false,
    },
    errorText: {
      color: colors.danger.background,
      fontSize: Typography.size.xs,
      marginTop: 6,
      marginHorizontal: 4,
    },
    helperText: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      marginTop: 6,
      marginHorizontal: 4,
    },
  });
