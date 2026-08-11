import {
  DibbyExpense,
  DibbyParticipant,
  DibbySplitMethod,
  DibbyTrip,
  DibbyUser,
} from "../../constants/DibbyTypes";
import {
  applyTripPaymentToTrip,
  calculateTrip,
  linkGuestParticipantToUser,
} from "../DibbyLogic";

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

  it("uses participant balances when recorded payments changed balances after expenses", () => {
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

    alice.owed = 20;
    bob.owed = -20;

    const trip = makeTrip([alice, bob], [expense]);
    const result = calculateTrip(trip);

    expect(result.transactions).toHaveLength(1);
    const transaction = result.transactions[0];
    expect(transaction.owee.uid).toBe(bob.uid);
    expect(transaction.owed.uid).toBe(alice.uid);
    expect(transaction.amount).toBeCloseTo(20, 2);
  });

  it("handles a 14-person trip with backfilled big expenses, mixed payments, and later trip spend", () => {
    const travelers = Array.from({ length: 14 }, (_, index) =>
      makeParticipant(`traveler-${index + 1}`, `Traveler ${index + 1}`),
    );
    const byId = (id: string) => {
      const traveler = travelers.find((participant) => participant.uid === id);
      if (!traveler) {
        throw new Error(`Missing traveler ${id}`);
      }
      return traveler;
    };
    const equalSplit = (participantIds: string[]) =>
      participantIds.map((uid) => ({
        uid,
        name: byId(uid).name || uid,
        amount: 0,
      }));

    const allTravelerIds = travelers.map((traveler) => traveler.uid);
    const activityTravelerIds = [
      "traveler-2",
      "traveler-3",
      "traveler-4",
      "traveler-5",
      "traveler-6",
      "traveler-7",
      "traveler-8",
      "traveler-9",
    ];
    const vanTravelerIds = [
      "traveler-1",
      "traveler-2",
      "traveler-3",
      "traveler-4",
      "traveler-5",
      "traveler-6",
      "traveler-7",
      "traveler-8",
    ];
    const boatTravelerIds = [
      "traveler-6",
      "traveler-7",
      "traveler-8",
      "traveler-9",
      "traveler-10",
      "traveler-11",
      "traveler-12",
      "traveler-13",
      "traveler-14",
    ];

    const expenses = [
      makeExpense({
        id: "airbnb",
        title: "Airbnb",
        amount: 7000,
        paidBy: "traveler-1",
        splitMethod: DibbySplitMethod.EQUAL_PARTS,
        peopleInExpense: equalSplit(allTravelerIds),
      }),
      makeExpense({
        id: "activity",
        title: "Activity",
        amount: 1600,
        paidBy: "traveler-2",
        splitMethod: DibbySplitMethod.EQUAL_PARTS,
        peopleInExpense: equalSplit(activityTravelerIds),
      }),
      makeExpense({
        id: "dinner",
        title: "Welcome Dinner",
        amount: 420,
        paidBy: "traveler-3",
        splitMethod: DibbySplitMethod.EQUAL_PARTS,
        peopleInExpense: equalSplit(allTravelerIds),
      }),
      makeExpense({
        id: "van",
        title: "Van",
        amount: 280,
        paidBy: "traveler-8",
        splitMethod: DibbySplitMethod.EQUAL_PARTS,
        peopleInExpense: equalSplit(vanTravelerIds),
      }),
      makeExpense({
        id: "groceries",
        title: "Groceries",
        amount: 350,
        paidBy: "traveler-13",
        splitMethod: DibbySplitMethod.EQUAL_PARTS,
        peopleInExpense: equalSplit(allTravelerIds),
      }),
      makeExpense({
        id: "boat",
        title: "Boat Taxi",
        amount: 270,
        paidBy: "traveler-6",
        splitMethod: DibbySplitMethod.EQUAL_PARTS,
        peopleInExpense: equalSplit(boatTravelerIds),
      }),
    ];

    const tripAfterExpenses = makeTrip(
      travelers.map((traveler) => {
        const owedByTraveler: Record<string, number> = {
          "traveler-1": 6410,
          "traveler-2": 810,
          "traveler-3": -370,
          "traveler-4": -790,
          "traveler-5": -790,
          "traveler-6": -550,
          "traveler-7": -820,
          "traveler-8": -540,
          "traveler-9": -785,
          "traveler-10": -585,
          "traveler-11": -585,
          "traveler-12": -585,
          "traveler-13": -235,
          "traveler-14": -585,
        };

        return {
          ...traveler,
          owed: owedByTraveler[traveler.uid],
        };
      }),
      expenses,
    );

    const finalTrip = [
      { fromUid: "traveler-4", toUid: "traveler-1", amountPaid: 500 },
      { fromUid: "traveler-5", toUid: "traveler-1", amountPaid: 500 },
      { fromUid: "traveler-10", toUid: "traveler-1", amountPaid: 500 },
      { fromUid: "traveler-11", toUid: "traveler-1", amountPaid: 500 },
      { fromUid: "traveler-6", toUid: "traveler-1", amountPaid: 300 },
      { fromUid: "traveler-7", toUid: "traveler-1", amountPaid: 200 },
      { fromUid: "traveler-12", toUid: "traveler-1", amountPaid: 250 },
      { fromUid: "traveler-3", toUid: "traveler-2", amountPaid: 200 },
      { fromUid: "traveler-4", toUid: "traveler-2", amountPaid: 200 },
      { fromUid: "traveler-5", toUid: "traveler-2", amountPaid: 200 },
      { fromUid: "traveler-6", toUid: "traveler-2", amountPaid: 100 },
    ].reduce((trip, payment) => applyTripPaymentToTrip(trip, payment), tripAfterExpenses);

    const balances = Object.fromEntries(
      finalTrip.participants.map((participant) => [participant.uid, participant.owed]),
    );

    expect(balances).toEqual({
      "traveler-1": 3660,
      "traveler-2": 110,
      "traveler-3": -170,
      "traveler-4": -90,
      "traveler-5": -90,
      "traveler-6": -150,
      "traveler-7": -620,
      "traveler-8": -540,
      "traveler-9": -785,
      "traveler-10": -85,
      "traveler-11": -85,
      "traveler-12": -335,
      "traveler-13": -235,
      "traveler-14": -585,
    });

    const result = calculateTrip(finalTrip);
    const totalsByCreditor = result.transactions.reduce<Record<string, number>>(
      (acc, transaction) => {
        acc[transaction.owed.uid] = (acc[transaction.owed.uid] || 0) + transaction.amount;
        return acc;
      },
      {},
    );
    const totalSuggested = result.transactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    );

    expect(result.finalNumberOfTransactions).toBe(13);
    expect(totalSuggested).toBeCloseTo(3770, 2);
    expect(totalsByCreditor).toEqual({
      "traveler-1": 3660,
      "traveler-2": 110,
    });
    expect(
      result.transactions.find((transaction) => transaction.owee.uid === "traveler-4")?.amount,
    ).toBeCloseTo(90, 2);
    expect(
      result.transactions.find((transaction) => transaction.owee.uid === "traveler-9")?.amount,
    ).toBeCloseTo(785, 2);
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

    expect(() =>
      linkGuestParticipantToUser(trip, alice.uid, targetUser),
    ).toThrow("Only guest travelers");
  });
});
