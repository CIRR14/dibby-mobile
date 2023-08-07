import { Feather } from "@expo/vector-icons";
import {
  onSnapshot,
  query,
  collection,
  where,
  limit,
} from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AutocompleteDropdown,
  TAutocompleteDropdownItem,
  AutocompleteDropdownRef,
} from "react-native-autocomplete-dropdown";
import {
  DibbyParticipant,
  DibbyTrip,
  DibbyUser,
} from "../constants/DibbyTypes";
import { db } from "../firebase";
import { generateColor } from "../helpers/GenerateColor";
import { useUser } from "../hooks/useUser";
import { useTheme } from "@react-navigation/native";
import { ColorTheme } from "../constants/Colors";
import { Text, View } from "react-native";
import { DibbyChip } from "./DibbyChip";
import { capitalizeName } from "../helpers/AppHelpers";

export const DibbySearchUsername: React.FC<{
  results: (res: DibbyParticipant[]) => void;
  selectLoggedInUser?: boolean;
  multi?: boolean;
  currentTrip?: DibbyTrip;
  useDefaultSuggestion?: boolean;
}> = ({
  results,
  selectLoggedInUser,
  multi = true,
  currentTrip,
  useDefaultSuggestion = true,
}) => {
  const { dibbyUser } = useUser();
  const [loading, setLoading] = useState<any>(false);
  const [suggestionsList, setSuggestionsList] = useState<
    DibbyParticipant[] | undefined
  >(undefined);
  const dropdownController = useRef<AutocompleteDropdownRef>(null);
  const { colors } = useTheme() as unknown as ColorTheme;
  const [selectedResults, setSelectedResults] = useState<DibbyParticipant[]>(
    []
  );

  useEffect(() => {
    results(selectedResults);
  }, [selectedResults]);

  useEffect(() => {
    if (selectLoggedInUser && dibbyUser) {
      setSelectedResults([
        {
          name: dibbyUser.displayName,
          username: dibbyUser.username,
          uid: dibbyUser.uid,
          createdUser: false,
          owed: 0,
          amountPaid: 0,
          photoURL: dibbyUser.photoURL,
          color: dibbyUser.color,
        },
      ]);
    }
  }, [selectLoggedInUser, dibbyUser]);

  const getSuggestions = useCallback(
    async (textValue: string) => {
      if (dibbyUser) {
        const filterToken = capitalizeName(textValue);
        if (typeof textValue !== "string" || textValue.length < 3) {
          setSuggestionsList(undefined);
          return;
        }
        setLoading(true);
        const filterFromQuery = currentTrip
          ? [...currentTrip.participants.map((p) => p.username)]
          : [
              ...selectedResults
                .filter((r) => r !== null)
                .map((r) => r.username),
            ];

        const unsub = onSnapshot(
          query(
            collection(db, "users"),
            where("username", "not-in", [
              dibbyUser.username,
              ...filterFromQuery,
            ]),
            where("username", ">=", filterToken.toLowerCase()),
            where("username", "<=", filterToken.toLowerCase() + "\uf7ff"),
            limit(4)
          ),
          (doc) => {
            const results = doc.docs.map((data) => data.data()) as DibbyUser[];
            const suggestions: DibbyParticipant[] = results.map((r) => ({
              username: r.username,
              name: r.displayName,
              uid: r.uid,
              createdUser: false,
              owed: 0,
              amountPaid: 0,
              photoURL: r.photoURL,
              color: generateColor(),
            }));

            const defaultSuggestion: DibbyParticipant = {
              uid: currentTrip
                ? `${currentTrip.id}-${
                    currentTrip.participants.length + 1
                  }-${filterToken.replace(" ", "-")}`
                : `${selectedResults.length + 1}-${filterToken.replace(
                    " ",
                    "-"
                  )}`,
              name: filterToken,
              photoURL: null,
              username: `${filterToken.toLowerCase().replace(" ", "-")}-${
                currentTrip
                  ? currentTrip.participants.length + 1
                  : selectedResults.length + 1
              }`,
              createdUser: true,
              owed: 0,
              amountPaid: 0,
              color: generateColor(),
            };
            const newSuggestionsList = useDefaultSuggestion
              ? [defaultSuggestion, ...suggestions]
              : [...suggestions];
            setSuggestionsList(newSuggestionsList);
            setLoading(false);
          }
        );

        return () => {
          unsub();
        };
      }
    },
    [selectedResults, dibbyUser]
  );

  const onClearPress = useCallback(() => {
    setSuggestionsList(undefined);
  }, []);

  const onRemoveItem = useCallback(
    (item: DibbyParticipant) => {
      if (dibbyUser && item && item.uid !== dibbyUser.uid) {
        const updatedSelectedResults = selectedResults.filter(
          (i) => i.uid !== item.uid
        );
        setSelectedResults(updatedSelectedResults);
      }
    },
    [dibbyUser, selectedResults]
  );

  const onSelectItem = useCallback(
    (item: TAutocompleteDropdownItem) => {
      const foundExistingUser = suggestionsList?.find((v) => v.uid === item.id);
      if (foundExistingUser && item) {
        setSelectedResults([...selectedResults, foundExistingUser]);
        if (multi) {
          (dropdownController.current as AutocompleteDropdownRef).clear();
        }
      }
    },
    [suggestionsList]
  );

  return (
    <View>
      <AutocompleteDropdown
        controller={(controller: AutocompleteDropdownRef) => {
          (dropdownController.current as AutocompleteDropdownRef) = controller;
        }}
        dataSet={suggestionsList?.map((s) => ({
          id: s.uid,
          title: s.createdUser ? s.name : s.username,
        }))}
        direction={"down"}
        onChangeText={getSuggestions}
        onSelectItem={onSelectItem}
        debounce={600}
        clearOnFocus={multi}
        closeOnBlur={!multi}
        onClear={onClearPress}
        onOpenSuggestionsList={(e) => {
          if (!multi && selectedResults.length === 1) {
            (dropdownController.current as AutocompleteDropdownRef).close();
          }
        }}
        loading={loading}
        inputHeight={50}
        useFilter={false} // set false to prevent rerender twice
        textInputProps={{
          placeholder: "Search user by username",
          autoCorrect: false,
          autoCapitalize: "none",
          editable: !multi && selectedResults.length === 1 ? false : true,
          selectTextOnFocus:
            !multi && selectedResults.length === 1 ? false : true,
          style: {
            backgroundColor: colors.background.paper,
            color: colors.input.text,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
          },
        }}
        rightButtonsContainerStyle={{
          right: 8,
          height: 30,
          alignSelf: "center",
        }}
        inputContainerStyle={{
          backgroundColor: colors.background.default,
          borderRadius: 12,
        }}
        suggestionsListTextStyle={{
          color: colors.background.text,
        }}
        suggestionsListContainerStyle={{
          backgroundColor: colors.background.paper,
        }}
        containerStyle={{ width: "100%", marginBottom: 16 }}
        renderItem={(item, text) => (
          <Text
            key={item.id}
            style={{
              padding: 15,
              color:
                item.title === capitalizeName(text)
                  ? colors.success.background
                  : colors.background.text,
            }}
          >
            {item.title === capitalizeName(text) ? (
              <Text key={item.title}>Add: "{item.title}"</Text>
            ) : (
              suggestionsList?.map((val) => {
                return (
                  val.uid === item.id && (
                    <Text key={item.id}>
                      @{val.username} : {val.name}
                    </Text>
                  )
                );
              })
            )}
          </Text>
        )}
        ChevronIconComponent={
          <Feather
            name="chevron-down"
            color={colors.background.text}
            size={20}
          />
        }
        ClearIconComponent={
          <Feather name="x-circle" color={colors.background.text} size={18} />
        }
        showChevron={multi || (!multi && selectedResults.length !== 1)}
        showClear={multi || (!multi && selectedResults.length !== 1)}
      />
      <View
        style={{
          flexDirection: "row",
          gap: 16,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {selectedResults
          .filter((r) => r)
          .map((item: DibbyParticipant) => {
            return (
              <DibbyChip
                key={item.uid}
                onRemove={onRemoveItem}
                item={item}
                disabled={item.uid === dibbyUser?.uid}
              />
            );
          })}
      </View>
    </View>
  );
};
