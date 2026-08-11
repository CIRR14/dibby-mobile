/** @jest-environment node */

import fs from "fs";
import path from "path";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, Timestamp, updateDoc } from "firebase/firestore";

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
      uid: "member-1",
      name: "Member",
      username: "member",
      owed: 0,
      amountPaid: 0,
      color: "#222222",
      photoURL: null,
      createdUser: false,
    },
  ],
  expenses: [],
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
    await setDoc(doc(db, "users", "member-1"), {
      uid: "member-1",
      username: "member",
      trips: ["trip-1"],
    });
    await setDoc(doc(db, "users", "stranger-1"), {
      uid: "stranger-1",
      username: "stranger",
      trips: [],
    });
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("trips rules", () => {
  it("allows owner to create a trip", async () => {
    const db = testEnv.authenticatedContext("owner-2").firestore();

    await assertSucceeds(
      setDoc(doc(db, "trips", "trip-2"), {
        ...baseTrip,
        id: "trip-2",
        createdBy: "owner-2",
      }),
    );
  });

  it("denies creating a trip for another owner", async () => {
    const db = testEnv.authenticatedContext("owner-2").firestore();

    await assertFails(
      setDoc(doc(db, "trips", "trip-2"), {
        ...baseTrip,
        id: "trip-2",
        createdBy: "owner-1",
      }),
    );
  });

  it("allows owner and members to read and update", async () => {
    const ownerDb = testEnv.authenticatedContext("owner-1").firestore();
    const memberDb = testEnv.authenticatedContext("member-1").firestore();

    await assertSucceeds(getDoc(doc(ownerDb, "trips", "trip-1")));
    await assertSucceeds(getDoc(doc(memberDb, "trips", "trip-1")));
    await assertSucceeds(
      updateDoc(doc(memberDb, "trips", "trip-1"), {
        description: "updated by member",
      }),
    );
  });

  it("denies unrelated users from reading or updating", async () => {
    const strangerDb = testEnv.authenticatedContext("stranger-1").firestore();

    await assertFails(getDoc(doc(strangerDb, "trips", "trip-1")));
    await assertFails(
      updateDoc(doc(strangerDb, "trips", "trip-1"), {
        description: "malicious update",
      }),
    );
  });
});
