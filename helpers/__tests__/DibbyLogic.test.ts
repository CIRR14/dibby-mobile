import {
  DibbyExpense,
  DibbyParticipant,
  DibbySplitMethod,
  DibbyTrip,
  DibbyUser,
} from "../../constants/DibbyTypes";
import { calculateTrip, linkGuestParticipantToUser } from "../DibbyLogic";

const makeParticipant = (uid: string, name: string): DibbyParticipant => ({
  uid,
  name,
  username: name.toLowerCase(),
  owed: 0,
  amountPaid: 0,
  color: "",
  photoURL: null,
});

const makeUser = (uid: string, username: string, name: string): DibbyUser => ({
  uid,
  username,
  displayName: name,
  photoURL: "https://example.com/avatar.png",
  email: `${username}@example.com`,
  friends: [],
  trips: [],
  color: "#123456",
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

describe("linkGuestParticipantToUser", () => {
  it("replaces a guest participant with a real user while preserving balances", () => {
    const alice = makeParticipant("a", "Alice");
    const guest = {
      ...makeParticipant("guest-1", "Jordan"),
      username: "jordan-guest",
      createdUser: true,
      owed: -25,
      amountPaid: 100,
      color: "#abcdef",
    };
    const targetUser = makeUser("u-jordan", "jordan", "Jordan Lee");
    const expense = makeExpense({
      amount: 100,
      paidBy: guest.uid,
      peopleInExpense: [
        { uid: alice.uid, name: "Alice", amount: 50 },
        { uid: guest.uid, name: "Jordan", amount: 50 },
      ],
    });
    const trip = makeTrip([alice, guest], [expense]);

    const result = linkGuestParticipantToUser(trip, guest.uid, targetUser);
    const linkedParticipant = result.participants.find(
      (participant) => participant.uid === targetUser.uid,
    );

    expect(result.participants).toHaveLength(2);
    expect(linkedParticipant).toMatchObject({
      uid: targetUser.uid,
      username: targetUser.username,
      name: targetUser.displayName,
      photoURL: targetUser.photoURL,
      color: targetUser.color,
      createdUser: false,
      owed: guest.owed,
      amountPaid: guest.amountPaid,
    });
    expect(result.expenses[0].paidBy).toBe(targetUser.uid);
    expect(result.expenses[0].peopleInExpense).toEqual([
      { uid: alice.uid, name: "Alice", amount: 50 },
      { uid: targetUser.uid, name: targetUser.displayName, amount: 50 },
    ]);
  });

  it("leaves unrelated participants and expenses unchanged", () => {
    const alice = makeParticipant("a", "Alice");
    const guest = {
      ...makeParticipant("guest-1", "Jordan"),
      createdUser: true,
    };
    const targetUser = makeUser("u-jordan", "jordan", "Jordan Lee");
    const unrelatedExpense = makeExpense({
      id: "expense-2",
      amount: 40,
      paidBy: alice.uid,
      peopleInExpense: [{ uid: alice.uid, name: "Alice", amount: 40 }],
    });
    const trip = makeTrip([alice, guest], [unrelatedExpense]);

    const result = linkGuestParticipantToUser(trip, guest.uid, targetUser);

    expect(result.participants[0]).toEqual(alice);
    expect(result.expenses[0]).toEqual(unrelatedExpense);
  });

  it("blocks linking when the target user is already in the trip", () => {
    const alice = makeParticipant("a", "Alice");
    const guest = {
      ...makeParticipant("guest-1", "Jordan"),
      createdUser: true,
    };
    const targetUser = makeUser("a", "alice", "Alice");
    const trip = makeTrip([alice, guest], []);

    expect(() =>
      linkGuestParticipantToUser(trip, guest.uid, targetUser),
    ).toThrow("already a traveler");
  });

  it("fails cleanly when the guest is missing", () => {
    const alice = makeParticipant("a", "Alice");
    const targetUser = makeUser("u-jordan", "jordan", "Jordan Lee");
    const trip = makeTrip([alice], []);

    expect(() =>
      linkGuestParticipantToUser(trip, "missing-guest", targetUser),
    ).toThrow("no longer in this trip");
  });

  it("does not link an existing account participant as if they were a guest", () => {
    const alice = makeParticipant("a", "Alice");
    const targetUser = makeUser("u-jordan", "jordan", "Jordan Lee");
    const trip = makeTrip([alice], []);

    expect(() => linkGuestParticipantToUser(trip, alice.uid, targetUser)).toThrow(
      "Only guest travelers",
    );
  });
});
