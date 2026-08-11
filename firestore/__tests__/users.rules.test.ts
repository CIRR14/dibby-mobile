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
  collection,
  getDocs,
  query,
  setDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

const projectId = "dibby-mobile-rules-test";

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
    await setDoc(doc(db, "users", "user-1"), {
      uid: "user-1",
      username: "alice",
      displayName: "Alice",
      email: "alice@example.com",
      trips: [],
      friends: [],
      color: "#111111",
      photoURL: null,
      dateCreated: Timestamp.now(),
    });
    await setDoc(doc(db, "users", "user-2"), {
      uid: "user-2",
      username: "bob",
      displayName: "Bob",
      email: "bob@example.com",
      trips: [],
      friends: [],
      color: "#222222",
      photoURL: null,
      dateCreated: Timestamp.now(),
    });
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("users rules", () => {
  it("allows signed-in users to query the users collection for search", async () => {
    const db = testEnv.authenticatedContext("user-1").firestore();

    await assertSucceeds(getDocs(query(collection(db, "users"))));
  });

  it("denies unauthenticated users from querying the users collection", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDocs(query(collection(db, "users"))));
  });

  it("allows a user to create and update their own profile", async () => {
    const db = testEnv.authenticatedContext("user-3").firestore();

    await assertSucceeds(
      setDoc(doc(db, "users", "user-3"), {
        uid: "user-3",
        username: "charlie",
        displayName: "Charlie",
        email: "charlie@example.com",
        trips: [],
        friends: [],
        color: "#333333",
        photoURL: null,
        dateCreated: Timestamp.now(),
      }),
    );
  });

  it("denies writing another user's profile", async () => {
    const db = testEnv.authenticatedContext("user-1").firestore();

    await assertFails(
      setDoc(doc(db, "users", "user-2"), {
        uid: "user-2",
        username: "mallory",
        displayName: "Mallory",
        email: "mallory@example.com",
        trips: [],
        friends: [],
        color: "#444444",
        photoURL: null,
        dateCreated: Timestamp.now(),
      }),
    );
  });
});
