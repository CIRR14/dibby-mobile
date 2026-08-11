import {
  DibbyExpense,
  DibbyParticipant,
  DibbySplitMethod,
  DibbyTrip,
} from "../../constants/DibbyTypes";
import { applyTripPaymentToTrip, calculateTrip } from "../DibbyLogic";

const mockDoc = jest.fn();
const mockRunTransaction = jest.fn();

jest.mock("../../firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1, nanoseconds: 0 })),
  },
  doc: (...args: any[]) => mockDoc(...args),
  runTransaction: (...args: any[]) => mockRunTransaction(...args),
  arrayRemove: jest.fn(),
  arrayUnion: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  documentId: jest.fn(),
  getDocs: jest.fn(),
  increment: jest.fn(),
  query: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-expense-id"),
}));

const {
  createDibbyExpense,
  deleteDibbyExpense,
} = require("../FirebaseHelpers");

const makeParticipant = (
  uid: string,
  name: string,
  owed: number,
  amountPaid = 0,
): DibbyParticipant => ({
  uid,
  name,
  username: name.toLowerCase(),
  owed,
  amountPaid,
  color: "#999999",
  photoURL: null,
});

const makeTrip = (): DibbyTrip => ({
  id: "trip-1",
  title: "Trip",
  description: "",
  amount: 100,
  createdBy: "owner-1",
  dateCreated: {} as any,
  dateUpdated: {} as any,
  perPersonAverage: 50,
  expenses: [],
  participants: [
    makeParticipant("owner-1", "Owner", 0),
    makeParticipant("member-1", "Member", 0),
  ],
  completed: false,
});

const makeDocSnap = (data: any) => ({
  exists: () => Boolean(data),
  data: () => data,
});

const getBalances = (trip: DibbyTrip): Record<string, number> =>
  Object.fromEntries(
    trip.participants.map((participant) => [
      participant.uid,
      Number(participant.owed.toFixed(2)),
    ]),
  );

const getOwedSum = (trip: DibbyTrip): number =>
  Number(
    trip.participants
      .reduce((sum, participant) => sum + participant.owed, 0)
      .toFixed(2),
  );

describe("expense transaction helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockImplementation(
      (_db: any, collectionName: string, id: string) => ({
        collectionName,
        id,
        path: `${collectionName}/${id}`,
      }),
    );
  });

  it("creates an expense from the latest trip snapshot in a transaction", async () => {
    const latestTrip = makeTrip();
    const transactionUpdate = jest.fn();
    mockRunTransaction.mockImplementation(async (_db: any, callback: any) => {
      const transaction = {
        get: jest.fn(async () => makeDocSnap(latestTrip)),
        update: transactionUpdate,
      };
      return callback(transaction);
    });

    await createDibbyExpense(
      {
        title: "Airbnb",
        description: "",
        amount: "100",
        peopleInExpense: ["owner-1", "member-1"],
        paidBy: "owner-1",
        createdBy: "owner-1",
        splitMethod: DibbySplitMethod.EQUAL_PARTS,
        perPersonAverage: 50,
        peopleSplits: [
          { uid: "owner-1", name: "Owner", amount: 50 },
          { uid: "member-1", name: "Member", amount: 50 },
        ],
        emoji: null,
      },
      latestTrip,
    );

    expect(transactionUpdate).toHaveBeenCalled();
    const updatePayload = transactionUpdate.mock.calls[0][1];
    expect(updatePayload.amount).toBe(200);
    expect(updatePayload.expenses).toHaveLength(1);
    expect(
      updatePayload.participants.find(
        (p: DibbyParticipant) => p.uid === "owner-1",
      )?.owed,
    ).toBe(50);
    expect(
      updatePayload.participants.find(
        (p: DibbyParticipant) => p.uid === "member-1",
      )?.owed,
    ).toBe(-50);
  });

  it("deletes an expense from the latest trip snapshot in a transaction", async () => {
    const expense: DibbyExpense = {
      id: "expense-1",
      title: "Airbnb",
      description: "",
      amount: 100,
      createdBy: "owner-1",
      dateCreated: {} as any,
      dateUpdated: {} as any,
      perPersonAverage: 50,
      paidBy: "owner-1",
      splitMethod: DibbySplitMethod.EQUAL_PARTS,
      peopleInExpense: [
        { uid: "owner-1", name: "Owner", amount: 50 },
        { uid: "member-1", name: "Member", amount: 50 },
      ],
      emoji: null,
    };

    const latestTrip = {
      ...makeTrip(),
      amount: 100,
      perPersonAverage: 50,
      expenses: [expense],
      participants: [
        makeParticipant("owner-1", "Owner", 50, 100),
        makeParticipant("member-1", "Member", -50, 0),
      ],
    } as DibbyTrip;

    const transactionUpdate = jest.fn();
    mockRunTransaction.mockImplementation(async (_db: any, callback: any) => {
      const transaction = {
        get: jest.fn(async () => makeDocSnap(latestTrip)),
        update: transactionUpdate,
      };
      return callback(transaction);
    });

    await deleteDibbyExpense(expense, latestTrip);

    expect(transactionUpdate).toHaveBeenCalled();
    const updatePayload = transactionUpdate.mock.calls[0][1];
    expect(updatePayload.amount).toBe(0);
    expect(updatePayload.expenses).toHaveLength(0);
    expect(
      updatePayload.participants.find(
        (p: DibbyParticipant) => p.uid === "owner-1",
      )?.owed,
    ).toBe(0);
    expect(
      updatePayload.participants.find(
        (p: DibbyParticipant) => p.uid === "member-1",
      )?.owed,
    ).toBe(0);
  });

  it("handles a 14-person backfilled trip flow through expense transactions and mixed payments", async () => {
    const travelers = Array.from({ length: 14 }, (_, index) =>
      makeParticipant(`traveler-${index + 1}`, `Traveler ${index + 1}`, 0),
    );
    const travelerById = Object.fromEntries(
      travelers.map((traveler) => [traveler.uid, traveler]),
    ) as Record<string, DibbyParticipant>;

    let latestTrip: DibbyTrip = {
      id: "trip-14",
      title: "Summer Trip",
      description: "",
      amount: 0,
      createdBy: "traveler-1",
      dateCreated: {} as any,
      dateUpdated: {} as any,
      perPersonAverage: 0,
      expenses: [],
      participants: travelers,
      completed: false,
    };

    const transactionUpdate = jest.fn((_: any, payload: Partial<DibbyTrip>) => {
      latestTrip = {
        ...latestTrip,
        ...payload,
      } as DibbyTrip;
    });

    mockRunTransaction.mockImplementation(async (_db: any, callback: any) => {
      const transaction = {
        get: jest.fn(async () => makeDocSnap(latestTrip)),
        update: transactionUpdate,
      };
      return callback(transaction);
    });

    const buildEqualSplitExpense = (
      title: string,
      amount: number,
      paidBy: string,
      participantIds: string[],
    ) => {
      const perPersonAverage = amount / participantIds.length;
      return {
        title,
        description: "",
        amount: String(amount),
        peopleInExpense: participantIds,
        paidBy,
        createdBy: paidBy,
        splitMethod: DibbySplitMethod.EQUAL_PARTS,
        perPersonAverage,
        peopleSplits: participantIds.map((uid) => ({
          uid,
          name: travelerById[uid]?.name || uid,
          amount: perPersonAverage,
        })),
        emoji: null,
      };
    };

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

    await createDibbyExpense(
      buildEqualSplitExpense("Airbnb", 7000, "traveler-1", allTravelerIds),
      latestTrip,
    );
    await createDibbyExpense(
      buildEqualSplitExpense(
        "Activity",
        1600,
        "traveler-2",
        activityTravelerIds,
      ),
      latestTrip,
    );
    await createDibbyExpense(
      buildEqualSplitExpense(
        "Welcome Dinner",
        420,
        "traveler-3",
        allTravelerIds,
      ),
      latestTrip,
    );
    await createDibbyExpense(
      buildEqualSplitExpense("Van", 280, "traveler-8", vanTravelerIds),
      latestTrip,
    );
    await createDibbyExpense(
      buildEqualSplitExpense("Groceries", 350, "traveler-13", allTravelerIds),
      latestTrip,
    );
    await createDibbyExpense(
      buildEqualSplitExpense("Boat Taxi", 270, "traveler-6", boatTravelerIds),
      latestTrip,
    );

    expect(transactionUpdate).toHaveBeenCalledTimes(6);
    expect(latestTrip.amount).toBe(9920);
    expect(latestTrip.expenses).toHaveLength(6);

    const balancesAfterExpenses = Object.fromEntries(
      latestTrip.participants.map((participant) => [
        participant.uid,
        participant.owed,
      ]),
    );

    expect(balancesAfterExpenses).toEqual({
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
    });

    const tripAfterPayments = [
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
    ].reduce(
      (trip, payment) => applyTripPaymentToTrip(trip, payment),
      latestTrip,
    );

    const balancesAfterPayments = Object.fromEntries(
      tripAfterPayments.participants.map((participant) => [
        participant.uid,
        participant.owed,
      ]),
    );

    expect(balancesAfterPayments).toEqual({
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

    const settleUp = calculateTrip(tripAfterPayments);
    const totalsByCreditor = settleUp.transactions.reduce<
      Record<string, number>
    >((acc, transaction) => {
      acc[transaction.owed.uid] =
        (acc[transaction.owed.uid] || 0) + transaction.amount;
      return acc;
    }, {});

    expect(settleUp.finalNumberOfTransactions).toBe(13);
    expect(
      settleUp.transactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0,
      ),
    ).toBeCloseTo(3770, 2);
    expect(totalsByCreditor).toEqual({
      "traveler-1": 3660,
      "traveler-2": 110,
    });
  });

  it("verifies detailed stage-by-stage balances for a 14-person expense lifecycle", async () => {
    const { v4 } = require("uuid");
    (v4 as jest.Mock)
      .mockImplementationOnce(() => "expense-airbnb")
      .mockImplementationOnce(() => "expense-activity")
      .mockImplementationOnce(() => "expense-dinner")
      .mockImplementationOnce(() => "expense-van")
      .mockImplementationOnce(() => "expense-groceries")
      .mockImplementationOnce(() => "expense-boat");

    const travelers = Array.from({ length: 14 }, (_, index) =>
      makeParticipant(`traveler-${index + 1}`, `Traveler ${index + 1}`, 0),
    );
    const travelerById = Object.fromEntries(
      travelers.map((traveler) => [traveler.uid, traveler]),
    ) as Record<string, DibbyParticipant>;

    let latestTrip: DibbyTrip = {
      id: "trip-14-detailed",
      title: "Summer Trip Detailed",
      description: "",
      amount: 0,
      createdBy: "traveler-1",
      dateCreated: {} as any,
      dateUpdated: {} as any,
      perPersonAverage: 0,
      expenses: [],
      participants: travelers,
      completed: false,
    };

    mockRunTransaction.mockImplementation(async (_db: any, callback: any) => {
      const transaction = {
        get: jest.fn(async () => makeDocSnap(latestTrip)),
        update: jest.fn((_: any, payload: Partial<DibbyTrip>) => {
          latestTrip = {
            ...latestTrip,
            ...payload,
          } as DibbyTrip;
        }),
      };
      return callback(transaction);
    });

    const buildEqualSplitExpense = (
      title: string,
      amount: number,
      paidBy: string,
      participantIds: string[],
    ) => {
      const perPersonAverage = amount / participantIds.length;
      return {
        title,
        description: "",
        amount: String(amount),
        peopleInExpense: participantIds,
        paidBy,
        createdBy: paidBy,
        splitMethod: DibbySplitMethod.EQUAL_PARTS,
        perPersonAverage,
        peopleSplits: participantIds.map((uid) => ({
          uid,
          name: travelerById[uid]?.name || uid,
          amount: perPersonAverage,
        })),
        emoji: null,
      };
    };

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

    await createDibbyExpense(
      buildEqualSplitExpense("Airbnb", 7000, "traveler-1", allTravelerIds),
      latestTrip,
    );
    expect(latestTrip.amount).toBe(7000);
    expect(getOwedSum(latestTrip)).toBe(0);
    expect(getBalances(latestTrip)).toEqual({
      "traveler-1": 6500,
      "traveler-2": -500,
      "traveler-3": -500,
      "traveler-4": -500,
      "traveler-5": -500,
      "traveler-6": -500,
      "traveler-7": -500,
      "traveler-8": -500,
      "traveler-9": -500,
      "traveler-10": -500,
      "traveler-11": -500,
      "traveler-12": -500,
      "traveler-13": -500,
      "traveler-14": -500,
    });

    await createDibbyExpense(
      buildEqualSplitExpense(
        "Activity",
        1600,
        "traveler-2",
        activityTravelerIds,
      ),
      latestTrip,
    );
    expect(latestTrip.amount).toBe(8600);
    expect(getOwedSum(latestTrip)).toBe(0);
    expect(getBalances(latestTrip)).toEqual({
      "traveler-1": 6500,
      "traveler-2": 900,
      "traveler-3": -700,
      "traveler-4": -700,
      "traveler-5": -700,
      "traveler-6": -700,
      "traveler-7": -700,
      "traveler-8": -700,
      "traveler-9": -700,
      "traveler-10": -500,
      "traveler-11": -500,
      "traveler-12": -500,
      "traveler-13": -500,
      "traveler-14": -500,
    });

    await createDibbyExpense(
      buildEqualSplitExpense(
        "Welcome Dinner",
        420,
        "traveler-3",
        allTravelerIds,
      ),
      latestTrip,
    );
    await createDibbyExpense(
      buildEqualSplitExpense("Van", 280, "traveler-8", vanTravelerIds),
      latestTrip,
    );
    await createDibbyExpense(
      buildEqualSplitExpense("Groceries", 350, "traveler-13", allTravelerIds),
      latestTrip,
    );
    await createDibbyExpense(
      buildEqualSplitExpense("Boat Taxi", 270, "traveler-6", boatTravelerIds),
      latestTrip,
    );

    expect(latestTrip.amount).toBe(9920);
    expect(getOwedSum(latestTrip)).toBe(0);
    expect(getBalances(latestTrip)).toEqual({
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
    });

    const tripAfterPayments = [
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
    ].reduce(
      (trip, payment) => applyTripPaymentToTrip(trip, payment),
      latestTrip,
    );

    expect(getOwedSum(tripAfterPayments)).toBe(0);
    expect(getBalances(tripAfterPayments)).toEqual({
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

    const settleUp = calculateTrip(tripAfterPayments);
    expect(settleUp.finalNumberOfTransactions).toBe(13);
    expect(
      settleUp.transactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0,
      ),
    ).toBeCloseTo(3770, 2);
  });
});
