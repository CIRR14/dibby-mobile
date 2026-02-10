import {
  DibbyExpense,
  DibbyParticipant,
  DibbySplitMethod,
  DibbyTrip,
} from "../../constants/DibbyTypes";
import { calculateTrip } from "../DibbyLogic";

const makeParticipant = (uid: string, name: string): DibbyParticipant => ({
  uid,
  name,
  username: name.toLowerCase(),
  owed: 0,
  amountPaid: 0,
  color: "",
  photoURL: null,
});

const makeExpense = (overrides: Partial<DibbyExpense>): DibbyExpense => ({
  id: overrides.id || "expense-id",
  title: overrides.title || "Expense",
  description: overrides.description || "",
  amount: overrides.amount || 0,
  createdBy: overrides.createdBy || "creator",
  dateCreated: overrides.dateCreated || ({} as any),
  dateUpdated: overrides.dateUpdated || ({} as any),
  perPersonAverage: overrides.perPersonAverage || 0,
  paidBy: overrides.paidBy || "payer",
  splitMethod: overrides.splitMethod || DibbySplitMethod.EQUAL_PARTS,
  peopleInExpense: overrides.peopleInExpense || [],
  emoji: overrides.emoji || null,
});

const makeTrip = (
  participants: DibbyParticipant[],
  expenses: DibbyExpense[],
): DibbyTrip => ({
  id: "trip-id",
  title: "Trip",
  description: "",
  amount: expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
  createdBy: participants[0]?.uid || "creator",
  dateCreated: {} as any,
  dateUpdated: {} as any,
  perPersonAverage: 0,
  expenses,
  participants,
  completed: false,
});

describe("calculateTrip", () => {
  it("creates a single transaction for a two-person equal split", () => {
    const alice = makeParticipant("a", "Alice");
    const bob = makeParticipant("b", "Bob");
    const expense = makeExpense({
      amount: 100,
      paidBy: alice.uid,
      splitMethod: DibbySplitMethod.EQUAL_PARTS,
      peopleInExpense: [
        { uid: alice.uid, name: alice.name || "Alice", amount: 0 },
        { uid: bob.uid, name: bob.name || "Bob", amount: 0 },
      ],
    });

    const trip = makeTrip([alice, bob], [expense]);
    const result = calculateTrip(trip);

    expect(result.transactions).toHaveLength(1);
    expect(result.finalNumberOfTransactions).toBe(1);
    const transaction = result.transactions[0];
    expect(transaction.owee.uid).toBe(bob.uid);
    expect(transaction.owed.uid).toBe(alice.uid);
    expect(transaction.amount).toBeCloseTo(50, 2);
  });

  it("minimizes transactions for a three-person mixed split", () => {
    const alice = makeParticipant("a", "Alice");
    const bob = makeParticipant("b", "Bob");
    const chris = makeParticipant("c", "Chris");

    const expense1 = makeExpense({
      id: "expense-1",
      amount: 60,
      paidBy: alice.uid,
      splitMethod: DibbySplitMethod.AMOUNT,
      peopleInExpense: [
        { uid: alice.uid, name: alice.name || "Alice", amount: 30 },
        { uid: bob.uid, name: bob.name || "Bob", amount: 30 },
      ],
    });

    const expense2 = makeExpense({
      id: "expense-2",
      amount: 30,
      paidBy: chris.uid,
      splitMethod: DibbySplitMethod.EQUAL_PARTS,
      peopleInExpense: [
        { uid: alice.uid, name: alice.name || "Alice", amount: 0 },
        { uid: bob.uid, name: bob.name || "Bob", amount: 0 },
        { uid: chris.uid, name: chris.name || "Chris", amount: 0 },
      ],
    });

    const trip = makeTrip([alice, bob, chris], [expense1, expense2]);
    const result = calculateTrip(trip);

    expect(result.transactions).toHaveLength(2);
    const totalsByCreditor = result.transactions.reduce<Record<string, number>>(
      (acc, tx) => {
        acc[tx.owed.uid] = (acc[tx.owed.uid] || 0) + tx.amount;
        return acc;
      },
      {},
    );
    const debtors = new Set(result.transactions.map((tx) => tx.owee.uid));
    expect(debtors.size).toBe(1);
    expect(debtors.has(bob.uid)).toBe(true);
    expect(totalsByCreditor[alice.uid]).toBeCloseTo(20, 2);
    expect(totalsByCreditor[chris.uid]).toBeCloseTo(20, 2);
  });

  it("handles amount splits with a single payer", () => {
    const alice = makeParticipant("a", "Alice");
    const bob = makeParticipant("b", "Bob");
    const expense = makeExpense({
      amount: 70,
      paidBy: alice.uid,
      splitMethod: DibbySplitMethod.AMOUNT,
      peopleInExpense: [
        { uid: alice.uid, name: alice.name || "Alice", amount: 20 },
        { uid: bob.uid, name: bob.name || "Bob", amount: 50 },
      ],
    });

    const trip = makeTrip([alice, bob], [expense]);
    const result = calculateTrip(trip);

    expect(result.transactions).toHaveLength(1);
    const transaction = result.transactions[0];
    expect(transaction.owee.uid).toBe(bob.uid);
    expect(transaction.owed.uid).toBe(alice.uid);
    expect(transaction.amount).toBeCloseTo(50, 2);
  });

  it("falls back to participant balances when expense data is inconsistent", () => {
    const alice = makeParticipant("a", "Alice");
    const bob = makeParticipant("b", "Bob");
    alice.owed = 25;
    bob.owed = -25;

    const inconsistentExpense = makeExpense({
      amount: 100,
      paidBy: "ghost-payer",
      splitMethod: DibbySplitMethod.AMOUNT,
      peopleInExpense: [
        { uid: alice.uid, name: alice.name || "Alice", amount: 40 },
        { uid: bob.uid, name: bob.name || "Bob", amount: 40 },
      ],
    });

    const trip = makeTrip([alice, bob], [inconsistentExpense]);
    const result = calculateTrip(trip);

    expect(result.transactions).toHaveLength(1);
    const transaction = result.transactions[0];
    expect(transaction.owee.uid).toBe(bob.uid);
    expect(transaction.owed.uid).toBe(alice.uid);
    expect(transaction.amount).toBeCloseTo(25, 2);
  });
});
