import { User } from "firebase/auth";
import { DocumentData, DocumentReference, Timestamp, arrayRemove, arrayUnion, collection, deleteDoc, doc, documentId, getDocs, increment, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import { DibbyExpense, DibbyParticipant, DibbySplits, DibbyTrip, DibbyUser } from "../constants/DibbyTypes";
import { getTravelerFromId } from "./AppHelpers";
import { CreateExpenseForm } from "../components/CreateExpense";
import { v4 } from "uuid";

  export const createDibbyUser = async (user: User, username: string, displayName: string, photoURL: string | null, userColor: string): Promise<void> => {
    const { uid, email } = user;
    const dibbyUser: DibbyUser = {
      uid,
      username,
      displayName,
      photoURL,
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
    return [...participantsNotIncluded, ...participants]
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
    }
    const newTripData = {
      ...trip,
      participants: [...getNewParticipants()],
      expenses: arrayUnion(newExpense),
      amount: increment(expenseAmount),
      perPersonAverage: increment(parseFloat(formData.amount) / trip.participants.length ),
      dateUpdated: Timestamp.now(),
    }

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
    const docUpdate = await updateDoc(tripRef, newTrip)
    return docUpdate;
  }

  export const addDibbyParticipant = async (travelers: DibbyParticipant[], trip: DibbyTrip): Promise<void> => {
    const newPerPersonAvg = trip.amount / trip.participants.length + travelers.length;
    const usersToAddTripTo: string[] = travelers.filter(t => !t.createdUser).map(p => p.uid);

    const updatedTrip = {
      ...trip,
      dateUpdated: Timestamp.now(),
      participants: arrayUnion(...travelers),
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
