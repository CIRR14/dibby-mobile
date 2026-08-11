/** @jest-environment node */

import fs from "fs";
import path from "path";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

const projectId = "dibby-mobile-rules-test";

const baseTrip = {
  id: "trip-1",
  title: "Roadtrip",
  description: "",
  amount: 0,
  createdBy: "owner-1",
  dateCreated: Timestamp.fromMillis(1),
  dateUpdated: Timestamp.fromMillis(1),
  perPersonAverage: 0,
  completed: false,
  participants: [
    {
      uid: "owner-1",
      name: "Owner",
      username: "owner",
      owed: 0,
      amountPaid: 0,
      color: "#111111",
      photoURL: null,
      createdUser: false,
    },
    {
      uid: "guest-1",
      name: "Guest One",
      username: "guest-one",
      owed: 0,
      amountPaid: 0,
      color: "#222222",
      photoURL: null,
      createdUser: true,
    },
  ],
  expenses: [],
};

const baseRequest = {
  id: "trip-1_guest-1",
  tripId: "trip-1",
  tripTitle: "Roadtrip",
  tripEmoji: null,
  guestUid: "guest-1",
  guestName: "Guest One",
  targetUid: "target-1",
  targetUsername: "target",
  requestedByUid: "owner-1",
  requestedByUsername: "owner",
  requestedByName: "Owner",
  dateCreated: Timestamp.fromMillis(2),
};

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const rules = fs.readFileSync(
    path.resolve(__dirname, "../../firestore.rules"),
    "utf8",
  );

  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "trips", "trip-1"), baseTrip);
    await setDoc(doc(db, "users", "owner-1"), {
      uid: "owner-1",
      username: "owner",
      trips: ["trip-1"],
    });
    await setDoc(doc(db, "users", "target-1"), {
      uid: "target-1",
      username: "target",
      trips: [],
    });
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("tripLinkRequests rules", () => {
  it("allows trip owner to create request", async () => {
    const db = testEnv.authenticatedContext("owner-1").firestore();

    await assertSucceeds(
      setDoc(doc(db, "tripLinkRequests", baseRequest.id), baseRequest),
    );
  });

  it("denies non-owner from creating request", async () => {
    const db = testEnv.authenticatedContext("member-2").firestore();

    await assertFails(
      setDoc(doc(db, "tripLinkRequests", baseRequest.id), {
        ...baseRequest,
        requestedByUid: "member-2",
      }),
    );
  });

  it("allows owner and target to read", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(
        doc(adminDb, "tripLinkRequests", baseRequest.id),
        baseRequest,
      );
    });

    const ownerDb = testEnv.authenticatedContext("owner-1").firestore();
    const targetDb = testEnv.authenticatedContext("target-1").firestore();

    await assertSucceeds(
      getDoc(doc(ownerDb, "tripLinkRequests", baseRequest.id)),
    );
    await assertSucceeds(
      getDoc(doc(targetDb, "tripLinkRequests", baseRequest.id)),
    );
  });

  it("denies unrelated user from reading", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(
        doc(adminDb, "tripLinkRequests", baseRequest.id),
        baseRequest,
      );
    });

    const strangerDb = testEnv.authenticatedContext("stranger-1").firestore();

    await assertFails(
      getDoc(doc(strangerDb, "tripLinkRequests", baseRequest.id)),
    );
  });

  it("allows owner to cancel and target to reject via delete", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(
        doc(adminDb, "tripLinkRequests", baseRequest.id),
        baseRequest,
      );
    });

    const ownerDb = testEnv.authenticatedContext("owner-1").firestore();
    await assertSucceeds(
      deleteDoc(doc(ownerDb, "tripLinkRequests", baseRequest.id)),
    );

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(
        doc(adminDb, "tripLinkRequests", baseRequest.id),
        baseRequest,
      );
    });

    const targetDb = testEnv.authenticatedContext("target-1").firestore();
    await assertSucceeds(
      deleteDoc(doc(targetDb, "tripLinkRequests", baseRequest.id)),
    );
  });

  it("denies updates to existing request", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(
        doc(adminDb, "tripLinkRequests", baseRequest.id),
        baseRequest,
      );
    });

    const ownerDb = testEnv.authenticatedContext("owner-1").firestore();
    await assertFails(
      updateDoc(doc(ownerDb, "tripLinkRequests", baseRequest.id), {
        guestName: "Mutated",
      }),
    );
  });
});
