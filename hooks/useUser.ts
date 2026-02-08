import { User, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { DibbyUser } from "../constants/DibbyTypes";

export const useUser = () => {
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [profileReady, setProfileReady] = useState<boolean>(false);
  const [profileStatus, setProfileStatus] = useState<
    "none" | "missing" | "incomplete" | "complete"
  >("none");

  const [dibbyUser, setDibbyUser] = useState<DibbyUser | undefined>(undefined);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userObj) => {
      setLoggedInUser(userObj ?? null);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!loggedInUser) {
      setDibbyUser(undefined);
      setProfileStatus("none");
      setProfileReady(true);
      return;
    }

    setProfileReady(false);
    const userRef = doc(db, "users", loggedInUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const user: DibbyUser = docSnap.data() as DibbyUser;
        const resolvedPhotoURL = user.photoURL || loggedInUser.photoURL || null;
        const nextUser = resolvedPhotoURL
          ? { ...user, photoURL: resolvedPhotoURL }
          : user;
        setDibbyUser(nextUser);
        const isComplete = Boolean(
          user.displayName && user.email && user.username,
        );
        setProfileStatus(isComplete ? "complete" : "incomplete");

        if (loggedInUser.photoURL && user.photoURL !== loggedInUser.photoURL) {
          updateDoc(userRef, { photoURL: loggedInUser.photoURL }).catch(
            () => null,
          );
        }
      } else {
        setDibbyUser(undefined);
        setProfileStatus("missing");
      }
      setProfileReady(true);
    });
    return unsubscribe;
  }, [loggedInUser?.uid]);

  return { dibbyUser, loggedInUser, authReady, profileReady, profileStatus };
};
