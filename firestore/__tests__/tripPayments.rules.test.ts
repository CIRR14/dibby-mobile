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
      uid: "debtor-1",
      name: "Debtor",
      username: "debtor",
      owed: -500,
      amountPaid: 0,
      color: "#222222",
      photoURL: null,
      createdUser: false,
    },
    {
      uid: "creditor-1",
      name: "Creditor",
      username: "creditor",
      owed: 500,
      amountPaid: 0,
      color: "#333333",
      photoURL: null,
      createdUser: false,
    },
  ],
  expenses: [],
};

const basePayment = {
  id: "trip-1_debtor-1_creditor-1_test",
  tripId: "trip-1",
  tripTitle: "Roadtrip",
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
  dateCreated: Timestamp.fromMillis(2),
  dateUpdated: Timestamp.fromMillis(2),
  note: null,
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
    await setDoc(doc(db, "users", "debtor-1"), {
      uid: "debtor-1",
      username: "debtor",
      trips: ["trip-1"],
    });
    await setDoc(doc(db, "users", "creditor-1"), {
      uid: "creditor-1",
      username: "creditor",
      trips: ["trip-1"],
    });
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("tripPayments rules", () => {
  it("allows debtor to create payment", async () => {
    const db = testEnv.authenticatedContext("debtor-1").firestore();

    await assertSucceeds(
      setDoc(doc(db, "tripPayments", basePayment.id), basePayment),
    );
  });

  it("allows owner to create payment on behalf of debtor", async () => {
    const db = testEnv.authenticatedContext("owner-1").firestore();

    await assertSucceeds(
      setDoc(doc(db, "tripPayments", basePayment.id), {
        ...basePayment,
        requestedByUid: "owner-1",
        requestedByUsername: "owner",
        requestedByName: "Owner",
      }),
    );
  });

  it("denies unrelated user from creating payment", async () => {
    const db = testEnv.authenticatedContext("stranger-1").firestore();

    await assertFails(
      setDoc(doc(db, "tripPayments", basePayment.id), {
        ...basePayment,
        requestedByUid: "stranger-1",
      }),
    );
  });

  it("allows debtor, creditor, and owner to read", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "tripPayments", basePayment.id), basePayment);
    });

    await assertSucceeds(
      getDoc(
        doc(
          testEnv.authenticatedContext("debtor-1").firestore(),
          "tripPayments",
          basePayment.id,
        ),
      ),
    );
    await assertSucceeds(
      getDoc(
        doc(
          testEnv.authenticatedContext("creditor-1").firestore(),
          "tripPayments",
          basePayment.id,
        ),
      ),
    );
    await assertSucceeds(
      getDoc(
        doc(
          testEnv.authenticatedContext("owner-1").firestore(),
          "tripPayments",
          basePayment.id,
        ),
      ),
    );
  });

  it("denies unrelated user from reading", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "tripPayments", basePayment.id), basePayment);
    });

    await assertFails(
      getDoc(
        doc(
          testEnv.authenticatedContext("stranger-1").firestore(),
          "tripPayments",
          basePayment.id,
        ),
      ),
    );
  });

  it("allows debtor or owner to update and delete", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "tripPayments", basePayment.id), basePayment);
    });

    const debtorDb = testEnv.authenticatedContext("debtor-1").firestore();
    await assertSucceeds(
      updateDoc(doc(debtorDb, "tripPayments", basePayment.id), {
        amountPaid: 250,
        status: "PARTIAL",
      }),
    );

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "tripPayments", basePayment.id), basePayment);
    });

    const ownerDb = testEnv.authenticatedContext("owner-1").firestore();
    await assertSucceeds(
      deleteDoc(doc(ownerDb, "tripPayments", basePayment.id)),
    );
  });

  it("denies updates that change debtor/creditor identities", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "tripPayments", basePayment.id), basePayment);
    });

    const debtorDb = testEnv.authenticatedContext("debtor-1").firestore();
    await assertFails(
      updateDoc(doc(debtorDb, "tripPayments", basePayment.id), {
        fromUid: "owner-1",
      }),
    );
  });
});
