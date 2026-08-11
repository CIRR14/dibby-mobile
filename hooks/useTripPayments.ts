import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { DibbyTripPayment } from "../constants/DibbyTypes";
import { db } from "../firebase";

export const useTripPayments = (tripId?: string | null) => {
  const [payments, setPayments] = useState<DibbyTripPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!tripId) {
      setPayments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "tripPayments"),
      where("tripId", "==", tripId),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextPayments = snapshot.docs.map((doc) => {
          const data = doc.data() as DibbyTripPayment;
          return {
            ...data,
            id: data.id || doc.id,
          };
        });
        setPayments(nextPayments);
        setLoading(false);
      },
      () => {
        setPayments([]);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [tripId]);

  return { payments, loading };
};
