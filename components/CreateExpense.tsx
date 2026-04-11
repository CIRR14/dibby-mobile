import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Dimensions,
} from "react-native";
import { ThemeColors } from "../constants/Colors";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  DibbySubTrip,
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
  formatTitleWithEmoji,
  numberWithCommas,
  inRange,
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
import NeumoSurface from "./NeumoSurface";
import NeumoPressable from "./NeumoPressable";
import { FloatingTabBar, NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import useAppTheme from "../hooks/useAppTheme";
import EmojiSelector from "./EmojiSelector";
import { track } from "../helpers/track";
import ScreenLayout from "./ScreenLayout";
import { MAIN_SUB_TRIP_ID, listSubTrips } from "../helpers/TripRepository";

interface ICreateExpenseProps {
  currentUser: DibbyUser;
  tripInfo?: DibbyTrip;
  onPressBack: () => void;
  embedded?: boolean;
  onSuccess?: () => void;
  defaultSubTripId?: string;
}

export interface CreateExpenseForm {
  title: string;
  description: string;
  amount: string;
  subTripId: string;
  peopleInExpense: string[];
  paidBy: string;
  createdBy: string;
  splitMethod: DibbySplitMethod;
  perPersonAverage: number;
  peopleSplits: DibbySplits[];
  emoji?: string | null;
}

interface WebSelectOption {
  label: string;
  value: string;
}

const windowWidth = Dimensions.get("window").width;

const numColumns = Math.floor(windowWidth / 500);

const CreateExpense: React.FC<ICreateExpenseProps> = ({
  currentUser,
  onPressBack,
  tripInfo,
  embedded = false,
  onSuccess,
  defaultSubTripId,
}) => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const [formValid, setFormValid] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [splitTotal, setSplitTotal] = useState<number>(0);
  const [percentageTotal, setPercentageTotal] = useState<number>(0);
  const [subTrips, setSubTrips] = useState<DibbySubTrip[]>([]);

  const initialValues: CreateExpenseForm = {
    title: "",
    description: "",
    amount: "",
    subTripId: defaultSubTripId || MAIN_SUB_TRIP_ID,
    peopleInExpense: tripInfo
      ? tripInfo.participants.map((t) => t.uid)
      : [currentUser.uid],
    paidBy: currentUser.uid,
    createdBy: currentUser.uid,
    splitMethod: DibbySplitMethod.EQUAL_PARTS,
    perPersonAverage: 0,
    emoji: "",
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
  const selectedSubTripId = watch("subTripId");
  const peopleInExpense = watch("peopleInExpense");
  const peopleSplits = watch("peopleSplits");
  const paidBy = watch("paidBy");
  const selectedEmoji = watch("emoji");
  const totalExpenseValue = Number(expenseAmount) || 0;
  const unallocatedAmount = totalExpenseValue - splitTotal;
  const isAllocationBalanced = inRange(unallocatedAmount, -0.01, 0.01);
  const allocationLabel =
    unallocatedAmount < -0.01 ? "Over by" : "Unallocated";
  const payerName = tripInfo
    ? getInfoFromTravelerId(tripInfo, paidBy)?.label
    : currentUser.displayName || currentUser.username || "You";
  const splitDescription =
    splitMethod === DibbySplitMethod.EQUAL_PARTS
      ? "Everyone pays the same."
      : splitMethod === DibbySplitMethod.PERCENTAGE
        ? "Split by percentages."
        : "Split by exact amounts.";
  const groupOptions: WebSelectOption[] = (subTrips.length
    ? subTrips
    : [{ id: MAIN_SUB_TRIP_ID, title: "Main", emoji: "" }]
  ).map((group) => ({
    label: formatTitleWithEmoji(group.title, group.emoji),
    value: group.id,
  }));

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
    [splitMethod, expenseAmount, peopleInExpense],
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
      (p) => p.amount === 0 || Number.isNaN(p.amount),
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
              `Remove traveler if they are not included in this expense!`,
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
              `Remove traveler if they are not included in this expense!`,
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
              `Percentage amounts do not add up to $${+expenseAmount}`,
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

  useEffect(() => {
    const loadSubTrips = async () => {
      if (!tripInfo) {
        return;
      }
      try {
        const loadedSubTrips = await listSubTrips(tripInfo);
        setSubTrips(loadedSubTrips);
        const hasSelected = loadedSubTrips.some(
          (group) => group.id === selectedSubTripId,
        );
        if (!hasSelected) {
          setValue("subTripId", defaultSubTripId || MAIN_SUB_TRIP_ID);
        }
      } catch (error) {
        setSubTrips([]);
      }
    };
    loadSubTrips();
  }, [tripInfo?.id, defaultSubTripId, selectedSubTripId, setValue]);

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
        track("expense_create", {
          tripId: tripInfo.id,
          amount: Number(formVal.amount) || 0,
          splitMethod: formVal.splitMethod,
          participants: formVal.peopleInExpense.length,
          hasEmoji: Boolean(formVal.emoji),
        });
        reset();
        if (onSuccess) {
          onSuccess();
        } else {
          onPressBack();
        }
      } catch (e) {
        console.error("Error updating trip: ", e);
      }
    }
  };

  const getSelectText = (
    currentlySelected: string[],
    key: "label" | "value" | "key" | "color" | "inputLabel",
  ): string => {
    if (tripInfo) {
      const allLabels = currentlySelected.map(
        (v) => getInfoFromTravelerId(tripInfo, v)[key],
      );
      return allLabels.join(", ");
    } else {
      return "";
    }
  };

  const splitOptions = [
    { label: "Equal", value: DibbySplitMethod.EQUAL_PARTS },
    { label: "Percent", value: DibbySplitMethod.PERCENTAGE },
    { label: "Amount", value: DibbySplitMethod.AMOUNT },
  ];

  const formContent = (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <KeyboardAvoidingView style={styles.content}>
          <NeumoSurface
            variant="glass"
            tone="surface"
            radius={NeumoTokens.radius.lg}
            style={styles.sectionCard}
          >
            <Text style={styles.sectionTitle}>Expense details</Text>
            <View style={styles.titleRow}>
              <EmojiSelector
                value={selectedEmoji}
                onChange={(emoji) => setValue("emoji", emoji || "")}
                label="Expense emoji"
                size={46}
              />
              <View style={styles.titleInput}>
                <Controller
                  control={control}
                  name="title"
                  rules={{
                    required: true,
                    validate: (value) =>
                      (tripInfo?.expenses || []).every(
                        (exp) =>
                          exp.title.toUpperCase().trim() !==
                          value.toUpperCase().trim(),
                      ) || true,
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <DibbyInput
                      placeholder="Name of Expense"
                      onBlur={onBlur}
                      onChangeText={(val) => onChange(val as string)}
                      value={value}
                    />
                  )}
                />
              </View>
            </View>
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

            <Text style={styles.inputLabel} numberOfLines={1}>
              Group
            </Text>
            <Controller
              control={control}
              name="subTripId"
              rules={{
                required: true,
              }}
              defaultValue={defaultSubTripId || MAIN_SUB_TRIP_ID}
              render={({ field: { onChange, onBlur, value } }) =>
                Platform.OS === "web" ? (
                  <NeumoSurface
                    variant="inset"
                    tone="surface"
                    radius={NeumoTokens.radius.md}
                    padding={NeumoTokens.spacing.sm}
                    style={styles.insetField}
                  >
                    <View style={styles.webSelectList}>
                      {groupOptions.map((option) => {
                        const isActive = value === option.value;
                        return (
                          <NeumoPressable
                            key={option.value}
                            onPress={() => {
                              onChange(option.value);
                              onBlur();
                            }}
                            variant={isActive ? "glass-strong" : "solid"}
                            tone="surface"
                            radius={NeumoTokens.radius.pill}
                            padding={NeumoTokens.control.pill.padding}
                            style={[
                              styles.webSelectOption,
                              ...(isActive ? [styles.webSelectOptionActive] : []),
                            ]}
                          >
                            <Text
                              style={[
                                styles.webSelectOptionText,
                                isActive && styles.webSelectOptionTextActive,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </NeumoPressable>
                        );
                      })}
                    </View>
                  </NeumoSurface>
                ) : (
                  <NeumoSurface
                    variant="inset"
                    tone="surface"
                    radius={NeumoTokens.radius.md}
                    padding={NeumoTokens.spacing.sm}
                    style={styles.insetField}
                  >
                    <RNPickerSelect
                      onValueChange={onChange}
                      onClose={onBlur}
                      value={value}
                      placeholder={{
                        label: "Select a group",
                        value: null,
                      }}
                      items={groupOptions}
                      style={{
                        inputIOS: styles.pickerInput,
                        inputAndroid: styles.pickerInput,
                        inputIOSContainer: styles.pickerContainer,
                        inputAndroidContainer: styles.pickerContainer,
                        placeholder: styles.pickerPlaceholder,
                      }}
                    />
                  </NeumoSurface>
                )
              }
            />
            {formState.errors.subTripId && (
              <Text style={styles.errorText}>Select a group.</Text>
            )}
          </NeumoSurface>

          <NeumoSurface
            variant="glass"
            tone="surface"
            radius={NeumoTokens.radius.lg}
            style={styles.sectionCard}
          >
            <Text style={styles.sectionTitle}>People</Text>
            <Text style={styles.inputLabel} numberOfLines={1}>
              Payer
            </Text>
            <Controller
              control={control}
              name="paidBy"
              rules={{
                required: true,
              }}
              defaultValue={currentUser.uid}
              render={({ field: { onChange, onBlur, value } }) => {
                return Platform.OS === "web" ? (
                  <View style={styles.checkboxGrid}>
                    <FlatList
                      key={numColumns}
                      data={tripInfo ? [...tripInfo.participants] : []}
                      renderItem={({ item }) => (
                        <CheckBox
                          checked={value === item.uid}
                          onPress={() => setValue("paidBy", item.uid)}
                          title={item.name || undefined}
                          checkedColor={colors.accent}
                          uncheckedColor={colors.textSecondary}
                          containerStyle={styles.checkboxItem}
                          wrapperStyle={styles.checkboxWrapper}
                          textStyle={styles.checkboxText}
                        />
                      )}
                    />
                  </View>
                ) : (
                  <NeumoSurface
                    variant="inset"
                    tone="surface"
                    radius={NeumoTokens.radius.md}
                    padding={NeumoTokens.spacing.sm}
                    style={styles.insetField}
                  >
                    <RNPickerSelect
                      onValueChange={onChange}
                      onClose={onBlur}
                      value={value}
                      placeholder={{
                        label: "Select who paid for this expense",
                        value: null,
                      }}
                      items={
                        tripInfo ? getItemFormatFromTravelerIds(tripInfo) : []
                      }
                      style={{
                        inputIOS: styles.pickerInput,
                        inputAndroid: styles.pickerInput,
                        inputIOSContainer: styles.pickerContainer,
                        inputAndroidContainer: styles.pickerContainer,
                        placeholder: styles.pickerPlaceholder,
                      }}
                    />
                  </NeumoSurface>
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
                    styleDropdownMenu={styles.multiSelectDropdown}
                    styleDropdownMenuSubsection={styles.multiSelectSubsection}
                    styleSelectorContainer={styles.multiSelectSelector}
                    styleTextDropdown={styles.multiSelectText}
                    styleTextDropdownSelected={styles.multiSelectTextSelected}
                    styleInputGroup={styles.multiSelectInputGroup}
                    styleIndicator={styles.multiSelectIndicator}
                    styleItemsContainer={styles.multiSelectItemsContainer}
                    styleListContainer={styles.multiSelectList}
                    styleRowList={styles.multiSelectRow}
                    textColor={colors.textPrimary}
                    searchInputStyle={styles.multiSelectSearch}
                    searchInputPlaceholderText="Search travelers"
                    uniqueKey={"uid"}
                    onSelectedItemsChange={onChange}
                    onAddItem={onChange}
                    onToggleList={onBlur}
                    selectedItems={value}
                    selectText={getSelectText(value, "label")}
                    displayKey="name"
                    selectedItemTextColor={colors.accent}
                    selectedItemIconColor={colors.accent}
                    itemTextColor={colors.textPrimary}
                    submitButtonColor={colors.accent}
                    tagRemoveIconColor={colors.danger.background}
                    tagBorderColor={colors.accent}
                    tagTextColor={colors.accent}
                    submitButtonText="Add"
                    styleMainWrapper={{
                      marginTop: 8,
                    }}
                    textInputProps={{
                      placeholderTextColor: colors.textSecondary,
                    }}
                  />
                )}
              />
            </View>
            {formState.errors.peopleInExpense && (
              <Text style={styles.errorText}>Select at least one user.</Text>
            )}
          </NeumoSurface>

          <NeumoSurface
            variant="glass"
            tone="surface"
            radius={NeumoTokens.radius.lg}
            style={styles.sectionCard}
          >
            <Text style={styles.sectionTitle}>Split</Text>
            <Text style={styles.splitPaidBy}>
              Paid by: {payerName || "Select payer"}
            </Text>
            <Text style={styles.inputLabel} numberOfLines={1}>
              Split by
            </Text>
            <Controller
              control={control}
              name="splitMethod"
              rules={{
                required: true,
              }}
              defaultValue={DibbySplitMethod.EQUAL_PARTS}
              render={({ field: { onChange, value } }) => (
                <View style={styles.segmentRow}>
                  {splitOptions.map((option) => {
                    const isActive = value === option.value;
                    return (
                      <NeumoPressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        variant={isActive ? "glass-strong" : "solid"}
                        tone="surface"
                        radius={NeumoTokens.radius.pill}
                        padding={NeumoTokens.control.pill.padding}
                        style={[
                          styles.segmentButton,
                          ...(isActive ? [styles.segmentButtonActive] : []),
                        ]}
                        containerStyle={styles.segmentButtonContainer}
                      >
                        <Text
                          style={[
                            styles.segmentLabel,
                            isActive && styles.segmentLabelActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </NeumoPressable>
                    );
                  })}
                </View>
              )}
            />
            <Text style={styles.splitHelper}>{splitDescription}</Text>

            <NeumoSurface
              variant="solid"
              tone="base"
              radius={NeumoTokens.radius.md}
              padding={NeumoTokens.spacing.sm}
              style={styles.summaryCard}
            >
              <View style={styles.summaryRow}>
                {splitMethod === DibbySplitMethod.PERCENTAGE && (
                  <Text
                    style={[
                      styles.summaryText,
                      !expenseAmount || percentageTotal !== 100
                        ? styles.summaryWarning
                        : styles.summaryOk,
                    ]}
                  >
                    {percentageTotal || 0}% / 100%
                  </Text>
                )}

                <Text
                  style={[
                    styles.summaryText,
                    !expenseAmount || splitTotal !== +expenseAmount
                      ? styles.summaryWarning
                      : styles.summaryOk,
                  ]}
                >
                  ${numberWithCommas(splitTotal.toString()) || 0} / $
                  {numberWithCommas(expenseAmount) || 0}
                </Text>

                {expenseAmount && (
                  <Text
                    style={[
                      styles.summaryText,
                      isAllocationBalanced
                        ? styles.summaryOk
                        : styles.summaryWarning,
                    ]}
                  >
                    {isAllocationBalanced
                      ? "Allocated"
                      : allocationLabel}{" "}
                    ${numberWithCommas(Math.abs(unallocatedAmount).toString())}
                  </Text>
                )}
              </View>
            </NeumoSurface>

            {splitMethod === DibbySplitMethod.AMOUNT ||
            splitMethod === DibbySplitMethod.PERCENTAGE ? (
              <KeyboardAvoidingView style={styles.splitInputs}>
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
                        <View style={styles.splitInput}>
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
                        </View>
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
          </NeumoSurface>

          {!formValid && (
            <View style={styles.errorContainer}>
              {errorMessage && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}
            </View>
          )}

          <DibbyButton
            disabled={!formValid}
            onPress={handleSubmit(onSubmit)}
            title={"Add Expense"}
            fullWidth
          />
        <View style={{ paddingBottom: FloatingTabBar.spacer }} />
      </KeyboardAvoidingView>
    </ScrollView>
  );

  if (embedded) {
    return <View style={styles.embeddedContainer}>{formContent}</View>;
  }

  return (
    <SafeAreaView style={styles.topContainer}>
      <TopBar
        title={`Add Expense to ${formatTitleWithEmoji(
          tripInfo?.title,
          tripInfo?.emoji,
        )}`}
        leftButton={
          <DibbyButton
            type="clear"
            onPress={onPressBack}
            title={
              <FontAwesomeIcon
                icon={faClose}
                size={24}
                color={colors.textPrimary}
              />
            }
          />
        }
      />
      <ScreenLayout contentStyle={styles.layoutContent}>{formContent}</ScreenLayout>
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
    embeddedContainer: {
      flex: 1,
      backgroundColor: "transparent",
    },
    scrollContent: {
      paddingBottom: NeumoTokens.spacing.lg,
    },
    errorText: {
      color: colors.danger.background,
      marginTop: 8,
    },
    errorContainer: {
      marginVertical: 16,
      width: "90%",
      alignSelf: "center",
    },
    content: {
      backgroundColor: colors.background.default,
      display: "flex",
      gap: 16,
      overflow: "visible",
    },
    layoutContent: {
      flex: 1,
    },
    inputContainer: {
      marginVertical: 12,
    },
    inputLabel: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      textAlign: "left",
      marginBottom: 12,
    },
    sectionCard: {
      gap: 12,
      overflow: "visible",
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    titleInput: {
      flex: 1,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
    },
    checkboxGrid: {
      width: "100%",
    },
    checkboxItem: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: NeumoTokens.radius.md,
      borderWidth: 0,
      marginVertical: 6,
    },
    checkboxWrapper: {
      backgroundColor: "transparent",
    },
    checkboxText: {
      color: colors.textPrimary,
    },
    insetField: {
      marginTop: 8,
    },
    pickerContainer: {
      backgroundColor: colors.input.background,

      paddingHorizontal: 8,
      paddingVertical: 6,
      minWidth: "90%",
    },
    pickerInput: {
      color: colors.textPrimary,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    pickerPlaceholder: {
      color: colors.textSecondary,
    },
    webSelectList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    webSelectOption: {
      minHeight: NeumoTokens.control.pill.minHeight,
      justifyContent: "center",
      alignItems: "center",
    },
    webSelectOptionActive: {
      backgroundColor: colors.surfaceAlt,
    },
    webSelectOptionText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
    webSelectOptionTextActive: {
      color: colors.textPrimary,
    },
    multiSelectDropdown: {
      backgroundColor: colors.input.background,
    },
    multiSelectSelector: {
      backgroundColor: colors.input.background,
    },
    multiSelectSubsection: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: NeumoTokens.radius.md,
      backgroundColor: colors.input.background,
      minHeight: 44,
    },
    multiSelectInputGroup: {
      paddingLeft: 0,
      backgroundColor: colors.input.background,
    },
    multiSelectIndicator: {
      backgroundColor: colors.input.background,
    },
    multiSelectText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
    },
    multiSelectTextSelected: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
    multiSelectItemsContainer: {
      backgroundColor: colors.input.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    multiSelectList: {
      backgroundColor: colors.surfaceAlt,
      paddingVertical: 6,
      paddingHorizontal: 8,
      marginTop: 8,
    },
    multiSelectRow: {
      paddingVertical: 8,
      borderBottomWidth: 0,
    },
    multiSelectSearch: {
      backgroundColor: colors.input.background,
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      paddingVertical: 6,
    },
    segmentRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 8,
    },
    segmentButtonContainer: {
      flexGrow: 1,
      flexBasis: "30%",
      minHeight: NeumoTokens.touch.minTarget,
    },
    segmentButton: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: NeumoTokens.control.pill.minHeight,
    },
    segmentButtonActive: {
      backgroundColor: colors.surfaceAlt,
    },
    segmentLabel: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
    segmentLabelActive: {
      color: colors.textPrimary,
    },
    summaryCard: {
      marginVertical: 8,
    },
    splitPaidBy: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      marginBottom: 8,
    },
    splitHelper: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      marginTop: 4,
      marginBottom: 4,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12,
    },
    summaryText: {
      fontSize: Typography.size.sm,
    },
    summaryOk: {
      color: colors.success.background,
      fontWeight: Typography.weight.semibold as any,
    },
    summaryWarning: {
      color: colors.danger.background,
      fontWeight: Typography.weight.semibold as any,
    },
    splitInputs: {
      flexDirection: Platform.OS === "web" ? "column" : "row",
      flexWrap: "wrap",
      gap: 16,
      justifyContent: "space-between",
    },
    splitInput: {
      width: Platform.OS === "web" ? "100%" : windowWidth * 0.4,
    },
  });
