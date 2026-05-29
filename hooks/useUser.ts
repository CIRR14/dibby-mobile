import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { DibbyUser } from "../constants/DibbyTypes";
import { useAuthSelector } from "../stores/authStore";
import { useUserSelector } from "../stores/userStore";

export const useUserBootstrap = () => {
  const loggedInUser = useAuthSelector((state) => state.loggedInUser);
  const setAuthState = useAuthSelector((state) => state.setAuthState);

  const setProfileLoading = useUserSelector((state) => state.setProfileLoading);
  const setProfileNone = useUserSelector((state) => state.setProfileNone);
  const setProfileMissing = useUserSelector((state) => state.setProfileMissing);
  const setProfile = useUserSelector((state) => state.setProfile);

  useEffect(() => {
    // Seed auth readiness immediately to avoid waiting indefinitely for first listener tick.
    setAuthState(auth.currentUser ?? null);
    const unsubscribe = onAuthStateChanged(auth, (userObj) => {
      setAuthState(userObj ?? null);
    });
    return unsubscribe;
  }, [setAuthState]);

  useEffect(() => {
    if (!loggedInUser) {
      setProfileNone();
      return;
    }

    setProfileLoading();
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        setProfileMissing();
      }
    }, 8000);

    try {
      const userRef = doc(db, "users", loggedInUser.uid);
      const unsubscribe = onSnapshot(
        userRef,
        (docSnap) => {
          resolved = true;
          clearTimeout(timeout);

          if (docSnap.exists()) {
            const user: DibbyUser = docSnap.data() as DibbyUser;
            const resolvedPhotoURL = user.photoURL || loggedInUser.photoURL || null;
            const nextUser = resolvedPhotoURL
              ? { ...user, photoURL: resolvedPhotoURL }
              : user;
            const isComplete = Boolean(
              user.displayName && user.email && user.username,
            );
            setProfile(nextUser, isComplete ? "complete" : "incomplete");

            if (loggedInUser.photoURL && user.photoURL !== loggedInUser.photoURL) {
              updateDoc(userRef, { photoURL: loggedInUser.photoURL }).catch(
                () => null,
              );
            }
          } else {
            setProfileMissing();
          }
        },
        () => {
          resolved = true;
          clearTimeout(timeout);
          // Prevent auth flow deadlock if Firestore listener fails (permissions/network).
          setProfileMissing();
        },
      );

      return () => {
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch {
      clearTimeout(timeout);
      setProfileMissing();
      return;
    }
  }, [loggedInUser?.uid, setProfileLoading, setProfileMissing, setProfileNone, setProfile]);

};

export const useUser = () => {
  const dibbyUser = useUserSelector((state) => state.dibbyUser);
  const loggedInUser = useAuthSelector((state) => state.loggedInUser);
  const authReady = useAuthSelector((state) => state.authReady);
  const profileReady = useUserSelector((state) => state.profileReady);
  const profileStatus = useUserSelector((state) => state.profileStatus);

  return { dibbyUser, loggedInUser, authReady, profileReady, profileStatus };
};
