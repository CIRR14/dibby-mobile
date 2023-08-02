import React, { useCallback, useEffect, useState } from "react";
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
import { Controller, useFieldArray, useForm } from "react-hook-form";
import "react-native-get-random-values";
import {
  getInfoFromTravelerId,
  getItemFormatFromTravelerIds,
  numberWithCommas,
} from "../helpers/AppHelpers";
import MultiSelect from "react-native-multiple-select";
import RNPickerSelect from "react-native-picker-select";
import { Platform, KeyboardAvoidingView } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { CheckBox } from "@rneui/themed";
import DibbyButton from "./DibbyButton";
import TopBar from "./TopBar";
import DibbyInput from "./DibbyInput";
import { createDibbyExpense } from "../helpers/FirebaseHelpers";
import { RadioButton } from "react-native-paper";

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
  peopleSplits: DibbySplits[];
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
  const [formValid, setFormValid] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [splitTotal, setSplitTotal] = useState<number>(0);
  const [percentageTotal, setPercentageTotal] = useState<number>(0);

  const initialValues: CreateExpenseForm = {
    title: "",
    description: "",
    amount: "",
    peopleInExpense: tripInfo
      ? tripInfo.participants.map((t) => t.uid)
      : [currentUser.uid],
    paidBy: currentUser.uid,
    createdBy: currentUser.uid,
    splitMethod: DibbySplitMethod.EQUAL_PARTS,
    perPersonAverage: 0,
    peopleSplits: tripInfo
      ? tripInfo.participants.map((t) => ({
          amount: 0,
          uid: t.uid,
          name: t.name || t.username || "",
        }))
      : [
          {
            amount: 0,
            uid: currentUser.uid,
            name: currentUser.displayName || currentUser.username || "",
          },
        ],
  };

  const { handleSubmit, formState, control, setValue, watch, reset } = useForm({
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "peopleSplits",
  });

  const expenseAmount = watch("amount");
  const splitMethod = watch("splitMethod");
  const peopleInExpense = watch("peopleInExpense");
  const peopleSplits = watch("peopleSplits");
  const paidBy = watch("paidBy");

  const getExpenseSplitAmount = useCallback(
    (amount: number): number => {
      if (+expenseAmount > 0) {
        if (splitMethod === DibbySplitMethod.PERCENTAGE) {
          return +expenseAmount * (amount / 100);
        } else if (splitMethod === DibbySplitMethod.AMOUNT) {
          return amount;
        } else {
          return +expenseAmount / peopleInExpense.length;
        }
      } else {
        return amount;
      }
    },
    [splitMethod, expenseAmount, peopleInExpense]
  );

  // const getInputLabel = useCallback(
  //   (value: DibbySplits): string => {
  //     const newAmount = getExpenseSplitAmount(+value);
  //     return `${value.name} ${!!newAmount ? `- $${newAmount}` : ``}`;
  //   },
  //   [splitMethod, peopleSplits]
  // );

  useEffect(() => {
    // Checks validity of the form
    const noZeroTravelers: boolean = !peopleSplits.find(
      (p) => p.amount === 0 || Number.isNaN(p.amount)
    );

    const getValidityFromSplitMethod = (): boolean => {
      setErrorMessage(undefined);

      if (splitMethod === DibbySplitMethod.EQUAL_PARTS) {
        setSplitTotal(+expenseAmount);
        setErrorMessage(undefined);
        return true;
      } else {
        if (splitMethod === DibbySplitMethod.AMOUNT) {
          const sumOfAmounts: number = peopleSplits
            .map((t) => t.amount)
            .reduce((a, b) => +a + +b);
          setSplitTotal(sumOfAmounts);

          if (!noZeroTravelers) {
            setErrorMessage(
              `Remove traveler if they are not included in this expense!`
            );
            return false;
          }

          if (sumOfAmounts === +expenseAmount) {
            return true;
          } else {
            setErrorMessage(`Amounts do not add up to $${+expenseAmount}!`);
            return false;
          }
        } else {
          const percentagesTo100: number = peopleSplits
            .map((t) => t.amount)
            .reduce((a, b) => +a + +b);
          const percentageToAmount: number = peopleSplits
            .map((t) => +expenseAmount * (t.amount / 100))
            .reduce((a, b) => +a + +b);

          setSplitTotal(percentageToAmount);
          setPercentageTotal(percentagesTo100);

          if (!noZeroTravelers) {
            setErrorMessage(
              `Remove traveler if they are not included in this expense!`
            );
            return false;
          }

          if (
            percentagesTo100 === 100 &&
            percentageToAmount === +expenseAmount
          ) {
            return true;
          } else if (percentagesTo100 !== 100) {
            setErrorMessage(`Percentages do not add up to 100%!`);
            return false;
          } else {
            setErrorMessage(
              `Percentage amounts do not add up to $${+expenseAmount}`
            );
            return false;
          }
        }
      }
      // else {
      //   setErrorMessage(
      //     `Remove traveler if they are not included in this expense!`
      //   );
      //   return false;
      // }
    };

    const amountsAreValid = getValidityFromSplitMethod();

    if (formState.isValid && amountsAreValid) {
      setFormValid(true);
    } else {
      setFormValid(false);
    }
  }, [formState, peopleInExpense, splitMethod, peopleSplits, expenseAmount]);

  useEffect(() => {
    const perPersonValue = parseFloat(expenseAmount) / peopleInExpense.length;
    setValue("perPersonAverage", perPersonValue || 0);
  }, [expenseAmount, peopleInExpense]);

  useEffect(() => {
    /// removes field array if removed from involved in expense
    if (peopleInExpense.length !== peopleSplits.length) {
      const newPeopleSplits: DibbySplits[] | undefined = tripInfo?.participants
        .filter((t) => peopleInExpense.includes(t.uid))
        .map((p) => ({
          name: p.name || p.username || "",
          uid: p.uid,
          amount: peopleSplits.find((f) => f.uid === p.uid)?.amount || 0,
        }));
      if (newPeopleSplits) {
        setValue("peopleSplits", newPeopleSplits);
      }
    }
  }, [peopleInExpense, peopleSplits, tripInfo]);

  const onSubmit = async (formVal: CreateExpenseForm) => {
    const finalFormValue = {
      ...formVal,
      peopleSplits: formVal.peopleSplits.map((p) => {
        return {
          uid: p.uid,
          name: p.name,
          amount: getExpenseSplitAmount(p.amount),
        };
      }),
    };

    if (tripInfo) {
      try {
        await createDibbyExpense(finalFormValue, tripInfo);
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

  useEffect(() => {
    if (!peopleInExpense.includes(paidBy)) {
      setValue("peopleInExpense", [...peopleInExpense, paidBy]);
    }
  }, [peopleInExpense, paidBy]);

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
        <KeyboardAvoidingView style={styles.content}>
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
              Split By:
            </Text>
            <Controller
              control={control}
              name="splitMethod"
              rules={{
                required: true,
              }}
              defaultValue={DibbySplitMethod.EQUAL_PARTS}
              render={({ field: { onChange, value } }) => (
                <RadioButton.Group
                  onValueChange={(value) => onChange(DibbySplitMethod[value])}
                  value={value}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <RadioButton.Item
                      label="Equal Parts"
                      value="EQUAL_PARTS"
                      mode="android"
                      labelStyle={{
                        color: colors.input.text,
                        fontSize: 14,
                      }}
                    />
                    <RadioButton.Item
                      label="Percentage"
                      value="PERCENTAGE"
                      mode="android"
                      labelStyle={{
                        color: colors.input.text,
                        fontSize: 14,
                      }}
                    />
                    <RadioButton.Item
                      label="Amount"
                      value="AMOUNT"
                      mode="android"
                      labelStyle={{
                        color: colors.input.text,
                        fontSize: 14,
                      }}
                    />
                  </View>
                </RadioButton.Group>
              )}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              marginBottom: 24,
            }}
          >
            {splitMethod === DibbySplitMethod.PERCENTAGE && (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight:
                    !expenseAmount || percentageTotal !== 100 ? "200" : "400",
                  color:
                    !expenseAmount || percentageTotal !== 100
                      ? colors.danger.button
                      : colors.success.button,
                }}
              >
                {percentageTotal || 0}% / 100%
              </Text>
            )}

            <Text
              style={{
                fontSize: 16,
                fontWeight:
                  !expenseAmount || splitTotal !== +expenseAmount
                    ? "200"
                    : "400",
                color:
                  !expenseAmount || splitTotal !== +expenseAmount
                    ? colors.danger.button
                    : colors.success.button,
              }}
            >
              ${numberWithCommas(splitTotal.toString()) || 0} / $
              {numberWithCommas(expenseAmount) || 0}
            </Text>
          </View>

          {splitMethod === DibbySplitMethod.AMOUNT ||
          splitMethod === DibbySplitMethod.PERCENTAGE ? (
            <KeyboardAvoidingView
              style={{
                flexDirection: Platform.OS === "web" ? "column" : "row",
                flexWrap: "wrap",
                gap: 16,
                justifyContent: "space-between",
              }}
            >
              {fields.map(({ name }: any, index: number) => {
                return (
                  <Controller
                    key={name}
                    control={control}
                    rules={
                      splitMethod === DibbySplitMethod.PERCENTAGE
                        ? {
                            required: true,
                            validate: (val) =>
                              +val.amount >= 0.01 && +val.amount <= 100,
                            min: 0.01,
                            maxLength: 4,
                            max: 100,
                          }
                        : {
                            required: true,
                            validate: (val) =>
                              +val.amount >= 0.01 &&
                              +val.amount <= +expenseAmount,
                            min: 0.01,
                            max: expenseAmount,
                          }
                    }
                    name={`peopleSplits.${index}`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <KeyboardAvoidingView
                        style={{ width: windowWidth * 0.4 }}
                      >
                        <DibbyInput
                          label={value.name}
                          keyboardType="decimal-pad"
                          maxLength={
                            splitMethod === DibbySplitMethod.PERCENTAGE
                              ? 3
                              : undefined
                          }
                          percentage={
                            splitMethod === DibbySplitMethod.PERCENTAGE
                          }
                          money={splitMethod === DibbySplitMethod.AMOUNT}
                          placeholder={value.name}
                          onBlur={onBlur}
                          onChangeText={(val) => {
                            onChange({
                              amount: val,
                              uid: value.uid,
                              name: value.name,
                            });
                          }}
                          value={
                            typeof value.amount === "number"
                              ? value.amount.toString()
                              : value.amount
                          }
                        />
                      </KeyboardAvoidingView>
                    )}
                  />
                );
              })}
            </KeyboardAvoidingView>
          ) : (
            <Controller
              control={control}
              name="perPersonAverage"
              defaultValue={0}
              render={({ field: { onChange, value } }) => (
                <DibbyInput
                  money
                  label="Per Person Average"
                  value={
                    typeof value === "number" ? `${value.toString()}` : "0"
                  }
                  placeholder="Per Person Average"
                  disabled
                  clearButtonMode="never"
                  onChangeText={onChange}
                />
              )}
            />
          )}

          {!formValid && (
            <View style={{ marginVertical: 16, width: "80%" }}>
              {errorMessage && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}
            </View>
          )}

          <DibbyButton
            disabled={!formValid}
            onPress={handleSubmit(onSubmit)}
            title={"Add Expense"}
          />
          <View style={{ paddingBottom: 200 }} />
        </KeyboardAvoidingView>
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
