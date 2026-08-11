import {
  DibbyParticipant,
  DibbyTrip,
  DibbyTripLinkRequest,
  DibbyUser,
} from "../../constants/DibbyTypes";

const mockDoc = jest.fn();
const mockRunTransaction = jest.fn();

jest.mock("../../firebase", () => ({
  db: {},
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-expense-id"),
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

const makeUser = (uid: string, username: string): DibbyUser => ({
  uid,
  username,
  displayName: username,
  photoURL: null,
  email: `${username}@example.com`,
  friends: [],
  trips: [],
  color: "#123456",
});

const makeParticipant = (
  uid: string,
  name: string,
  createdUser = false,
): DibbyParticipant => ({
  uid,
  name,
  username: createdUser ? `${name.toLowerCase()}-guest` : name.toLowerCase(),
  owed: 0,
  amountPaid: 0,
  color: "#999999",
  photoURL: null,
  createdUser,
});

const makeTrip = (
  createdBy: string,
  participants: DibbyParticipant[],
): DibbyTrip => ({
  id: "trip-1",
  title: "Roadtrip",
  description: "",
  amount: 0,
  createdBy,
  dateCreated: {} as any,
  dateUpdated: {} as any,
  perPersonAverage: 0,
  expenses: [],
  participants,
  completed: false,
});

const makeRequest = (targetUid: string): DibbyTripLinkRequest => ({
  id: "trip-1_guest-1",
  tripId: "trip-1",
  tripTitle: "Roadtrip",
  tripEmoji: null,
  guestUid: "guest-1",
  guestName: "Guest One",
  targetUid,
  targetUsername: "target",
  requestedByUid: "owner-1",
  requestedByUsername: "owner",
  requestedByName: "Owner",
  dateCreated: {} as any,
});

const makeDocSnap = (data: any) => ({
  exists: () => Boolean(data),
  data: () => data,
});

const {
  createTripLinkRequest,
  acceptTripLinkRequest,
} = require("../FirebaseHelpers");

describe("trip link request helper guards", () => {
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

  it("blocks non-owner create request in transaction", async () => {
    const owner = makeUser("owner-1", "owner");
    const nonOwner = makeUser("user-2", "user2");
    const guest = makeParticipant("guest-1", "Guest One", true);
    const target = makeParticipant("target-1", "Target One", false);
    const trip = makeTrip(owner.uid, [
      makeParticipant(owner.uid, "Owner"),
      guest,
    ]);

    mockRunTransaction.mockImplementation(async (_db: any, callback: any) => {
      const transaction = {
        get: jest.fn(async (ref: any) => {
          if (ref.collectionName === "trips") {
            return makeDocSnap(trip);
          }
          if (ref.collectionName === "tripLinkRequests") {
            return makeDocSnap(null);
          }
          return makeDocSnap(null);
        }),
        set: jest.fn(),
      };
      return callback(transaction);
    });

    await expect(
      createTripLinkRequest(nonOwner, trip, guest, target),
    ).rejects.toThrow("Only the trip owner can link a guest to an account.");
  });

  it("fails stale accept when request no longer exists", async () => {
    const invitee = makeUser("target-1", "target");
    const request = makeRequest(invitee.uid);

    mockRunTransaction.mockImplementation(async (_db: any, callback: any) => {
      const transaction = {
        get: jest.fn(async (ref: any) => {
          if (ref.collectionName === "tripLinkRequests") {
            return makeDocSnap(null);
          }
          return makeDocSnap(null);
        }),
        update: jest.fn(),
        delete: jest.fn(),
      };
      return callback(transaction);
    });

    await expect(acceptTripLinkRequest(invitee, request)).rejects.toThrow(
      "This trip link request is no longer available.",
    );
  });
});
