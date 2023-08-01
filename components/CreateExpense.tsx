import React, { useEffect } from "react";
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Dimensions,
} from "react-native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useTheme } from "@react-navigation/native";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  DibbySplitMethod,
  DibbySplits,
  DibbyTrip,
  DibbyUser,
} from "../constants/DibbyTypes";
import { Controller, useForm } from "react-hook-form";
import "react-native-get-random-values";
import {
  getInfoFromTravelerId,
  getItemFormatFromTravelerIds,
} from "../helpers/AppHelpers";
import MultiSelect from "react-native-multiple-select";
import RNPickerSelect from "react-native-picker-select";
import { Platform } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { CheckBox } from "@rneui/themed";
import DibbyButton from "./DibbyButton";
import TopBar from "./TopBar";
import DibbyInput from "./DibbyInput";
import { createDibbyExpense } from "../helpers/FirebaseHelpers";

interface ICreateExpenseProps {
  currentUser: DibbyUser;
  tripInfo?: DibbyTrip;
  onPressBack: () => void;
}

export interface CreateExpenseForm {
  title: string;
  description: string;
  amount: string;
  peopleInExpense: string[];
  paidBy: string;
  createdBy: string;
  splitMethod: DibbySplitMethod;
  perPersonAverage: number;

  peopleSplits?: DibbySplits[];
}

const windowWidth = Dimensions.get("window").width;

const numColumns = Math.floor(windowWidth / 500);

const CreateExpense: React.FC<ICreateExpenseProps> = ({
  currentUser,
  onPressBack,
  tripInfo,
}) => {
  const { colors } = useTheme() as unknown as ColorTheme;
  const styles = makeStyles(colors as unknown as ThemeColors);

  const initialValues: CreateExpenseForm = {
    title: "",
    description: "",
    amount: "",
    peopleInExpense: tripInfo
      ? tripInfo?.participants.map((t) => t.uid)
      : [currentUser.uid],
    paidBy: currentUser.uid,
    createdBy: currentUser.uid,
    splitMethod: DibbySplitMethod.EQUAL_PARTS,
    perPersonAverage: 0,
  };

  const { handleSubmit, formState, control, setValue, watch, reset } = useForm({
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialValues,
  });

  const amount = watch("amount");
  const peopleInExpense = watch("peopleInExpense");

  useEffect(() => {
    const perPersonValue = parseFloat(amount) / peopleInExpense.length;
    setValue("perPersonAverage", perPersonValue || 0);
  }, [amount, peopleInExpense]);

  const onSubmit = async (formVal: CreateExpenseForm) => {
    if (tripInfo) {
      try {
        await createDibbyExpense(formVal, tripInfo);
        reset();
        onPressBack();
      } catch (e) {
        console.error("Error updating trip: ", e);
      }
    }
  };

  const getSelectText = (
    currentlySelected: string[],
    key: "label" | "value" | "key" | "color" | "inputLabel"
  ): string => {
    if (tripInfo) {
      const allLabels = currentlySelected.map(
        (v) => getInfoFromTravelerId(tripInfo, v)[key]
      );
      return allLabels.join(", ");
    } else {
      return "";
    }
  };

  return (
    <SafeAreaView style={styles.topContainer}>
      <TopBar
        title={`Add Expense to ${tripInfo?.title}`}
        leftButton={
          <DibbyButton
            type="clear"
            onPress={onPressBack}
            title={
              <FontAwesomeIcon
                icon={faClose}
                size={24}
                color={colors.background.text}
              />
            }
          />
        }
      />

      <ScrollView>
        <View style={styles.content}>
          <Controller
            control={control}
            name="title"
            rules={{
              required: true,
              validate: (value) =>
                tripInfo?.expenses.every(
                  (exp) =>
                    exp.title.toUpperCase().trim() !==
                    value.toUpperCase().trim()
                ),
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <DibbyInput
                label="Name of Expense"
                placeholder="Name of Expense"
                onBlur={onBlur}
                onChangeText={(val) => onChange(val as string)}
                value={value}
              />
            )}
          />
          {formState.errors.title && (
            <Text style={styles.errorText}>Expense must have a name.</Text>
          )}

          <Controller
            control={control}
            name="amount"
            rules={{
              required: true,
              validate: (value) => parseFloat(value) > 0,
            }}
            defaultValue={"0"}
            render={({ field: { onChange, onBlur, value } }) => (
              <DibbyInput
                label={"Expense Amount"}
                money
                keyboardType="numeric"
                value={value.toString()}
                placeholder="How much did this cost?"
                onBlur={onBlur}
                clearTextOnFocus
                returnKeyType="done"
                onChangeText={onChange}
              />
            )}
          />
          {formState.errors.amount && (
            <Text style={styles.errorText}>Expense must cost something.</Text>
          )}

          <View>
            <Text style={styles.inputLabel} numberOfLines={1}>
              Payer
            </Text>
          </View>
          <Controller
            control={control}
            name="paidBy"
            rules={{
              required: true,
            }}
            defaultValue={currentUser.uid}
            render={({ field: { onChange, onBlur, value } }) => {
              return Platform.OS === "web" ? (
                <View>
                  <FlatList
                    key={numColumns}
                    data={tripInfo ? [...tripInfo.participants] : []}
                    renderItem={({ item }) => (
                      <CheckBox
                        checked={value === item.uid}
                        onPress={() => setValue("paidBy", item.uid)}
                        title={item.name || undefined}
                        containerStyle={{
                          backgroundColor: colors.input.background,
                          borderRadius: 10,
                        }}
                        wrapperStyle={{
                          backgroundColor: colors.input.background,
                        }}
                        textStyle={{
                          color: colors.input.text,
                        }}
                      />
                    )}
                  />
                </View>
              ) : (
                <RNPickerSelect
                  onValueChange={onChange}
                  onClose={onBlur}
                  value={value}
                  placeholder={{
                    label: "Select who paid for this expense",
                    value: null,
                  }}
                  items={tripInfo ? getItemFormatFromTravelerIds(tripInfo) : []}
                  style={{
                    inputIOS: {
                      color: tripInfo
                        ? getItemFormatFromTravelerIds(tripInfo).filter(
                            (i) => i.key === value
                          )[0]?.color
                        : colors.disabled.text,
                      paddingRight: 30,
                    },
                    inputIOSContainer: {
                      backgroundColor: colors.background.paper,
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 12,
                      marginTop: 8,
                      minWidth: "90%",
                    },
                    placeholder: {
                      color: colors.disabled.text,
                    },
                  }}
                />
              );
            }}
          />

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel} numberOfLines={1}>
              People In Expense
            </Text>
            <Controller
              control={control}
              name="peopleInExpense"
              rules={{
                required: true,
                validate: (value) => value.length > 0,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <MultiSelect
                  items={tripInfo ? tripInfo.participants : []}
                  styleDropdownMenuSubsection={{
                    paddingLeft: 16,
                    borderRadius: 10,
                    backgroundColor: colors.input.background,
                  }}
                  textColor={colors.input.text}
                  styleListContainer={{
                    backgroundColor: colors.input.background,
                  }}
                  searchInputStyle={{
                    backgroundColor: colors.input.background,
                  }}
                  uniqueKey={"uid"}
                  onSelectedItemsChange={onChange}
                  onAddItem={onChange}
                  onToggleList={onBlur}
                  selectedItems={value}
                  selectText={getSelectText(value, "label")}
                  displayKey="name"
                  submitButtonText="Done"
                  selectedItemTextColor={colors.info.button}
                  selectedItemIconColor={colors.info.button}
                  itemTextColor={colors.input.text}
                  submitButtonColor={colors.info.button}
                  tagRemoveIconColor={colors.danger.button}
                  tagBorderColor={colors.info.button}
                  tagTextColor={colors.info.button}
                  styleMainWrapper={{
                    marginTop: 8,
                  }}
                />
              )}
            />
          </View>
          {formState.errors.peopleInExpense && (
            <Text style={styles.errorText}>Select at least one user.</Text>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel} numberOfLines={1}>
              Equal Amounts?
            </Text>
            <Controller
              control={control}
              name="splitMethod"
              rules={{
                required: true,
              }}
              defaultValue={DibbySplitMethod.EQUAL_PARTS}
              render={({ field: { onChange, onBlur, value } }) => (
                <></>
                // <Switch
                //   trackColor={{
                //     false: colors.disabled.button,
                //     true: colors.primary.text,
                //   }}
                //   thumbColor={
                //     value ? colors.info.button : colors.background.paper
                //   }
                //   ios_backgroundColor={colors.disabled.button}
                //   onValueChange={onChange}
                //   value={value}
                //   disabled={true}
                //   style={{
                //     marginTop: 8,
                //   }}
                // />
              )}
            />
          </View>

          <Controller
            control={control}
            name="perPersonAverage"
            defaultValue={0}
            render={({ field: { onChange, onBlur, value } }) => (
              <DibbyInput
                money
                label="Per Person"
                value={typeof value === "number" ? `${value.toString()}` : "0"}
                placeholder="Per Person Average"
                disabled
                clearButtonMode="never"
                onChangeText={onChange}
              />
            )}
          />
          <DibbyButton
            disabled={!formState.isValid}
            onPress={handleSubmit(onSubmit)}
            title={"Add Expense"}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateExpense;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
    errorText: {
      color: colors.danger.button,
      marginTop: 8,
    },
    content: {
      backgroundColor: colors.background.default,
      margin: 16,
      display: "flex",
    },
    inputContainer: {
      marginVertical: 12,
    },
    inputLabel: {
      color: colors.input.text,
      fontSize: 16,
      textAlign: "left",
      marginBottom: 12,
    },
  });
