import React, { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { collection, doc, Timestamp } from "firebase/firestore";
import { ThemeColors } from "../constants/Colors";
import { DibbyParticipant, DibbyTrip } from "../constants/DibbyTypes";
import { db } from "../firebase";
import { useUser } from "../hooks/useUser";
import useAppTheme from "../hooks/useAppTheme";
import { assignUniqueParticipantColors } from "../helpers/GenerateColor";
import { createDibbyTrip } from "../helpers/FirebaseHelpers";
import { formatTitleWithEmoji, capitalizeName } from "../helpers/AppHelpers";
import { FloatingTabBar, NeumoTokens } from "../constants/Neumo";
import { Typography } from "../constants/Typography";
import TopBar from "../components/TopBar";
import NeumoSurface from "../components/NeumoSurface";
import NeumoPressable from "../components/NeumoPressable";
import DibbyButton from "../components/DibbyButton";
import DibbyInput from "../components/DibbyInput";
import EmojiSelector from "../components/EmojiSelector";
import { DibbySearchUsername } from "../components/DibbySearchUsername";
import DibbyLoading from "../components/DibbyLoading";
import CreateExpense from "../components/CreateExpense";
import { track } from "../helpers/track";

const TripWizard = () => {
  const colors = useAppTheme();
  const styles = makeStyles(colors as unknown as ThemeColors);
  const navigation = useNavigation<any>();
  const { dibbyUser } = useUser();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tripTitle, setTripTitle] = useState("");
  const [tripEmoji, setTripEmoji] = useState<string | null>("");
  const [selectedResults, setSelectedResults] = useState<DibbyParticipant[]>(
    [],
  );
  const [creatingTrip, setCreatingTrip] = useState(false);
  const [createdTrip, setCreatedTrip] = useState<DibbyTrip | null>(null);

  const canContinueStep1 = tripTitle.trim().length > 0;
  const canContinueStep2 = selectedResults.length >= 2;

  const stepTitle = useMemo(() => {
    if (step === 1) return "Name your trip";
    if (step === 2) return "Add people";
    return "Add your first expense";
  }, [step]);

  const formattedTripTitle = formatTitleWithEmoji(
    tripTitle.trim(),
    tripEmoji || null,
  );

  const createTripAndContinue = async () => {
    if (!dibbyUser) return;
    if (!canContinueStep2) return;
    if (creatingTrip || createdTrip) {
      setStep(3);
      return;
    }
    setCreatingTrip(true);
    const tripRef = doc(collection(db, "trips"));
    const participantsWithColors =
      assignUniqueParticipantColors(selectedResults);

    const newTripData: DibbyTrip = {
      id: tripRef.id,
      title: capitalizeName(tripTitle.trim()),
      description: "",
      amount: 0,
      createdBy: dibbyUser.uid,
      dateCreated: Timestamp.now(),
      dateUpdated: Timestamp.now(),
      perPersonAverage: 0,
      expenses: [],
      participants: participantsWithColors,
      completed: false,
      emoji: tripEmoji || null,
    };

    const usersToAddTripTo = participantsWithColors.filter(
      (r) => r && !r.createdUser,
    );

    try {
      await createDibbyTrip(newTripData, tripRef, usersToAddTripTo);
      track("trip_create", {
        source: "wizard",
        tripId: tripRef.id,
        participantCount: participantsWithColors.length,
        hasEmoji: Boolean(tripEmoji),
      });
      setCreatedTrip(newTripData);
      setStep(3);
    } catch (error) {
      console.log(error);
    } finally {
      setCreatingTrip(false);
    }
  };

  const handleSkipExpense = () => {
    if (!createdTrip) return;
    navigation.navigate("ViewTrip", {
      tripName: createdTrip.title,
      tripId: createdTrip.id,
    });
  };

  const handleExpenseCreated = () => {
    if (!createdTrip) return;
    navigation.navigate("ViewTrip", {
      tripName: createdTrip.title,
      tripId: createdTrip.id,
    });
  };

  const renderStepHeader = () => (
    <NeumoSurface
      variant="raised"
      tone="surface"
      radius={NeumoTokens.radius.lg}
      padding={NeumoTokens.spacing.md}
      style={styles.stepHeader}
    >
      <Text style={styles.stepLabel}>Step {step} of 3</Text>
      <Text style={styles.stepTitle}>{stepTitle}</Text>
      <View style={styles.stepDots}>
        {[1, 2, 3].map((value) => (
          <View
            key={value}
            style={[styles.stepDot, value <= step && styles.stepDotActive]}
          />
        ))}
      </View>
    </NeumoSurface>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      {renderStepHeader()}
      <NeumoSurface
        variant="raised"
        tone="surface"
        radius={NeumoTokens.radius.lg}
        style={styles.sectionCard}
      >
        <Text style={styles.sectionTitle}>Trip details</Text>
        <View style={styles.titleRow}>
          <EmojiSelector
            value={tripEmoji}
            onChange={setTripEmoji}
            label="Trip emoji"
            size={46}
          />
          <View style={styles.titleInput}>
            <DibbyInput
              placeholder="Trip name"
              value={tripTitle}
              onChangeText={setTripTitle}
              clearButtonMode="always"
            />
          </View>
        </View>
        <Text style={styles.helperText}>
          A clear name helps everyone recognize the trip.
        </Text>
      </NeumoSurface>

      <DibbyButton
        title="Continue"
        onPress={() => setStep(2)}
        disabled={!canContinueStep1}
        fullWidth
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      {renderStepHeader()}
      <NeumoSurface
        variant="raised"
        tone="surface"
        radius={NeumoTokens.radius.lg}
        style={styles.sectionCard}
      >
        <Text style={styles.sectionTitle}>{formattedTripTitle || "Trip"}</Text>
        <Text style={styles.sectionSubtitle}>Add people to split with</Text>
        <DibbySearchUsername
          results={(res) => setSelectedResults(res)}
          selectLoggedInUser
        />
        <Text style={styles.helperText}>
          Add at least two travelers to continue.
        </Text>
      </NeumoSurface>

      {creatingTrip ? (
        <DibbyLoading />
      ) : (
        <DibbyButton
          title="Create trip"
          onPress={createTripAndContinue}
          disabled={!canContinueStep2}
          fullWidth
        />
      )}
      <NeumoPressable
        variant="flat"
        tone="base"
        onPress={() => setStep(1)}
        style={styles.secondaryAction}
      >
        <Text style={styles.secondaryText}>Back</Text>
      </NeumoPressable>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      {renderStepHeader()}
      <View style={styles.step3Header}>
        <Text style={styles.sectionTitle}>First expense</Text>
        <NeumoPressable
          variant="flat"
          tone="base"
          onPress={handleSkipExpense}
          style={styles.secondaryAction}
        >
          <Text style={styles.secondaryText}>Skip for now</Text>
        </NeumoPressable>
      </View>
      {createdTrip && dibbyUser ? (
        <CreateExpense
          embedded
          currentUser={dibbyUser}
          tripInfo={createdTrip}
          onPressBack={() => setStep(2)}
          onSuccess={handleExpenseCreated}
        />
      ) : (
        <DibbyLoading />
      )}
    </View>
  );

  return (
    <View style={styles.topContainer}>
      <SafeAreaView style={styles.topContainer}>
        <TopBar
          title="First trip"
          leftButton={
            <DibbyButton
              type="clear"
              onPress={() => navigation.navigate("Home")}
              title="Cancel"
            />
          }
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 3
            ? renderStep3()
            : step === 1
              ? renderStep1()
              : renderStep2()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topContainer: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 16,
      paddingBottom: FloatingTabBar.spacer,
      gap: 16,
    },
    stepContent: {
      flexGrow: 1,
      padding: 16,
      paddingBottom: FloatingTabBar.spacer,
      gap: 16,
    },
    stepHeader: {
      gap: 6,
    },
    stepLabel: {
      color: colors.textSecondary,
      fontSize: Typography.size.xs,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    stepTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.lg,
      fontWeight: Typography.weight.semibold as any,
    },
    stepDots: {
      flexDirection: "row",
      gap: 6,
      marginTop: 6,
    },
    stepDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
    },
    stepDotActive: {
      backgroundColor: colors.accent,
    },
    sectionCard: {
      gap: 12,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.semibold as any,
    },
    sectionSubtitle: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
    },
    helperText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    titleInput: {
      flex: 1,
    },
    secondaryAction: {
      alignSelf: "center",
      paddingHorizontal: 12,
    },
    secondaryText: {
      color: colors.textSecondary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold as any,
    },
    step3Header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  });

export default TripWizard;
