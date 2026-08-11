import { User } from "firebase/auth";
import {
  DocumentData,
  DocumentReference,
  Timestamp,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDocs,
  increment,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  DibbyExpense,
  DibbyFriend,
  DibbyParticipant,
  DibbyPaymentStatus,
  DibbySplits,
  DibbyTrip,
  DibbyTripLinkRequest,
  DibbyTripPayment,
  DibbyUser,
} from "../constants/DibbyTypes";
import { getTravelerFromId } from "./AppHelpers";
import { assignUniqueParticipantColors } from "./GenerateColor";
import { CreateExpenseForm } from "../components/CreateExpense";
import { v4 } from "uuid";
import {
  applyTripPaymentToTrip,
  buildTripPaymentStatus,
  linkGuestParticipantToUser,
  revertTripPaymentFromTrip,
} from "./DibbyLogic";

const chunkArray = <T>(items: T[], size = 10): T[][] => {
  if (!items.length) {
    return [];
  }
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const anonymizeParticipant = (
  participant: DibbyParticipant,
  label = "Deleted user",
): DibbyParticipant => ({
  ...participant,
  name: label,
  username: null,
  photoURL: null,
  createdUser: true,
});

const anonymizeSplits = (
  splits: DibbySplits[],
  userId: string,
  label = "Deleted user",
): DibbySplits[] =>
  splits.map((split) =>
    split.uid === userId ? { ...split, name: label } : split,
  );

const resolveNewTripOwner = (trip: DibbyTrip, userId: string) => {
  if (trip.createdBy !== userId) {
    return trip.createdBy;
  }
  const replacement = trip.participants.find(
    (p) => p.uid !== userId && !p.createdUser,
  );
  return replacement?.uid || trip.createdBy;
};

const getTripLinkRequestId = (tripId: string, guestUid: string) =>
  `${tripId}_${guestUid}`.replace(/\//g, "_");

const getTripPaymentId = (tripId: string, fromUid: string, toUid: string) =>
  `${tripId}_${fromUid}_${toUid}_${v4()}`.replace(/\//g, "_");

export const createTripLinkRequest = async (
  requester: DibbyUser,
  trip: DibbyTrip,
  guest: DibbyParticipant,
  target: DibbyParticipant,
): Promise<void> => {
  if (!guest.createdUser) {
    throw new Error("Only guest travelers can be linked to an account.");
  }

  if (target.createdUser || !target.uid) {
    throw new Error("Choose an existing Dibby user to link.");
  }

  const requestId = getTripLinkRequestId(trip.id, guest.uid);
  const requestRef = doc(db, "tripLinkRequests", requestId);
  const tripRef = doc(db, "trips", trip.id);

  const request: DibbyTripLinkRequest = {
    id: requestId,
    tripId: trip.id,
    tripTitle: trip.title,
    tripEmoji: trip.emoji || null,
    guestUid: guest.uid,
    guestName: guest.name || "Guest traveler",
    targetUid: target.uid,
    targetUsername: target.username,
    requestedByUid: requester.uid,
    requestedByUsername: requester.username,
    requestedByName: requester.displayName,
    dateCreated: Timestamp.now(),
  };

  await runTransaction(db, async (transaction) => {
    const [tripSnap, requestSnap] = await Promise.all([
      transaction.get(tripRef),
      transaction.get(requestRef),
    ]);

    if (!tripSnap.exists()) {
      throw new Error("This trip no longer exists.");
    }

    const latestTrip = tripSnap.data() as DibbyTrip;
    if (latestTrip.createdBy !== requester.uid) {
      throw new Error("Only the trip owner can link a guest to an account.");
    }

    const guestParticipant = latestTrip.participants.find(
      (participant) => participant.uid === guest.uid,
    );

    if (!guestParticipant?.createdUser) {
      throw new Error("Guest traveler is no longer in this trip.");
    }

    const targetAlreadyInTrip = latestTrip.participants.some(
      (participant) =>
        participant.uid === target.uid ||
        (!participant.createdUser &&
          Boolean(target.username) &&
          participant.username === target.username),
    );

    if (targetAlreadyInTrip) {
      throw new Error("This user is already a traveler in the trip.");
    }

    if (requestSnap.exists()) {
      throw new Error("This guest already has a pending link request.");
    }

    transaction.set(requestRef, request);
  });
};

export const cancelTripLinkRequest = async (
  requester: DibbyUser,
  request: DibbyTripLinkRequest,
): Promise<void> => {
  const requestRef = doc(db, "tripLinkRequests", request.id);

  await runTransaction(db, async (transaction) => {
    const requestSnap = await transaction.get(requestRef);
    if (!requestSnap.exists()) {
      throw new Error("This trip link request is no longer available.");
    }

    const savedRequest = requestSnap.data() as DibbyTripLinkRequest;
    const tripRef = doc(db, "trips", savedRequest.tripId);
    const tripSnap = await transaction.get(tripRef);

    if (!tripSnap.exists()) {
      throw new Error("This trip no longer exists.");
    }

    const trip = tripSnap.data() as DibbyTrip;
    if (trip.createdBy !== requester.uid) {
      throw new Error("Only the trip owner can cancel this trip link request.");
    }

    transaction.delete(requestRef);
  });
};

export const rejectTripLinkRequest = async (
  user: DibbyUser,
  request: DibbyTripLinkRequest,
): Promise<void> => {
  if (request.targetUid !== user.uid) {
    throw new Error("Only the invited user can reject this request.");
  }

  await deleteDoc(doc(db, "tripLinkRequests", request.id));
};

type TripPaymentInput = {
  fromUid: string;
  toUid: string;
  amount: number;
  amountPaid: number;
  note?: string | null;
};

const assertPaymentActorCanWrite = (
  requester: DibbyUser,
  trip: DibbyTrip,
  payment: TripPaymentInput,
) => {
  const isTripOwner = trip.createdBy === requester.uid;
  const isDebtor = payment.fromUid === requester.uid;

  if (!isTripOwner && !isDebtor) {
    throw new Error("Only the trip owner or debtor can manage this payment.");
  }
};

export const createTripPayment = async (
  requester: DibbyUser,
  trip: DibbyTrip,
  payment: TripPaymentInput,
): Promise<void> => {
  if (payment.amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  if (payment.amountPaid <= 0) {
    throw new Error("Paid amount must be greater than zero.");
  }

  if (payment.amountPaid > payment.amount) {
    throw new Error("Paid amount cannot exceed the payment amount.");
  }

  const paymentId = getTripPaymentId(trip.id, payment.fromUid, payment.toUid);
  const paymentRef = doc(db, "tripPayments", paymentId);
  const tripRef = doc(db, "trips", trip.id);

  await runTransaction(db, async (transaction) => {
    const tripSnap = await transaction.get(tripRef);
    if (!tripSnap.exists()) {
      throw new Error("This trip no longer exists.");
    }

    const latestTrip = tripSnap.data() as DibbyTrip;
    assertPaymentActorCanWrite(requester, latestTrip, payment);

    const payer = latestTrip.participants.find(
      (participant) => participant.uid === payment.fromUid,
    );
    const payee = latestTrip.participants.find(
      (participant) => participant.uid === payment.toUid,
    );

    if (!payer || !payee) {
      throw new Error("Payment participants are no longer in this trip.");
    }

    const nextTrip = applyTripPaymentToTrip(latestTrip, payment);
    const status = buildTripPaymentStatus(payment.amount, payment.amountPaid);
    const paymentRecord: DibbyTripPayment = {
      id: paymentId,
      tripId: latestTrip.id,
      tripTitle: latestTrip.title,
      tripEmoji: latestTrip.emoji || null,
      fromUid: payment.fromUid,
      fromUsername: payer.username,
      fromName: payer.name,
      toUid: payment.toUid,
      toUsername: payee.username,
      toName: payee.name,
      amount: payment.amount,
      amountPaid: payment.amountPaid,
      status,
      requestedByUid: requester.uid,
      requestedByUsername: requester.username,
      requestedByName: requester.displayName,
      dateCreated: Timestamp.now(),
      dateUpdated: Timestamp.now(),
      note: payment.note || null,
    };

    transaction.update(tripRef, {
      ...nextTrip,
      dateUpdated: Timestamp.now(),
    });
    transaction.set(paymentRef, paymentRecord);
  });
};

export const updateTripPayment = async (
  requester: DibbyUser,
  payment: DibbyTripPayment,
  nextPayment: TripPaymentInput,
): Promise<void> => {
  if (nextPayment.amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  if (nextPayment.amountPaid <= 0) {
    throw new Error("Paid amount must be greater than zero.");
  }

  if (nextPayment.amountPaid > nextPayment.amount) {
    throw new Error("Paid amount cannot exceed the payment amount.");
  }

  const paymentRef = doc(db, "tripPayments", payment.id);
  const tripRef = doc(db, "trips", payment.tripId);

  await runTransaction(db, async (transaction) => {
    const [tripSnap, paymentSnap] = await Promise.all([
      transaction.get(tripRef),
      transaction.get(paymentRef),
    ]);

    if (!tripSnap.exists()) {
      throw new Error("This trip no longer exists.");
    }

    if (!paymentSnap.exists()) {
      throw new Error("This payment is no longer available.");
    }

    const latestTrip = tripSnap.data() as DibbyTrip;
    const latestPayment = paymentSnap.data() as DibbyTripPayment;

    const canWrite =
      latestTrip.createdBy === requester.uid ||
      latestPayment.fromUid === requester.uid;
    if (!canWrite) {
      throw new Error("Only the trip owner or debtor can manage this payment.");
    }

    if (
      nextPayment.fromUid !== latestPayment.fromUid ||
      nextPayment.toUid !== latestPayment.toUid
    ) {
      throw new Error("Payment participants cannot be changed after creation.");
    }

    const reversedTrip = revertTripPaymentFromTrip(latestTrip, {
      fromUid: latestPayment.fromUid,
      toUid: latestPayment.toUid,
      amountPaid: latestPayment.amountPaid,
    });
    const nextTrip = applyTripPaymentToTrip(reversedTrip, nextPayment);

    transaction.update(tripRef, {
      ...nextTrip,
      dateUpdated: Timestamp.now(),
    });
    transaction.update(paymentRef, {
      ...latestPayment,
      amount: nextPayment.amount,
      amountPaid: nextPayment.amountPaid,
      status: buildTripPaymentStatus(
        nextPayment.amount,
        nextPayment.amountPaid,
      ),
      dateUpdated: Timestamp.now(),
      note: nextPayment.note || null,
    });
  });
};

export const deleteTripPayment = async (
  requester: DibbyUser,
  payment: DibbyTripPayment,
): Promise<void> => {
  const paymentRef = doc(db, "tripPayments", payment.id);
  const tripRef = doc(db, "trips", payment.tripId);

  await runTransaction(db, async (transaction) => {
    const [tripSnap, paymentSnap] = await Promise.all([
      transaction.get(tripRef),
      transaction.get(paymentRef),
    ]);

    if (!tripSnap.exists()) {
      throw new Error("This trip no longer exists.");
    }

    if (!paymentSnap.exists()) {
      throw new Error("This payment is no longer available.");
    }

    const latestTrip = tripSnap.data() as DibbyTrip;
    const latestPayment = paymentSnap.data() as DibbyTripPayment;
    const canDelete =
      latestTrip.createdBy === requester.uid ||
      latestPayment.fromUid === requester.uid;

    if (!canDelete) {
      throw new Error("Only the trip owner or debtor can manage this payment.");
    }

    const reversedTrip = revertTripPaymentFromTrip(latestTrip, {
      fromUid: latestPayment.fromUid,
      toUid: latestPayment.toUid,
      amountPaid: latestPayment.amountPaid,
    });

    transaction.update(tripRef, {
      ...reversedTrip,
      dateUpdated: Timestamp.now(),
    });
    transaction.delete(paymentRef);
  });
};

export const setTripCompletedStatus = async (
  tripId: string,
  completed: boolean,
): Promise<void> => {
  const tripRef = doc(db, "trips", tripId);
  await updateDoc(tripRef, {
    completed,
    dateUpdated: Timestamp.now(),
  });
};

export const acceptTripLinkRequest = async (
  user: DibbyUser,
  request: DibbyTripLinkRequest,
): Promise<void> => {
  if (request.targetUid !== user.uid) {
    throw new Error("Only the invited user can accept this request.");
  }

  const requestRef = doc(db, "tripLinkRequests", request.id);
  const tripRef = doc(db, "trips", request.tripId);
  const userRef = doc(db, "users", user.uid);

  await runTransaction(db, async (transaction) => {
    const requestSnap = await transaction.get(requestRef);
    if (!requestSnap.exists()) {
      throw new Error("This trip link request is no longer available.");
    }

    const savedRequest = requestSnap.data() as DibbyTripLinkRequest;
    if (savedRequest.targetUid !== user.uid) {
      throw new Error("This trip link request is for another user.");
    }

    const tripSnap = await transaction.get(tripRef);
    if (!tripSnap.exists()) {
      throw new Error("This trip no longer exists.");
    }

    const trip = tripSnap.data() as DibbyTrip;
    if (trip.createdBy !== savedRequest.requestedByUid) {
      throw new Error("This trip link request is no longer valid.");
    }

    const updatedTrip = linkGuestParticipantToUser(
      trip,
      savedRequest.guestUid,
      user,
    );

    transaction.update(tripRef, {
      ...updatedTrip,
      dateUpdated: Timestamp.now(),
    });
    transaction.update(userRef, {
      trips: arrayUnion(savedRequest.tripId),
    });
    transaction.delete(requestRef);
  });
};

export const deleteDibbyUserData = async (
  dibbyUser: DibbyUser,
): Promise<void> => {
  const userId = dibbyUser.uid;

  if (dibbyUser.trips?.length) {
    const tripChunks = chunkArray(dibbyUser.trips);
    for (const chunk of tripChunks) {
      const tripQuery = query(
        collection(db, "trips"),
        where(documentId(), "in", chunk),
      );
      const tripSnapshot = await getDocs(tripQuery);
      const updates = tripSnapshot.docs.map(async (tripDoc) => {
        const trip = tripDoc.data() as DibbyTrip;
        const updatedParticipants = trip.participants.map((participant) =>
          participant.uid === userId
            ? anonymizeParticipant(participant)
            : participant,
        );
        const updatedExpenses = trip.expenses.map((expense) => ({
          ...expense,
          peopleInExpense: anonymizeSplits(expense.peopleInExpense, userId),
        }));
        const updatedTrip = {
          ...trip,
          participants: updatedParticipants,
          expenses: updatedExpenses,
          createdBy: resolveNewTripOwner(trip, userId),
          dateUpdated: Timestamp.now(),
        };
        await updateDoc(tripDoc.ref, updatedTrip);
      });
      await Promise.all(updates);
    }
  }

  if (dibbyUser.friends?.length) {
    const friendChunks = chunkArray(dibbyUser.friends.map((f) => f.uid));
    for (const chunk of friendChunks) {
      const friendQuery = query(
        collection(db, "users"),
        where(documentId(), "in", chunk),
      );
      const friendSnapshot = await getDocs(friendQuery);
      const updates = friendSnapshot.docs.map(async (friendDoc) => {
        const friend = friendDoc.data() as DibbyUser;
        const updatedFriends = friend.friends.filter((f) => f.uid !== userId);
        await updateDoc(friendDoc.ref, { friends: updatedFriends });
      });
      await Promise.all(updates);
    }
  }

  await deleteDoc(doc(db, "users", userId));
};

export const createDibbyUser = async (
  user: User,
  username: string,
  displayName: string,
  photoURL: string | null,
  userColor: string,
): Promise<void> => {
  const { uid, email } = user;
  const dibbyUser: DibbyUser = {
    uid,
    username,
    displayName,
    photoURL: user.photoURL || photoURL,
    email,
    friends: [],
    trips: [],
    color: userColor,
  };

  try {
    await setDoc(doc(db, "users", uid), dibbyUser);
  } catch (error) {
    console.log("Error adding doc: ", error);
  }
};

export const createDibbyTrip = async (
  tripData: DibbyTrip,
  tripRef: DocumentReference<DocumentData>,
  participants: DibbyParticipant[],
) => {
  await setDoc(tripRef, tripData);
  await Promise.all(
    participants.map(async (user) => {
      const docRef = doc(db, "users", user.uid);
      const updatedUser = {
        trips: arrayUnion(tripRef.id),
      };
      await updateDoc(docRef, updatedUser);
    }),
  );
};

export const deleteDibbyTrip = async (tripData: DibbyTrip) => {
  const usersToDeleteTripIn = tripData.participants
    .filter((p) => !p.createdUser)
    .map((p) => p.uid);
  const q = query(
    collection(db, "users"),
    where(documentId(), "in", usersToDeleteTripIn),
  );
  const querySnapshot = await getDocs(q);
  await Promise.all(
    querySnapshot.docs.map(async (doc) => {
      await updateDoc(doc.ref, {
        trips: arrayRemove(tripData.id),
      });
    }),
  );
  return await deleteDoc(doc(db, "trips", tripData.id));
};

export const createDibbyExpense = async (
  formData: CreateExpenseForm,
  trip: DibbyTrip,
): Promise<void> => {
  const tripRef = doc(db, "trips", trip.id);
  const expenseId = `${trip.id}-${v4()}`;
  const expensePerPersonAverage = formData.perPersonAverage;
  const expenseAmount: number = parseFloat(formData.amount);

  const getNewParticipants = (latestTrip: DibbyTrip): DibbyParticipant[] => {
    const participantsNotIncluded = latestTrip.participants.filter(
      (p) => !formData.peopleInExpense.includes(p.uid),
    );
    const participantsIncluded = latestTrip.participants.filter((p) =>
      formData.peopleInExpense.includes(p.uid),
    );

    const participants = participantsIncluded.map((p) => {
      const isPayer = p.uid === formData.paidBy;
      const splitTravelerInfo = formData.peopleSplits?.find(
        (s) => s.uid === p.uid,
      );

      const amountOwed: number =
        splitTravelerInfo?.amount || expensePerPersonAverage;
      const payerAmountOwed: number =
        expenseAmount - (splitTravelerInfo?.amount || expensePerPersonAverage);

      return {
        ...p,
        amountPaid: isPayer ? p.amountPaid + expenseAmount : p.amountPaid,
        owed: isPayer ? p.owed + payerAmountOwed : p.owed - amountOwed,
      };
    });

    const newParticipants = participantsNotIncluded.map((p) => {
      const isPayer = p.uid === formData.paidBy;

      return {
        ...p,
        amountPaid: isPayer ? p.amountPaid + expenseAmount : p.amountPaid,
        owed: isPayer ? p.owed + expenseAmount : p.owed,
      };
    });

    return [...newParticipants, ...participants];
  };

  await runTransaction(db, async (transaction) => {
    const tripSnap = await transaction.get(tripRef);
    if (!tripSnap.exists()) {
      throw new Error("This trip no longer exists.");
    }

    const latestTrip = tripSnap.data() as DibbyTrip;
    const peopleInExpense: DibbySplits[] = formData.peopleInExpense
      .map((travelerId) => {
        const traveler = getTravelerFromId(latestTrip, travelerId);
        if (!traveler) {
          return null;
        }
        const splitTravelerInfo = formData.peopleSplits?.find(
          (p) => p.uid === traveler.uid,
        );
        return {
          uid: traveler.uid,
          name: traveler.name,
          amount: splitTravelerInfo?.amount || expensePerPersonAverage,
        };
      })
      .filter((entry) => entry) as DibbySplits[];

    const newExpense: DibbyExpense = {
      id: expenseId,
      title: formData.title,
      description: formData.description,
      amount: expenseAmount,
      createdBy: formData.createdBy,
      dateCreated: Timestamp.now(),
      dateUpdated: Timestamp.now(),
      perPersonAverage: expensePerPersonAverage,
      paidBy: formData.paidBy,
      splitMethod: formData.splitMethod,
      peopleInExpense,
      emoji: formData.emoji || null,
    };

    const nextAmount = (latestTrip.amount || 0) + expenseAmount;
    transaction.update(tripRef, {
      ...latestTrip,
      participants: getNewParticipants(latestTrip),
      expenses: [...latestTrip.expenses, newExpense],
      amount: nextAmount,
      perPersonAverage:
        latestTrip.participants.length > 0
          ? nextAmount / latestTrip.participants.length
          : 0,
      dateUpdated: Timestamp.now(),
    });
  });
};

export const deleteDibbyExpense = async (
  expense: DibbyExpense,
  trip: DibbyTrip,
): Promise<void> => {
  const tripRef = doc(db, "trips", trip.id);

  await runTransaction(db, async (transaction) => {
    const tripSnap = await transaction.get(tripRef);
    if (!tripSnap.exists()) {
      throw new Error("This trip no longer exists.");
    }

    const latestTrip = tripSnap.data() as DibbyTrip;
    const savedExpense = latestTrip.expenses.find(
      (item) => item.id === expense.id,
    );
    if (!savedExpense) {
      throw new Error("This expense no longer exists.");
    }

    const newParticipants: DibbyParticipant[] = latestTrip.participants.map(
      (participant) => {
        const inExpenseAmount = savedExpense.peopleInExpense.find(
          (entry) => entry.uid === participant.uid,
        )?.amount;
        const newOwed =
          savedExpense.paidBy === participant.uid && inExpenseAmount
            ? participant.owed - Math.abs(savedExpense.amount - inExpenseAmount)
            : savedExpense.paidBy !== participant.uid && inExpenseAmount
              ? participant.owed + inExpenseAmount
              : participant.owed;

        return {
          ...participant,
          owed: newOwed,
          amountPaid:
            savedExpense.paidBy === participant.uid
              ? participant.amountPaid - savedExpense.amount
              : participant.amountPaid,
        };
      },
    );

    const nextAmount = Math.max(
      0,
      (latestTrip.amount || 0) - savedExpense.amount,
    );
    transaction.update(tripRef, {
      ...latestTrip,
      participants: newParticipants,
      expenses: latestTrip.expenses.filter(
        (item) => item.id !== savedExpense.id,
      ),
      amount: nextAmount,
      perPersonAverage:
        latestTrip.participants.length > 0
          ? nextAmount / latestTrip.participants.length
          : 0,
      dateUpdated: Timestamp.now(),
    });
  });
};

export const addDibbyParticipant = async (
  travelers: DibbyParticipant[],
  trip: DibbyTrip,
): Promise<void> => {
  const newPerPersonAvg =
    trip.amount / trip.participants.length + travelers.length;
  const usersToAddTripTo: string[] = travelers
    .filter((t) => !t.createdUser)
    .map((p) => p.uid);
  const updatedParticipants = assignUniqueParticipantColors([
    ...trip.participants,
    ...travelers,
  ]);

  const updatedTrip = {
    ...trip,
    dateUpdated: Timestamp.now(),
    participants: updatedParticipants,
    perPersonAverage: newPerPersonAvg,
  };

  await updateDoc(doc(db, "trips", trip.id), updatedTrip);

  await Promise.all(
    usersToAddTripTo.map(async (uid) => {
      const docRef = doc(db, "users", uid);
      const updatedUser = {
        trips: arrayUnion(trip.id),
      };
      await updateDoc(docRef, updatedUser);
    }),
  );
};

export const addDibbyFriends = async (
  user: DibbyUser,
  newFriends: DibbyFriend[],
): Promise<void> => {
  const userRef = doc(db, "users", user.uid);

  newFriends.forEach(async (friendUser) => {
    const userId = friendUser.uid;
    const requestedRef = doc(db, "users", userId);
    const requestedObject: DibbyFriend = {
      uid: user.uid,
      displayName: user.displayName || "",
      dateFriendAdded: friendUser.dateFriendAdded,
      requestPending: true,
      requestedBy: user.uid,
    };

    const updatedFriendUser = {
      friends: arrayUnion(requestedObject),
    };
    await setDoc(requestedRef, updatedFriendUser, { merge: true });
  });

  const updatedUser = {
    friends: [...user.friends, ...newFriends],
  };

  await setDoc(userRef, updatedUser, { merge: true });
};

export const onAcceptDibbyFriend = async (
  user: DibbyUser,
  friend: DibbyUser,
) => {
  const userRef = doc(db, "users", user.uid);
  const updatedFriendsArray = user.friends.map((f) => {
    if (friend.uid === f.uid) {
      return { ...f, requestPending: false, dateFriendAdded: Timestamp.now() };
    } else {
      return f;
    }
  });
  const updatedUser = {
    ...user,
    friends: updatedFriendsArray,
  };

  const friendRef = doc(db, "users", friend.uid);
  const updatedFriendsFriendsArray = friend.friends.map((f) => {
    if (user.uid === f.uid) {
      return {
        ...f,
        requestPending: false,
        dateFriendAdded: Timestamp.now(),
      };
    } else {
      return f;
    }
  });

  const updatedFriend = {
    ...friend,
    friends: updatedFriendsFriendsArray,
  };

  await updateDoc(friendRef, updatedFriend);
  await updateDoc(userRef, updatedUser);
};

export const onRejectDibbyFriend = async (
  user: DibbyUser,
  friend: DibbyUser,
) => {
  const userRef = doc(db, "users", user.uid);
  const friendRef = doc(db, "users", friend.uid);

  const newUserFriendsObject = user.friends.filter((f) => f.uid !== friend.uid);
  const newFriendsFriendsObject = friend.friends.filter(
    (u) => u.uid !== user.uid,
  );

  await updateDoc(userRef, { friends: newUserFriendsObject });
  await updateDoc(friendRef, { friends: newFriendsFriendsObject });
};
