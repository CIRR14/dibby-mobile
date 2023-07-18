import React, { useEffect } from "react";
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Switch,
  Dimensions,
} from "react-native";
import { ColorTheme, ThemeColors } from "../constants/Colors";
import { useTheme } from "@react-navigation/native";
import { User } from "firebase/auth";
import { db } from "../firebase";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Expense, Traveler, Trip } from "../constants/DibbyTypes";
import { Timestamp, doc, updateDoc } from "firebase/firestore";
import { Controller, useForm } from "react-hook-form";
import "react-native-get-random-values";
import { v4 as uuid } from "uuid";
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

interface ICreateExpenseProps {
  currentUser: User;
  tripInfo?: Trip;
  onPressBack: () => void;
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

  const initialValues: Expense = {
    id: "",
    name: "",
    created: Timestamp.now(),
    updated: Timestamp.now(),
    amount: "",
    peopleInExpense: tripInfo
      ? tripInfo?.travelers.map((t) => t.id)
      : [currentUser.uid],
    payer: currentUser.uid,
    equal: true,
    perPerson: 0,
  };
  const { handleSubmit, formState, control, setValue, watch, reset } = useForm({
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialValues,
  });

  const amount = watch("amount");
  const peopleInExpense = watch("peopleInExpense");

  useEffect(() => {
    const perPersonValue =
      parseFloat(amount as string) / peopleInExpense.length;
    setValue("perPerson", perPersonValue || 0);
  }, [amount, peopleInExpense]);

  const onSubmit = async (data: Expense) => {
    const amount = parseFloat(data.amount as string);

    if (tripInfo) {
      const payerInPeopleInvolved = data.peopleInExpense.find(
        (id: string) => id === data.payer
      );
      if (!payerInPeopleInvolved) {
        data.peopleInExpense = [...data.peopleInExpense, data.payer];
      }
      data.id = uuid();
      data.amount = +amount;

      const tripPerPerson =
        (tripInfo.amount + amount) / tripInfo.travelers.length;

      const updatedTravelers = tripInfo.travelers.map((t: Traveler) => {
        const involvedInExpense = data.peopleInExpense.includes(t.id);

        // if traveler is in expense
        if (involvedInExpense) {
          // if traveler is in expense and is the payer
          if (data.payer === t.id) {
            const newAmountPaid = t.amountPaid + amount;
            return {
              ...t,
              amountPaid: newAmountPaid,
              // owed should be whatever total you have paid + this expenses cost - your cost for this expense (and other expenses)
              owed: t.owed + (amount - data.perPerson),
            };
            // if traveler is in expense but not the payer
          } else {
            return {
              ...t,
              // what the traveler has paid total - this expense's cost
              owed: t.owed - data.perPerson,
            };
          }
          // if traveler is not in expense, keep the same
        } else {
          return {
            ...t,
          };
        }
      });

      data.created = Timestamp.now();
      data.updated = Timestamp.now();

      const tripUpdate = {
        ...tripInfo,
        updated: Timestamp.now(),
        amount: tripInfo.amount + amount, // increment(amount)s
        travelers: updatedTravelers,
        expenses: [...tripInfo.expenses, data], // arrayUnion(data)
        perPerson: tripPerPerson,
      };

      try {
        await updateDoc(doc(db, currentUser.uid, tripInfo.id), tripUpdate);
        console.log("Document updated with ID: ", tripInfo.id);
        reset();
        onPressBack();
      } catch (e) {
        console.error("Error updating trip: ", e);
      }
    }
  };

  const showError = (_fieldName: string, index?: any, secondName?: any) => {
    const travelerError = (formState.errors as any)[_fieldName]?.[index]?.[
      secondName
    ];
    return (
      travelerError && (
        <div
          className="ion-color-danger"
          style={{
            padding: 5,
            paddingLeft: 12,
            fontSize: "smaller",
          }}
        >
          This field is required
        </div>
      )
    );
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
        title={`Add Expense to ${tripInfo?.name}`}
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
            name="name"
            rules={{
              required: true,
              validate: (value) =>
                tripInfo?.expenses.every(
                  (exp) =>
                    exp.name.toUpperCase().trim() !== value.toUpperCase().trim()
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
          {formState.errors.name && (
            <Text style={styles.errorText}>Expense must have a name.</Text>
          )}

          <Controller
            control={control}
            name="amount"
            rules={{
              required: true,
              validate: (value) => parseFloat(value as string) > 0,
            }}
            defaultValue={0}
            render={({ field: { onChange, onBlur, value } }) => (
              <DibbyInput
                label={"Expense Amount"}
                money
                keyboardType="numeric"
                value={value.toString()}
                placeholder="How much did this cost?"
                onBlur={onBlur}
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
            name="payer"
            rules={{
              required: true,
            }}
            defaultValue={currentUser.uid}
            render={({ field: { onChange, onBlur, value } }) => {
              return Platform.OS === "web" ? (
                <View>
                  <FlatList
                    key={numColumns}
                    data={
                      tripInfo ? getItemFormatFromTravelerIds(tripInfo) : []
                    }
                    renderItem={({ item }) => (
                      <CheckBox
                        checked={value === item.key}
                        onPress={() => setValue("payer", item.key)}
                        title={item.label}
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
              defaultValue={[]}
              render={({ field: { onChange, onBlur, value } }) => (
                <MultiSelect
                  items={
                    tripInfo
                      ? getItemFormatFromTravelerIds(tripInfo)
                      : [currentUser.uid]
                  }
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
                  uniqueKey={"key"}
                  onSelectedItemsChange={onChange}
                  onAddItem={onChange}
                  onToggleList={onBlur}
                  selectedItems={value}
                  selectText={getSelectText(value, "label")}
                  displayKey="label"
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
              name="equal"
              rules={{
                required: true,
              }}
              defaultValue={true}
              render={({ field: { onChange, onBlur, value } }) => (
                <Switch
                  trackColor={{
                    false: colors.disabled.button,
                    true: colors.primary.text,
                  }}
                  thumbColor={
                    value ? colors.info.button : colors.background.paper
                  }
                  ios_backgroundColor={colors.disabled.button}
                  onValueChange={onChange}
                  value={value}
                  disabled={true}
                  style={{
                    marginTop: 8,
                  }}
                />
              )}
            />
          </View>

          <Controller
            control={control}
            name="perPerson"
            defaultValue={0}
            render={({ field: { onChange, onBlur, value } }) => (
              <DibbyInput
                money
                label="Per Person"
                value={typeof value === "number" ? `${value.toString()}` : "0"}
                placeholder="Per Person Average"
                onChangeText={onChange}
              />
            )}
          />
        </View>
        <DibbyButton
          disabled={!formState.isValid}
          onPress={handleSubmit(onSubmit)}
          title={"Add Expense"}
        />
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
