import {
  DibbyParticipant,
  DibbyTrip,
  DibbyTripPayment,
  DibbyUser,
} from "../../constants/DibbyTypes";

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
  arrayUnion: jest.fn((value) => value),
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
  v4: jest.fn(() => "mock-payment-id"),
}));

const {
  createTripPayment,
  deleteTripPayment,
  updateTripPayment,
} = require("../FirebaseHelpers");

const makeUser = (uid: string): DibbyUser => ({
  uid,
  username: uid,
  displayName: uid,
  photoURL: null,
  email: `${uid}@example.com`,
  friends: [],
  trips: ["trip-1"],
  color: "#123456",
});

const makeParticipant = (
  uid: string,
  name: string,
  owed: number,
): DibbyParticipant => ({
  uid,
  name,
  username: name.toLowerCase(),
  owed,
  amountPaid: 0,
  color: "#999999",
  photoURL: null,
});

const makeTrip = (ownerId = "owner-1"): DibbyTrip => ({
  id: "trip-1",
  title: "Trip",
  description: "",
  amount: 0,
  createdBy: ownerId,
  dateCreated: {} as any,
  dateUpdated: {} as any,
  perPersonAverage: 0,
  expenses: [],
  participants: [
    makeParticipant("debtor-1", "Debtor", -500),
    makeParticipant("creditor-1", "Creditor", 500),
    makeParticipant(ownerId, "Owner", 0),
  ],
  completed: false,
});

const makePayment = (): DibbyTripPayment => ({
  id: "trip-1_debtor-1_creditor-1_mock-payment-id",
  tripId: "trip-1",
  tripTitle: "Trip",
  tripEmoji: null,
  fromUid: "debtor-1",
  fromUsername: "debtor",
  fromName: "Debtor",
  toUid: "creditor-1",
  toUsername: "creditor",
  toName: "Creditor",
  amount: 500,
  amountPaid: 500,
  status: "PAID",
  requestedByUid: "debtor-1",
  requestedByUsername: "debtor",
  requestedByName: "Debtor",
  dateCreated: {} as any,
  dateUpdated: {} as any,
  note: null,
});

const makeDocSnap = (data: any) => ({
  exists: () => Boolean(data),
  data: () => data,
});

describe("payment helper guards", () => {
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

  it("allows the debtor to create a payment", async () => {
    const trip = makeTrip();
    const requester = makeUser("debtor-1");

    mockRunTransaction.mockImplementation(async (_db: any, callback: any) => {
      const transaction = {
        get: jest.fn(async (ref: any) => {
          if (ref.collectionName === "trips") {
            return makeDocSnap(trip);
          }
          return makeDocSnap(null);
        }),
        update: jest.fn(),
        set: jest.fn(),
      };
      return callback(transaction);
    });

    await expect(
      createTripPayment(requester, trip, {
        fromUid: "debtor-1",
        toUid: "creditor-1",
        amount: 500,
        amountPaid: 250,
      }),
    ).resolves.toBeUndefined();
  });

  it("blocks unrelated users from creating a payment", async () => {
    const trip = makeTrip();
    const requester = makeUser("stranger-1");

    mockRunTransaction.mockImplementation(async (_db: any, callback: any) => {
      const transaction = {
        get: jest.fn(async (ref: any) => {
          if (ref.collectionName === "trips") {
            return makeDocSnap(trip);
          }
          return makeDocSnap(null);
        }),
        update: jest.fn(),
        set: jest.fn(),
      };
      return callback(transaction);
    });

    await expect(
      createTripPayment(requester, trip, {
        fromUid: "debtor-1",
        toUid: "creditor-1",
        amount: 500,
        amountPaid: 250,
      }),
    ).rejects.toThrow("trip owner or debtor");
  });

  it("blocks non-owner, non-debtor from deleting a payment", async () => {
    const trip = makeTrip();
    const payment = makePayment();
    const requester = makeUser("stranger-1");

    mockRunTransaction.mockImplementation(async (_db: any, callback: any) => {
      const transaction = {
        get: jest.fn(async (ref: any) => {
          if (ref.collectionName === "trips") {
            return makeDocSnap(trip);
          }
          if (ref.collectionName === "tripPayments") {
            return makeDocSnap(payment);
          }
          return makeDocSnap(null);
        }),
        update: jest.fn(),
        delete: jest.fn(),
      };
      return callback(transaction);
    });

    await expect(deleteTripPayment(requester, payment)).rejects.toThrow(
      "trip owner or debtor",
    );
  });

  it("allows deleting a payment even after balances have moved", async () => {
    const trip = makeTrip();
    const payment = makePayment();
    const requester = makeUser("debtor-1");
    const evolvedTrip = {
      ...trip,
      participants: trip.participants.map((participant) => {
        if (participant.uid === "debtor-1") {
          return { ...participant, owed: 25 };
        }
        if (participant.uid === "creditor-1") {
          return { ...participant, owed: -25 };
        }
        return participant;
      }),
    } as DibbyTrip;

    const transactionUpdate = jest.fn();
    const transactionDelete = jest.fn();
    mockRunTransaction.mockImplementation(async (_db: any, callback: any) => {
      const transaction = {
        get: jest.fn(async (ref: any) => {
          if (ref.collectionName === "trips") {
            return makeDocSnap(evolvedTrip);
          }
          if (ref.collectionName === "tripPayments") {
            return makeDocSnap(payment);
          }
          return makeDocSnap(null);
        }),
        update: transactionUpdate,
        delete: transactionDelete,
      };
      return callback(transaction);
    });

    await expect(
      deleteTripPayment(requester, payment),
    ).resolves.toBeUndefined();
    expect(transactionUpdate).toHaveBeenCalled();
    expect(transactionDelete).toHaveBeenCalled();
  });

  it("blocks changing payment participants during update", async () => {
    const trip = makeTrip();
    const payment = makePayment();
    const requester = makeUser("debtor-1");

    mockRunTransaction.mockImplementation(async (_db: any, callback: any) => {
      const transaction = {
        get: jest.fn(async (ref: any) => {
          if (ref.collectionName === "trips") {
            return makeDocSnap(trip);
          }
          if (ref.collectionName === "tripPayments") {
            return makeDocSnap(payment);
          }
          return makeDocSnap(null);
        }),
        update: jest.fn(),
      };
      return callback(transaction);
    });

    await expect(
      updateTripPayment(requester, payment, {
        fromUid: "owner-1",
        toUid: "creditor-1",
        amount: 500,
        amountPaid: 250,
      }),
    ).rejects.toThrow("cannot be changed");
  });
});
