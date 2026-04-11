import { User } from "firebase/auth";
import { DocumentData, DocumentReference, Timestamp, arrayRemove, arrayUnion, collection, deleteDoc, doc, documentId, getDocs, increment, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import { DibbyExpense, DibbyFriend, DibbyParticipant, DibbySplits, DibbyTrip, DibbyUser } from "../constants/DibbyTypes";
import { getTravelerFromId } from "./AppHelpers";
import { assignUniqueParticipantColors } from "./GenerateColor";
import { CreateExpenseForm } from "../components/CreateExpense";
import { v4 } from "uuid";
import {
  MAIN_SUB_TRIP_ID,
  createTripExpense,
  deleteTripExpense,
  ensureMainSubTripForTrip,
} from "./TripRepository";

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
  label = "Deleted user"
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
  label = "Deleted user"
): DibbySplits[] =>
  splits.map((split) =>
    split.uid === userId ? { ...split, name: label } : split
  );

const resolveNewTripOwner = (trip: DibbyTrip, userId: string) => {
  if (trip.createdBy !== userId) {
    return trip.createdBy;
  }
  const replacement = trip.participants.find(
    (p) => p.uid !== userId && !p.createdUser
  );
  return replacement?.uid || trip.createdBy;
};

export const deleteDibbyUserData = async (
  dibbyUser: DibbyUser
): Promise<void> => {
  const userId = dibbyUser.uid;

  if (dibbyUser.trips?.length) {
    const tripChunks = chunkArray(dibbyUser.trips);
    for (const chunk of tripChunks) {
      const tripQuery = query(
        collection(db, "trips"),
        where(documentId(), "in", chunk)
      );
      const tripSnapshot = await getDocs(tripQuery);
      const updates = tripSnapshot.docs.map(async (tripDoc) => {
        const trip = tripDoc.data() as DibbyTrip;
        const updatedParticipants = trip.participants.map((participant) =>
          participant.uid === userId
            ? anonymizeParticipant(participant)
            : participant
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
        where(documentId(), "in", chunk)
      );
      const friendSnapshot = await getDocs(friendQuery);
      const updates = friendSnapshot.docs.map(async (friendDoc) => {
        const friend = friendDoc.data() as DibbyUser;
        const updatedFriends = friend.friends.filter(
          (f) => f.uid !== userId
        );
        await updateDoc(friendDoc.ref, { friends: updatedFriends });
      });
      await Promise.all(updates);
    }
  }

  await deleteDoc(doc(db, "users", userId));
};

  export const createDibbyUser = async (user: User, username: string, displayName: string, photoURL: string | null, userColor: string): Promise<void> => {
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

  export const createDibbyTrip = async (tripData: DibbyTrip, tripRef: DocumentReference<DocumentData>, participants: DibbyParticipant[]) => {
    await setDoc(tripRef, tripData)
    await ensureMainSubTripForTrip(tripData);
    participants.forEach(async (user) => {
      const docRef = doc(db, "users", user.uid);
      const updatedUser = {
        trips: arrayUnion(tripRef.id),
      };
      await updateDoc(docRef, updatedUser);
    });
  }

  export const deleteDibbyTrip = async (tripData: DibbyTrip) => {
    const usersToDeleteTripIn = tripData.participants.filter((p) => !p.createdUser).map(p => p.uid);
    const q = query(collection(db, 'users'), where(documentId(), 'in', usersToDeleteTripIn))
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (doc) => {
      await updateDoc(doc.ref, {
        trips: arrayRemove(tripData.id)
      })
    })
   return await deleteDoc(doc(db, "trips", tripData.id));
  }


  export const createDibbyExpense = async (formData: CreateExpenseForm, trip: DibbyTrip): Promise<void> => {
    const tripRef = doc(db, 'trips', trip.id);
    const expenseId = `${trip.id}-${v4()}`
    const expensePerPersonAverage = formData.perPersonAverage;
    const expenseAmount: number = parseFloat(formData.amount)
    const selectedSubTripId = formData.subTripId || MAIN_SUB_TRIP_ID;

    
    const getNewParticipants = (): DibbyParticipant[] => {
      const participantsNotIncluded = trip.participants.filter((p) => !formData.peopleInExpense.includes(p.uid));
      const participantsIncluded = trip.participants.filter((p) => formData.peopleInExpense.includes(p.uid));

      const participants  = participantsIncluded.map(p => {
        const isPayer = p.uid === formData.paidBy;
        const splitTravelerInfo = formData.peopleSplits?.find(s => s.uid === p.uid);
  
        const amountOwed: number = splitTravelerInfo?.amount || expensePerPersonAverage;
        const payerAmountOwed: number = expenseAmount - (splitTravelerInfo?.amount || expensePerPersonAverage)
  
        return {
          ...p,
          amountPaid: isPayer ? p.amountPaid + expenseAmount : p.amountPaid,
          owed: isPayer ? p.owed + payerAmountOwed : p.owed - amountOwed,
        }
    })


    const newParticipants = participantsNotIncluded.map(p => {
      const isPayer = p.uid === formData.paidBy;

      return {
        ...p,
        amountPaid: isPayer ? p.amountPaid + expenseAmount : p.amountPaid,
        owed: isPayer ? p.owed + expenseAmount : p.owed
      }

    })


    return [...newParticipants, ...participants]
  }

    const peopleInExpense: DibbySplits[] = (formData.peopleInExpense.map(t => {
      const traveler = getTravelerFromId(trip, t);
      if (traveler) {
        const splitTravelerInfo = formData.peopleSplits?.find(p => p.uid === traveler?.uid);
        return {
          uid: traveler?.uid,
          name: traveler?.name,
          amount: splitTravelerInfo?.amount || expensePerPersonAverage,
        }
      } else {
        return null
      }
      }).filter(e => e) as DibbySplits[])



    const newExpense: DibbyExpense = {
      id: expenseId,
      tripId: trip.id,
      subTripId: selectedSubTripId,
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
    }
    const newTripData = {
      ...trip,
      participants: [...getNewParticipants()],
      expenses: arrayUnion(newExpense),
      amount: increment(expenseAmount),
      perPersonAverage: increment(parseFloat(formData.amount) / trip.participants.length ),
      dateUpdated: Timestamp.now(),
    }

    console.log({newTripData})

    await ensureMainSubTripForTrip(trip);
    await createTripExpense(trip.id, newExpense);
    await updateDoc(tripRef, newTripData);
  }

  export const deleteDibbyExpense = async (expense: DibbyExpense, trip: DibbyTrip): Promise<void> => {
    const tripRef = doc(db, 'trips', trip.id);

    const newParticipants: DibbyParticipant[] = trip.participants.map((p) => {
      const inExpenseAmount = expense.peopleInExpense.find(e => e.uid === p.uid)?.amount;
      const newOwed = expense.paidBy === p.uid && inExpenseAmount ? 
      p.owed - Math.abs(expense.amount - inExpenseAmount) : 
      expense.paidBy !== p.uid && inExpenseAmount ? 
      p.owed + inExpenseAmount :
      p.owed;

      return {
        ...p,
        owed: newOwed,
        amountPaid: expense.paidBy === p.uid ? p.amountPaid - expense.amount : p.amountPaid
      }
    })

    const newTrip = {
      ...trip, 
      participants: newParticipants,
      expenses: arrayRemove(expense),
      amount: increment(-expense.amount),
      perPersonAverage: increment(-(expense.amount/trip.participants.length)),
      dateUpdated: Timestamp.now()
    }
    await deleteTripExpense(trip.id, expense.id);
    const docUpdate = await updateDoc(tripRef, newTrip)
    return docUpdate;
  }

  export const addDibbyParticipant = async (travelers: DibbyParticipant[], trip: DibbyTrip): Promise<void> => {
    const newPerPersonAvg = trip.amount / trip.participants.length + travelers.length;
    const usersToAddTripTo: string[] = travelers.filter(t => !t.createdUser).map(p => p.uid);
    const updatedParticipants = assignUniqueParticipantColors([
      ...trip.participants,
      ...travelers,
    ]);

    const updatedTrip = {
      ...trip,
      dateUpdated: Timestamp.now(),
      participants: updatedParticipants,
      perPersonAverage: newPerPersonAvg
    }

    await updateDoc(doc(db, 'trips', trip.id), updatedTrip)

    usersToAddTripTo.forEach(async (uid) => {
        const docRef = doc(db, "users", uid);
        const updatedUser = {
          trips: arrayUnion(trip.id),
        };
        await updateDoc(docRef, updatedUser)
    })
  }


  export const addDibbyFriends = async (user: DibbyUser, newFriends: DibbyFriend[]): Promise<void> => {
    const userRef = doc(db, 'users', user.uid);

    newFriends.forEach(async (friendUser) => {
      const userId = friendUser.uid;
      const requestedRef = doc(db, 'users', userId);
      const requestedObject: DibbyFriend = {
        uid: user.uid,
        displayName: user.displayName || '',
        dateFriendAdded: friendUser.dateFriendAdded,
        requestPending: true,
        requestedBy: user.uid 
      }      

      const updatedFriendUser = {
        friends: arrayUnion(requestedObject)
      }
      await setDoc(requestedRef, updatedFriendUser, {merge: true})
    })

    const updatedUser = {
      friends: [...user.friends, ...newFriends]
    }

    await setDoc(userRef, updatedUser, {merge: true});
  }

  export const onAcceptDibbyFriend = async (user: DibbyUser, friend: DibbyUser) => { 
    const userRef = doc(db, 'users', user.uid);
    const updatedFriendsArray = user.friends.map(f => {
      if (friend.uid === f.uid) {
        return (
          {...f, requestPending: false, dateFriendAdded: Timestamp.now()
          }
        )
      } else {
        return f
      }
    })
    const updatedUser = {
      ...user,
      friends: updatedFriendsArray
    }

    const friendRef = doc(db, 'users', friend.uid);
    const updatedFriendsFriendsArray = friend.friends.map(f => {
      if (user.uid === f.uid) {
        return ({
          ...f,
          requestPending: false,
          dateFriendAdded: Timestamp.now()
        })
      } else {
        return f
      }
    })

    const updatedFriend = {
      ...friend, 
      friends: updatedFriendsFriendsArray
    }

    await updateDoc(friendRef, updatedFriend)
    await updateDoc(userRef, updatedUser)
  }

  export const onRejectDibbyFriend = async (user: DibbyUser, friend: DibbyUser) => {
    const userRef = doc(db, 'users', user.uid);
    const friendRef = doc(db, 'users', friend.uid);

    const newUserFriendsObject = user.friends.filter(f => f.uid !== friend.uid);
    const newFriendsFriendsObject = friend.friends.filter(u => u.uid !== user.uid);

    await updateDoc(userRef, {friends: newUserFriendsObject});
    await updateDoc(friendRef, {friends: newFriendsFriendsObject})

  }
