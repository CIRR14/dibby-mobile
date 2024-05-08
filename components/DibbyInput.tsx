import React from "react";
import {
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  StyleSheet,
  View,
  Text,
} from "react-native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useTheme } from "@react-navigation/native";
import { Input } from "@rneui/themed";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faAt,
  faDollarSign,
  faPercentage,
} from "@fortawesome/free-solid-svg-icons";

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
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors);
  return (
    <View style={styles.inputContainer}>
      {label && <Text style={styles.inputLabel}> {label} </Text>}
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
        placeholderTextColor={colors.disabled.text}
        disabled={disabled}
        clearTextOnFocus={clearTextOnFocus}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        inputContainerStyle={{ borderBottomWidth: 0 }}
        underlineColorAndroid={"transparent"}
        leftIconContainerStyle={{ marginRight: 8 }}
        errorMessage={errorText}
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
                  : colors.background.text
              }
            />
          )
        }
      />
    </View>
  );
};

export default DibbyInput;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    inputContainer: {
      // minWidth: "80%",
    },
    inputLabel: {
      color: colors.input.text,
      fontSize: 16,
      textAlign: "left",
      marginBottom: 12,
    },
    input: {
      backgroundColor: colors.background.paper,
      color: colors.input.text,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    errorText: {
      color: colors.danger.background,
      marginBottom: 8,
      alignSelf: "flex-end",
    },
  });
