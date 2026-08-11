import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { DibbyTripLinkRequest } from "../constants/DibbyTypes";
import { db } from "../firebase";

export const useTripLinkRequests = (
  field: "targetUid" | "tripId",
  value?: string | null,
) => {
  const [requests, setRequests] = useState<DibbyTripLinkRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!value) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "tripLinkRequests"), where(field, "==", value));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextRequests = snapshot.docs.map((doc) => {
          const data = doc.data() as DibbyTripLinkRequest;
          return {
            ...data,
            id: data.id || doc.id,
          };
        });
        setRequests(nextRequests);
        setLoading(false);
      },
      () => {
        setRequests([]);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [field, value]);

  return { requests, loading };
};
