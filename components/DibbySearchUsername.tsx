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
import {
  getUniqueParticipantColor,
  resolveParticipantColor,
} from "../helpers/GenerateColor";
import { useUser } from "../hooks/useUser";
import useAppTheme from "../hooks/useAppTheme";
import { StyleSheet, Text, View } from "react-native";
import { DibbyChip } from "./DibbyChip";
import { capitalizeName } from "../helpers/AppHelpers";
import { Typography } from "../constants/Typography";

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
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestionsList, setSuggestionsList] = useState<
    DibbyParticipant[] | undefined
  >(undefined);
  const dropdownController = useRef<AutocompleteDropdownRef>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const colors = useAppTheme();
  const styles = makeStyles(colors);
  const [selectedResults, setSelectedResults] = useState<DibbyParticipant[]>(
    []
  );
  const [searchText, setSearchText] = useState<string>("");

  useEffect(() => {
    results(selectedResults);
  }, [selectedResults]);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

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
          color: resolveParticipantColor(
            dibbyUser.color,
            dibbyUser.uid || dibbyUser.username || dibbyUser.displayName || ""
          ),
        },
      ]);
    }
  }, [selectLoggedInUser, dibbyUser]);

  const getSuggestions = useCallback(
    async (textValue: string) => {
      if (!dibbyUser) {
        return;
      }

      const filterToken = capitalizeName(textValue || "");
      if (!textValue) {
        setSuggestionsList(undefined);
        setLoading(false);
        return;
      }

      const usedColors = [
        ...(currentTrip?.participants || []),
        ...selectedResults,
      ]
        .filter((p) => p)
        .map((p) =>
          resolveParticipantColor(p.color, p.uid || p.username || p.name || "")
        );

      const defaultSuggestion: DibbyParticipant = {
        uid: currentTrip
          ? `${currentTrip.id}-${
              currentTrip.participants.length + 1
            }-${filterToken.replace(" ", "-")}`
          : `${selectedResults.length + 1}-${filterToken.replace(" ", "-")}`,
        name: filterToken,
        photoURL: null,
        username: `${filterToken.toLowerCase().replace(" ", "-")}-${
          currentTrip ? currentTrip.participants.length + 1 : selectedResults.length + 1
        }`,
        createdUser: true,
        owed: 0,
        amountPaid: 0,
        color: getUniqueParticipantColor(usedColors, filterToken),
      };

      if (typeof textValue !== "string" || textValue.length < 3) {
        setSuggestionsList(useDefaultSuggestion ? [defaultSuggestion] : []);
        setLoading(false);
        return;
      }

      setLoading(true);
      const rawExclude = [
        dibbyUser.username,
        ...(currentTrip?.participants || []).map((p) => p.username),
        ...selectedResults.map((r) => r.username),
      ];
      const uniqueExclude = Array.from(
        new Set(
          rawExclude
            .filter((value): value is string => Boolean(value))
            .map((value) => value.toLowerCase())
        )
      ).slice(0, 10);

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      const constraints = [
        where("username", ">=", filterToken.toLowerCase()),
        where("username", "<=", filterToken.toLowerCase() + "\uf7ff"),
        limit(4),
      ];

      const queryConstraints =
        uniqueExclude.length > 0
          ? [where("username", "not-in", uniqueExclude), ...constraints]
          : constraints;

      const unsub = onSnapshot(
        query(collection(db, "users"), ...queryConstraints),
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
            color: resolveParticipantColor(
              r.color,
              r.uid || r.username || r.displayName || ""
            ),
          }));

          const newSuggestionsList = useDefaultSuggestion
            ? [defaultSuggestion, ...suggestions]
            : [...suggestions];
          setSuggestionsList(newSuggestionsList);
          setLoading(false);
        }
      );

      unsubscribeRef.current = unsub;
    },
    [selectedResults, dibbyUser, currentTrip, useDefaultSuggestion]
  );

  const onClearPress = useCallback(() => {
    setSuggestionsList(undefined);
    setSearchText("");
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
        setSelectedResults((prev) => [...prev, foundExistingUser]);
        if (multi) {
          (dropdownController.current as AutocompleteDropdownRef).clear();
        }
        setSearchText("");
      }
    },
    [suggestionsList, multi]
  );

  const handleChangeText = useCallback(
    (textValue: string) => {
      setSearchText(textValue);
      getSuggestions(textValue);
    },
    [getSuggestions]
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
        onChangeText={handleChangeText}
        onSelectItem={onSelectItem}
        debounce={400}
        clearOnFocus={multi}
        closeOnBlur={!multi}
        onClear={onClearPress}
        onOpenSuggestionsList={() => {
          if (searchText && (!suggestionsList || suggestionsList.length === 0)) {
            getSuggestions(searchText);
          }
        }}
        onFocus={() => {
          if (searchText) {
            getSuggestions(searchText);
          }
        }}
        onOpenSuggestionsList={(e) => {
          if (!multi && selectedResults.length === 1) {
            (dropdownController.current as AutocompleteDropdownRef).close();
          }
        }}
        loading={loading}
        inputHeight={50}
        useFilter={false} // set false to prevent rerender twice
        textInputProps={{
          placeholder: "Search by username or add a guest name",
          autoCorrect: false,
          autoCapitalize: "none",
          editable: !multi && selectedResults.length === 1 ? false : true,
          selectTextOnFocus:
            !multi && selectedResults.length === 1 ? false : true,
          onFocus: () => {
            if (searchText) {
              getSuggestions(searchText);
            }
          },
          style: styles.inputText,
        }}
        rightButtonsContainerStyle={{
          right: 8,
          height: 32,
          alignSelf: "center",
        }}
        inputContainerStyle={{
          backgroundColor: colors.surfaceAlt,
          borderRadius: 12,
        }}
        suggestionsListTextStyle={{
          color: colors.textPrimary,
        }}
        suggestionsListContainerStyle={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          marginTop: 6,
        }}
        containerStyle={{ width: "100%", marginBottom: 16 }}
        renderItem={(item) => {
          const suggestion = suggestionsList?.find((val) => val.uid === item.id);
          if (!suggestion) {
            return null;
          }
          const isGuest = Boolean(suggestion.createdUser);
          const title = isGuest
            ? `Add "${suggestion.name}"`
            : `@${suggestion.username}`;
          const subtitle = isGuest ? "Guest (no account)" : suggestion.name;
          return (
            <View style={styles.suggestionRow} key={item.id}>
              <View style={styles.suggestionText}>
                <Text style={styles.suggestionTitle}>{title}</Text>
                {subtitle ? (
                  <Text style={styles.suggestionSubtitle}>{subtitle}</Text>
                ) : null}
              </View>
              {isGuest && (
                <View style={styles.guestPill}>
                  <Text style={styles.guestPillText}>Guest</Text>
                </View>
              )}
            </View>
          );
        }}
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
        showChevron
        showClear={Boolean(searchText)}
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

const makeStyles = (colors: any) =>
  StyleSheet.create({
    inputText: {
      backgroundColor: colors.surfaceAlt,
      color: colors.textPrimary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      fontSize: Typography.size.sm,
    },
    suggestionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
      gap: 12,
    },
    suggestionText: {
      flex: 1,
      gap: 2,
    },
    suggestionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.sm,
      fontWeight: "600",
    },
    suggestionSubtitle: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
    },
    guestPill: {
      backgroundColor: colors.success.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
    },
    guestPillText: {
      color: colors.success.text,
      fontSize: Typography.size.xs,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
  });
