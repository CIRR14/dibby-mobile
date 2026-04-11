import {
  DocumentData,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  DibbyExpense,
  DibbySubTrip,
  DibbyTrip,
  LeaderboardEntry,
} from "../constants/DibbyTypes";
import { ITransaction, calculateTrip } from "./DibbyLogic";

export const MAIN_SUB_TRIP_ID = "main";
export const ALL_SUB_TRIPS_ID = "all";

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  nextPayment?: ITransaction;
}

const toNumber = (value?: number | null) =>
  Number.isFinite(value as number) ? Number(value) : 0;

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const buildMainSubTrip = (trip: DibbyTrip): DibbySubTrip => ({
  id: MAIN_SUB_TRIP_ID,
  title: "Main",
  emoji: "🌍",
  participantIds: trip.participants.map((participant) => participant.uid),
  includeInParentTotals: true,
  order: 0,
  dateCreated: Timestamp.now(),
  dateUpdated: Timestamp.now(),
  stats: {
    expenseCount: 0,
    totalAmount: 0,
  },
});

const subTripsCollection = (tripId: string) =>
  collection(db, "trips", tripId, "subTrips");
const expensesCollection = (tripId: string) =>
  collection(db, "trips", tripId, "expenses");

const normalizeExpense = (expense: DibbyExpense, tripId: string): DibbyExpense => ({
  ...expense,
  tripId,
  subTripId: expense.subTripId || MAIN_SUB_TRIP_ID,
});

const normalizeSubTrip = (trip: DibbyTrip, subTrip: Partial<DibbySubTrip>): DibbySubTrip => ({
  ...buildMainSubTrip(trip),
  ...subTrip,
  id: subTrip.id || MAIN_SUB_TRIP_ID,
  title: subTrip.title || "Main",
  participantIds:
    subTrip.participantIds && subTrip.participantIds.length
      ? subTrip.participantIds
      : trip.participants.map((participant) => participant.uid),
});

export const ensureMainSubTripForTrip = async (trip: DibbyTrip) => {
  const mainRef = doc(db, "trips", trip.id, "subTrips", MAIN_SUB_TRIP_ID);
  const mainDoc = await getDoc(mainRef);
  if (mainDoc.exists()) {
    return mainDoc.data() as DibbySubTrip;
  }

  const mainSubTrip = buildMainSubTrip(trip);
  await setDoc(mainRef, mainSubTrip, { merge: true });
  return mainSubTrip;
};

export const listSubTrips = async (trip: DibbyTrip): Promise<DibbySubTrip[]> => {
  const subTripsRef = subTripsCollection(trip.id);
  const snap = await getDocs(query(subTripsRef, orderBy("order", "asc")));
  if (snap.empty) {
    const mainSubTrip = await ensureMainSubTripForTrip(trip);
    return [mainSubTrip];
  }

  const subTrips = snap.docs.map(
    (subTripDoc) =>
      normalizeSubTrip(trip, {
        ...(subTripDoc.data() as DibbySubTrip),
        id: subTripDoc.id,
      }),
  );
  return subTrips.sort((a, b) => a.order - b.order);
};

export const subscribeSubTrips = (
  trip: DibbyTrip,
  onUpdate: (subTrips: DibbySubTrip[]) => void,
) => {
  const subTripsRef = subTripsCollection(trip.id);
  return onSnapshot(query(subTripsRef, orderBy("order", "asc")), async (snap) => {
    if (snap.empty) {
      const mainSubTrip = await ensureMainSubTripForTrip(trip);
      onUpdate([mainSubTrip]);
      return;
    }
    const subTrips = snap.docs
      .map((subTripDoc) =>
        normalizeSubTrip(trip, {
          ...(subTripDoc.data() as DibbySubTrip),
          id: subTripDoc.id,
        }),
      )
      .sort((a, b) => a.order - b.order);
    onUpdate(subTrips);
  });
};

export const createSubTrip = async (
  trip: DibbyTrip,
  payload: {
    title: string;
    emoji?: string | null;
    participantIds?: string[];
    includeInParentTotals?: boolean;
  },
) => {
  const subTrips = await listSubTrips(trip);
  const newRef = doc(subTripsCollection(trip.id));
  const createdSubTrip: DibbySubTrip = {
    id: newRef.id,
    title: payload.title.trim() || "Group",
    emoji: payload.emoji || null,
    participantIds:
      payload.participantIds && payload.participantIds.length > 0
        ? payload.participantIds
        : trip.participants.map((participant) => participant.uid),
    includeInParentTotals: payload.includeInParentTotals ?? true,
    order: subTrips.length,
    dateCreated: Timestamp.now(),
    dateUpdated: Timestamp.now(),
  };
  await setDoc(newRef, createdSubTrip, { merge: true });
  return createdSubTrip;
};

export const listTripExpenses = async (
  trip: DibbyTrip,
): Promise<DibbyExpense[]> => {
  const expensesRef = expensesCollection(trip.id);
  const expenseSnap = await getDocs(query(expensesRef, orderBy("dateCreated", "desc")));
  if (expenseSnap.empty) {
    if (trip.expenses?.length) {
      await migrateTripExpensesToSubcollection(trip);
    }
    return trip.expenses.map((expense) => normalizeExpense(expense, trip.id));
  }
  return expenseSnap.docs.map((expenseDoc) =>
    normalizeExpense(expenseDoc.data() as DibbyExpense, trip.id),
  );
};

export const subscribeTripExpenses = (
  trip: DibbyTrip,
  onUpdate: (expenses: DibbyExpense[]) => void,
) => {
  const expensesRef = expensesCollection(trip.id);
  return onSnapshot(query(expensesRef, orderBy("dateCreated", "desc")), (snap) => {
    if (snap.empty) {
      if (trip.expenses?.length) {
        migrateTripExpensesToSubcollection(trip).catch(() => null);
      }
      onUpdate(trip.expenses.map((expense) => normalizeExpense(expense, trip.id)));
      return;
    }
    const expenses = snap.docs.map((expenseDoc) =>
      normalizeExpense(expenseDoc.data() as DibbyExpense, trip.id),
    );
    onUpdate(expenses);
  });
};

export const createTripExpense = async (tripId: string, expense: DibbyExpense) => {
  const expenseRef = doc(expensesCollection(tripId), expense.id);
  await setDoc(
    expenseRef,
    normalizeExpense(expense, tripId) as unknown as DocumentData,
    { merge: true },
  );
};

export const deleteTripExpense = async (tripId: string, expenseId: string) => {
  const expenseRef = doc(expensesCollection(tripId), expenseId);
  await deleteDoc(expenseRef);
};

export const migrateTripExpensesToSubcollection = async (trip: DibbyTrip) => {
  await ensureMainSubTripForTrip(trip);
  const legacyExpenses = trip.expenses || [];
  if (!legacyExpenses.length) {
    return;
  }
  const writes = legacyExpenses.map((expense) =>
    createTripExpense(trip.id, {
      ...expense,
      tripId: trip.id,
      subTripId: expense.subTripId || MAIN_SUB_TRIP_ID,
    }),
  );
  await Promise.all(writes);
};

export const computeLeaderboard = (
  trip: DibbyTrip,
  expenses: DibbyExpense[],
  scopeSubTripId: string = ALL_SUB_TRIPS_ID,
): LeaderboardResult => {
  const scopedExpenses =
    scopeSubTripId === ALL_SUB_TRIPS_ID
      ? expenses
      : expenses.filter(
          (expense) =>
            (expense.subTripId || MAIN_SUB_TRIP_ID) === scopeSubTripId,
        );

  const participantRows = trip.participants.map((participant) => {
    const paid = scopedExpenses.reduce((acc, expense) => {
      if (expense.paidBy === participant.uid) {
        return acc + toNumber(expense.amount);
      }
      return acc;
    }, 0);

    const share = scopedExpenses.reduce((acc, expense) => {
      const split = expense.peopleInExpense.find(
        (person) => person.uid === participant.uid,
      );
      return acc + toNumber(split?.amount);
    }, 0);

    const netBalance = roundMoney(paid - share);
    return {
      uid: participant.uid,
      displayName:
        participant.name || participant.username || "Unknown",
      paid: roundMoney(paid),
      share: roundMoney(share),
      netBalance,
      amountToPay: roundMoney(Math.max(0, -netBalance)),
      amountToReceive: roundMoney(Math.max(0, netBalance)),
      rank: 0,
      color: participant.color,
      photoURL: participant.photoURL,
    } as LeaderboardEntry;
  });

  const debtors = participantRows
    .filter((row) => row.amountToPay > 0)
    .sort((a, b) => b.amountToPay - a.amountToPay);
  const others = participantRows
    .filter((row) => row.amountToPay <= 0)
    .sort((a, b) => b.amountToReceive - a.amountToReceive);

  const rankedEntries = [...debtors, ...others].map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  const calculated = calculateTrip({
    ...trip,
    expenses: scopedExpenses,
  });
  const nextPayment = [...calculated.transactions].sort(
    (a, b) => b.amount - a.amount,
  )[0];

  return {
    entries: rankedEntries,
    nextPayment,
  };
};
