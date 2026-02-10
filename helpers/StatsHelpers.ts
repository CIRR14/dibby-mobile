import { DibbyExpense, DibbyTrip } from "../constants/DibbyTypes";
import { inRange, numberWithCommas, sumOfValues } from "./AppHelpers";
import { getDibbySplitMethodString } from "./TypeHelpers";

export type StatTone = "default" | "success" | "danger" | "accent" | "info";

export interface StatItem {
  id?: string;
  label: string;
  value: string;
  helper?: string;
  tone?: StatTone;
}

export const pickStats = (items: StatItem[], ids: string[]): StatItem[] => {
  return ids
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean) as StatItem[];
};

const formatMoney = (value: number, decimals = 2) =>
  `$${numberWithCommas(value.toString(), decimals)}`;

const formatMoneyOrDash = (value: number, hasValue = true) =>
  hasValue ? formatMoney(value) : "—";

const safeNumber = (value?: number | null) =>
  Number.isFinite(value as number) ? (value as number) : 0;

const getTripTotal = (trip: DibbyTrip) => {
  const amount = safeNumber(trip.amount);
  if (amount > 0) {
    return amount;
  }
  return sumOfValues(trip.expenses.map((e) => safeNumber(e.amount)));
};

const getUserShareForTrip = (trip: DibbyTrip, userId?: string | null) => {
  const participant = getUserParticipant(trip, userId);
  if (!participant) {
    return 0;
  }
  const amountPaid = safeNumber(participant.amountPaid);
  const owed = safeNumber(participant.owed);
  return amountPaid - owed;
};

const getUserParticipant = (trip: DibbyTrip, userId?: string | null) => {
  if (!userId) {
    return undefined;
  }
  return trip.participants.find((p) => p.uid === userId);
};

const getLargestTrip = (trips: DibbyTrip[]) => {
  return trips.reduce<
    | {
        trip: DibbyTrip;
        total: number;
      }
    | undefined
  >((acc, trip) => {
    const total = getTripTotal(trip);
    if (!acc || total > acc.total) {
      return { trip, total };
    }
    return acc;
  }, undefined);
};

const getCheapestTrip = (trips: DibbyTrip[]) => {
  return trips.reduce<
    | {
        trip: DibbyTrip;
        total: number;
      }
    | undefined
  >((acc, trip) => {
    const total = getTripTotal(trip);
    if (total <= 0) {
      return acc;
    }
    if (!acc || total < acc.total) {
      return { trip, total };
    }
    return acc;
  }, undefined);
};

const getLargestExpenseAcrossTrips = (trips: DibbyTrip[]) => {
  let largest:
    | {
        expense: DibbyExpense;
        trip: DibbyTrip;
        amount: number;
      }
    | undefined;
  trips.forEach((trip) => {
    trip.expenses.forEach((expense) => {
      const amount = safeNumber(expense.amount);
      if (!largest || amount > largest.amount) {
        largest = { expense, trip, amount };
      }
    });
  });
  return largest;
};

const getLargestExpense = (expenses: DibbyExpense[]) => {
  return expenses.reduce<
    | {
        expense: DibbyExpense;
        amount: number;
      }
    | undefined
  >((acc, expense) => {
    const amount = safeNumber(expense.amount);
    if (!acc || amount > acc.amount) {
      return { expense, amount };
    }
    return acc;
  }, undefined);
};

const getCheapestExpense = (expenses: DibbyExpense[]) => {
  return expenses.reduce<
    | {
        expense: DibbyExpense;
        amount: number;
      }
    | undefined
  >((acc, expense) => {
    const amount = safeNumber(expense.amount);
    if (amount <= 0) {
      return acc;
    }
    if (!acc || amount < acc.amount) {
      return { expense, amount };
    }
    return acc;
  }, undefined);
};

export const buildHomeStats = (
  trips: DibbyTrip[],
  _userId?: string | null,
): StatItem[] => {
  const totalTrips = trips.length;
  const totalSpent = trips.reduce((acc, t) => acc + getTripTotal(t), 0);
  const totalExpenses = trips.reduce((acc, t) => acc + t.expenses.length, 0);
  const avgTripSpend = totalTrips > 0 ? totalSpent / totalTrips : 0;
  const largestTrip = getLargestTrip(trips);
  const largestExpense = getLargestExpenseAcrossTrips(trips);
  const cheapestTrip = getCheapestTrip(trips);
  const userSpent = trips.reduce(
    (acc, t) => acc + getUserShareForTrip(t, _userId),
    0,
  );

  return [
    { id: "home-trips", label: "Trips", value: `${totalTrips}` },
    {
      id: "home-total-cost",
      label: "Total trips' cost",
      value: formatMoney(totalSpent),
    },
    {
      id: "home-avg-trip",
      label: "Avg trip cost",
      value: formatMoneyOrDash(avgTripSpend, totalTrips > 0),
    },
    {
      id: "home-user-spent",
      label: "User spent",
      value: formatMoney(userSpent),
    },
    { id: "home-expenses", label: "Total expenses", value: `${totalExpenses}` },
    {
      id: "home-largest-trip",
      label: "Largest trip",
      value: formatMoneyOrDash(largestTrip?.total || 0, Boolean(largestTrip)),
      helper: largestTrip?.trip.title || undefined,
      tone: "accent",
    },
    {
      id: "home-largest-expense",
      label: "Largest expense",
      value: formatMoneyOrDash(
        largestExpense?.amount || 0,
        Boolean(largestExpense),
      ),
      helper: largestExpense
        ? [largestExpense.expense.title, largestExpense.trip.title]
            .filter(Boolean)
            .join(" • ")
        : undefined,
    },
    {
      id: "home-cheapest-trip",
      label: "Cheapest trip",
      value: formatMoneyOrDash(cheapestTrip?.total || 0, Boolean(cheapestTrip)),
      helper: cheapestTrip?.trip.title || undefined,
    },
  ];
};

export const buildTripStats = (
  trip: DibbyTrip,
  _userId?: string | null,
  _suggestedPayments = 0,
): StatItem[] => {
  const totalSpent = getTripTotal(trip);
  const expensesCount = trip.expenses.length;
  const avgPerExpense = expensesCount > 0 ? totalSpent / expensesCount : 0;
  const avgPerPerson =
    trip.participants.length > 0 ? totalSpent / trip.participants.length : 0;
  const openBalances = trip.participants.filter(
    (t) => !inRange(t.owed, -0.01, 0.01),
  ).length;
  const largestExpense = getLargestExpense(trip.expenses);
  const cheapestExpense = getCheapestExpense(trip.expenses);
  const userSpent = getUserShareForTrip(trip, _userId);

  return [
    {
      id: "trip-total",
      label: "Total trip cost",
      value: formatMoney(totalSpent),
    },
    {
      id: "trip-avg-expense",
      label: "Avg expense cost",
      value: formatMoneyOrDash(avgPerExpense, expensesCount > 0),
    },
    {
      id: "trip-user-spent",
      label: "Spent this trip",
      value: formatMoney(userSpent),
    },
    { id: "trip-expenses", label: "Expenses", value: `${expensesCount}` },
    {
      id: "trip-largest-expense",
      label: "Largest expense",
      value: formatMoneyOrDash(
        largestExpense?.amount || 0,
        Boolean(largestExpense),
      ),
      helper: largestExpense?.expense.title || undefined,
      tone: "accent",
    },
    {
      id: "trip-cheapest-expense",
      label: "Cheapest expense",
      value: formatMoneyOrDash(
        cheapestExpense?.amount || 0,
        Boolean(cheapestExpense),
      ),
      helper: cheapestExpense?.expense.title || undefined,
    },
    {
      id: "trip-avg-person",
      label: "Avg / person",
      value: formatMoney(avgPerPerson),
    },
    { id: "trip-open", label: "Open balances", value: `${openBalances}` },
  ];
};

export const buildExpenseStats = (
  expense: DibbyExpense,
  trip?: DibbyTrip,
  userId?: string | null,
): StatItem[] => {
  const participantCount = expense.peopleInExpense.length;
  const avgShare =
    participantCount > 0 ? safeNumber(expense.amount) / participantCount : 0;
  const splitLabel = getDibbySplitMethodString(expense.splitMethod);
  const paidByName =
    trip?.participants.find((p) => p.uid === expense.paidBy)?.name || "—";
  const userSplit = expense.peopleInExpense.find((p) => p.uid === userId);
  const youPaid = expense.paidBy === userId ? safeNumber(expense.amount) : 0;
  const youOwe = expense.paidBy === userId ? 0 : safeNumber(userSplit?.amount);

  return [
    {
      id: "expense-amount",
      label: "Amount",
      value: formatMoney(safeNumber(expense.amount)),
    },
    { id: "expense-split", label: "Split", value: splitLabel },
    {
      id: "expense-participants",
      label: "Participants",
      value: `${participantCount}`,
    },
    { id: "expense-paid-by", label: "Paid by", value: paidByName },
    { id: "expense-avg", label: "Avg share", value: formatMoney(avgShare) },
    {
      id: "expense-you-paid",
      label: "You paid",
      value: formatMoney(youPaid),
      helper: youPaid > 0 ? "Paid by you" : "—",
      tone: youPaid > 0 ? "success" : "default",
    },
    {
      id: "expense-you-owe",
      label: "You owe",
      value: formatMoney(youOwe),
      helper: youOwe > 0 ? "Your share" : "—",
      tone: youOwe > 0 ? "danger" : "default",
    },
  ];
};

export const buildProfileStats = (
  trips: DibbyTrip[],
  userId?: string | null,
  friendCount = 0,
): StatItem[] => {
  const totalTrips = trips.length;
  const totalSpent = trips.reduce((acc, t) => acc + getTripTotal(t), 0);
  const totalExpenses = trips.reduce((acc, t) => acc + t.expenses.length, 0);
  const avgPerTrip = totalTrips > 0 ? totalSpent / totalTrips : 0;
  const avgPerExpense = totalExpenses > 0 ? totalSpent / totalExpenses : 0;
  const largestTrip = getLargestTrip(trips);
  const largestExpense = getLargestExpenseAcrossTrips(trips);
  const userPaid = trips.reduce((acc, t) => {
    const participant = getUserParticipant(t, userId);
    return acc + safeNumber(participant?.amountPaid);
  }, 0);
  const userNet = trips.reduce((acc, t) => {
    const participant = getUserParticipant(t, userId);
    return acc + safeNumber(participant?.owed);
  }, 0);

  return [
    { id: "profile-trips", label: "Trips", value: `${totalTrips}` },
    { id: "profile-friends", label: "Friends", value: `${friendCount}` },
    {
      id: "profile-total-spent",
      label: "Total trip cost",
      value: formatMoney(totalSpent),
    },
    { id: "profile-expenses", label: "Expenses", value: `${totalExpenses}` },
    {
      id: "profile-avg-trip",
      label: "Avg per trip",
      value: formatMoneyOrDash(avgPerTrip, totalTrips > 0),
    },
    {
      id: "profile-avg-expense",
      label: "Avg per expense",
      value: formatMoneyOrDash(avgPerExpense, totalExpenses > 0),
    },
    {
      id: "profile-largest-trip",
      label: "Largest trip",
      value: formatMoneyOrDash(largestTrip?.total || 0, Boolean(largestTrip)),
      helper: largestTrip?.trip.title || undefined,
      tone: "accent",
    },
    {
      id: "profile-largest-expense",
      label: "Largest expense",
      value: formatMoneyOrDash(
        largestExpense?.amount || 0,
        Boolean(largestExpense),
      ),
      helper: largestExpense
        ? [largestExpense.expense.title, largestExpense.trip.title]
            .filter(Boolean)
            .join(" • ")
        : undefined,
    },
    { id: "profile-you-paid", label: "You paid", value: formatMoney(userPaid) },
    {
      id: "profile-net",
      label: "Net balance",
      value: formatMoney(Math.abs(userNet)),
      helper: userNet >= 0 ? "Gets back" : "Owes",
      tone: userNet >= 0 ? "success" : "danger",
    },
  ];
};
