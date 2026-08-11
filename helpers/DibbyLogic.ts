import {
  DibbyExpense,
  DibbyParticipant,
  DibbyPaymentStatus,
  DibbySplitMethod,
  DibbyTrip,
  DibbyUser,
  DibbyTripPayment,
} from "../constants/DibbyTypes";
import { numberWithCommas } from "./AppHelpers";

export interface ITransaction {
  owed: DibbyParticipant;
  owee: DibbyParticipant;
  amount: number;
}

export interface ITransactionResponse {
  transactions: ITransaction[];
  finalNumberOfTransactions: number;
}

const maxNumberOfTransactions = 200;
const centsPrecision = 100;

const toCents = (value?: number | string | null): number => {
  const numeric = Number(value) || 0;
  return Math.round(numeric * centsPrecision);
};

const fromCents = (cents: number): number => Math.round(cents) / centsPrecision;

const roundMoney = (value: number): number =>
  Number(fromCents(Math.round(value * centsPrecision)).toFixed(2));

const isZeroCents = (value: number) => Math.abs(value) < 1;

const buildParticipantMap = (trip: DibbyTrip) =>
  new Map(trip.participants.map((p) => [p.uid, p]));

const normalizeSplits = (
  expense: DibbyExpense,
  participantIds: string[],
): { uid: string; amountCents: number }[] => {
  const totalCents = toCents(expense.amount);
  const splits =
    expense.peopleInExpense && expense.peopleInExpense.length > 0
      ? expense.peopleInExpense.map((s) => ({
          uid: s.uid,
          amountCents: toCents(s.amount),
        }))
      : participantIds.map((uid) => ({
          uid,
          amountCents: 0,
        }));

  if (!splits.length || totalCents === 0) {
    return [];
  }

  if (expense.splitMethod === DibbySplitMethod.EQUAL_PARTS) {
    const base = Math.floor(totalCents / splits.length);
    const remainder = totalCents - base * splits.length;
    return splits.map((split, index) => ({
      uid: split.uid,
      amountCents: base + (index === 0 ? remainder : 0),
    }));
  }

  const sumCents = splits.reduce((acc, s) => acc + s.amountCents, 0);
  const remainder = totalCents - sumCents;
  if (remainder !== 0) {
    return splits.map((split, index) => ({
      uid: split.uid,
      amountCents: split.amountCents + (index === 0 ? remainder : 0),
    }));
  }

  return splits;
};

const buildBalancesFromExpenses = (trip: DibbyTrip): Map<string, number> => {
  const participantIds = trip.participants.map((p) => p.uid);
  const balances = new Map<string, number>();

  participantIds.forEach((uid) => balances.set(uid, 0));

  trip.expenses.forEach((expense) => {
    const totalCents = toCents(expense.amount);
    if (!totalCents) {
      return;
    }
    if (balances.has(expense.paidBy)) {
      balances.set(
        expense.paidBy,
        (balances.get(expense.paidBy) || 0) + totalCents,
      );
    }

    const splits = normalizeSplits(expense, participantIds);
    splits.forEach((split) => {
      if (!balances.has(split.uid)) {
        return;
      }
      balances.set(
        split.uid,
        (balances.get(split.uid) || 0) - split.amountCents,
      );
    });
  });

  return balances;
};

const buildBalancesFromParticipants = (
  trip: DibbyTrip,
): Map<string, number> => {
  const balances = new Map<string, number>();
  trip.participants.forEach((p) => {
    balances.set(p.uid, toCents(p.owed));
  });
  return balances;
};

const balancesMatchWithinCent = (
  trip: DibbyTrip,
  left: Map<string, number>,
  right: Map<string, number>,
): boolean =>
  trip.participants.every((participant) =>
    isZeroCents(
      (left.get(participant.uid) || 0) - (right.get(participant.uid) || 0),
    ),
  );

const minimizeTransactions = (
  trip: DibbyTrip,
  balances: Map<string, number>,
): ITransaction[] => {
  const participantsById = buildParticipantMap(trip);
  const creditors = [] as { uid: string; amountCents: number }[];
  const debtors = [] as { uid: string; amountCents: number }[];

  balances.forEach((amountCents, uid) => {
    if (isZeroCents(amountCents)) {
      return;
    }
    if (amountCents > 0) {
      creditors.push({ uid, amountCents });
    } else {
      debtors.push({ uid, amountCents });
    }
  });

  creditors.sort((a, b) => b.amountCents - a.amountCents);
  debtors.sort((a, b) => a.amountCents - b.amountCents);

  const transactions: ITransaction[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (
    creditorIndex < creditors.length &&
    debtorIndex < debtors.length &&
    transactions.length < maxNumberOfTransactions
  ) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const amount = Math.min(creditor.amountCents, -debtor.amountCents);

    if (amount <= 0) {
      break;
    }

    const owed = participantsById.get(creditor.uid);
    const owee = participantsById.get(debtor.uid);

    if (owed && owee) {
      transactions.push({
        owed,
        owee,
        amount: roundMoney(fromCents(amount)),
      });
    }

    creditor.amountCents -= amount;
    debtor.amountCents += amount;

    if (isZeroCents(creditor.amountCents)) {
      creditorIndex += 1;
    }
    if (isZeroCents(debtor.amountCents)) {
      debtorIndex += 1;
    }
  }

  return transactions;
};

export const calculateTrip = (trip: DibbyTrip): ITransactionResponse => {
  const expenseBalances = buildBalancesFromExpenses(trip);
  const participantBalances = buildBalancesFromParticipants(trip);
  const participantHasAnyBalance = Array.from(
    participantBalances.values(),
  ).some((value) => !isZeroCents(value));

  const useExpenseBalances =
    balancesMatchWithinCent(trip, expenseBalances, participantBalances) ||
    !participantHasAnyBalance;

  const balances = new Map(
    useExpenseBalances ? expenseBalances : participantBalances,
  );

  const remainder = Array.from(balances.values()).reduce(
    (acc, value) => acc + value,
    0,
  );
  if (!isZeroCents(remainder)) {
    const firstParticipant = trip.participants[0];
    if (firstParticipant) {
      balances.set(
        firstParticipant.uid,
        (balances.get(firstParticipant.uid) || 0) - remainder,
      );
    }
  }

  const transactions = minimizeTransactions(trip, balances);

  return {
    transactions,
    finalNumberOfTransactions: transactions.length,
  };
};

export const linkGuestParticipantToUser = (
  trip: DibbyTrip,
  guestUid: string,
  targetUser: DibbyUser,
): DibbyTrip => {
  const guestParticipant = trip.participants.find((p) => p.uid === guestUid);

  if (!guestParticipant) {
    throw new Error("Guest traveler is no longer in this trip.");
  }

  if (!guestParticipant.createdUser) {
    throw new Error("Only guest travelers can be linked to an account.");
  }

  const targetAlreadyInTrip = trip.participants.some(
    (p) =>
      p.uid === targetUser.uid ||
      (!p.createdUser &&
        Boolean(targetUser.username) &&
        p.username === targetUser.username),
  );

  if (targetAlreadyInTrip) {
    throw new Error("This user is already a traveler in the trip.");
  }

  const linkedParticipant: DibbyParticipant = {
    ...guestParticipant,
    uid: targetUser.uid,
    name: targetUser.displayName,
    username: targetUser.username,
    photoURL: targetUser.photoURL,
    color: targetUser.color,
    createdUser: false,
  };

  return {
    ...trip,
    participants: trip.participants.map((participant) =>
      participant.uid === guestUid ? linkedParticipant : participant,
    ),
    expenses: trip.expenses.map((expense) => ({
      ...expense,
      paidBy: expense.paidBy === guestUid ? targetUser.uid : expense.paidBy,
      peopleInExpense: expense.peopleInExpense.map((split) =>
        split.uid === guestUid
          ? {
              ...split,
              uid: targetUser.uid,
              name: targetUser.displayName || guestParticipant.name || "",
            }
          : split,
      ),
    })),
  };
};

export const buildTripPaymentStatus = (
  amount: number,
  amountPaid: number,
): DibbyPaymentStatus => {
  if (amountPaid >= amount) {
    return DibbyPaymentStatus.PAID;
  }
  return DibbyPaymentStatus.PARTIAL;
};

export const applyTripPaymentToTrip = (
  trip: DibbyTrip,
  payment: Pick<DibbyTripPayment, "fromUid" | "toUid" | "amountPaid">,
): DibbyTrip => {
  const amountPaid = roundMoney(payment.amountPaid);

  if (amountPaid <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  if (payment.fromUid === payment.toUid) {
    throw new Error("Payment participants must be different.");
  }

  const payer = trip.participants.find(
    (participant) => participant.uid === payment.fromUid,
  );
  const payee = trip.participants.find(
    (participant) => participant.uid === payment.toUid,
  );

  if (!payer || !payee) {
    throw new Error("Payment participants are no longer in this trip.");
  }

  if (payer.owed >= 0) {
    throw new Error("The payer does not currently owe a balance.");
  }

  if (payee.owed <= 0) {
    throw new Error(
      "The recipient does not currently have a receivable balance.",
    );
  }

  const payerOwes = Math.abs(roundMoney(payer.owed));
  const payeeReceives = roundMoney(payee.owed);
  const maxPayable = roundMoney(Math.min(payerOwes, payeeReceives));

  if (amountPaid > maxPayable + 0.01) {
    throw new Error("Payment amount exceeds the current open balance.");
  }

  const updatedTripParticipants = trip.participants.map((participant) => {
    if (participant.uid === payment.fromUid) {
      return {
        ...participant,
        owed: roundMoney(participant.owed + amountPaid),
      };
    }

    if (participant.uid === payment.toUid) {
      return {
        ...participant,
        owed: roundMoney(participant.owed - amountPaid),
      };
    }

    return participant;
  });

  return {
    ...trip,
    participants: updatedTripParticipants,
  };
};

export const revertTripPaymentFromTrip = (
  trip: DibbyTrip,
  payment: Pick<DibbyTripPayment, "fromUid" | "toUid" | "amountPaid">,
): DibbyTrip => {
  const amountPaid = roundMoney(payment.amountPaid);

  if (amountPaid <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  if (payment.fromUid === payment.toUid) {
    throw new Error("Payment participants must be different.");
  }

  const payer = trip.participants.find(
    (participant) => participant.uid === payment.fromUid,
  );
  const payee = trip.participants.find(
    (participant) => participant.uid === payment.toUid,
  );

  if (!payer || !payee) {
    throw new Error("Payment participants are no longer in this trip.");
  }

  const updatedTripParticipants = trip.participants.map((participant) => {
    if (participant.uid === payment.fromUid) {
      return {
        ...participant,
        owed: roundMoney(participant.owed - amountPaid),
      };
    }

    if (participant.uid === payment.toUid) {
      return {
        ...participant,
        owed: roundMoney(participant.owed + amountPaid),
      };
    }

    return participant;
  });

  return {
    ...trip,
    participants: updatedTripParticipants,
  };
};

export const getTransactionString = (transaction: ITransaction): string => {
  return `💰 ${transaction.owee.name} owes ${transaction.owed.name}: $${numberWithCommas(
    transaction.amount.toString(),
  )}`;
};

export const getAmountOfTransactionsString = (
  numberOfTransactions: number,
): string => {
  return ` Number of transactions: ${numberOfTransactions}`;
};

export const checkResults = (
  ogTrip: DibbyTrip,
  finalTransactions: ITransaction[],
): boolean => {
  finalTransactions.forEach((t) => {
    //
  });

  ogTrip.expenses.forEach((e) => {
    // each expense -> go through each traveler in the expense
    // if payer ->
    // if not payer ->
    // each traveler in the expense should
  });
  return true;
};
