import { Timestamp } from "firebase/firestore";

interface DibbyDoc {
  title: string;
  description: string;
  amount: number;
  createdBy: string;
  dateCreated: Timestamp;
  dateUpdated: Timestamp;
  perPersonAverage: number;
  emoji?: string | null;
}

interface DibbyDocWithID extends DibbyDoc {
  id: string;
}

export interface DibbyFriend {
  uid: string;
  displayName: string;
  dateFriendAdded: Timestamp;
  requestPending: boolean;
  requestedBy: string;
}

export interface DibbyUser {
  uid: string;
  username: string | null;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  friends: DibbyFriend[];
  trips: string[];
  color: string;
  // emailVerified: boolean,
  // phoneNumber: string | null,
}

export interface DibbyTrip extends DibbyDocWithID {
  expenses: DibbyExpense[];
  participants: DibbyParticipant[];
  completed: boolean;
}

export enum DibbyPaymentStatus {
  PAID = "PAID",
  PARTIAL = "PARTIAL",
}

export interface DibbyTripLinkRequest {
  id: string;
  tripId: string;
  tripTitle: string;
  tripEmoji?: string | null;
  guestUid: string;
  guestName: string;
  targetUid: string;
  targetUsername: string | null;
  requestedByUid: string;
  requestedByUsername: string | null;
  requestedByName: string | null;
  dateCreated: Timestamp;
}

export interface DibbyTripPayment extends DibbyDocWithID {
  tripId: string;
  tripTitle: string;
  tripEmoji?: string | null;
  fromUid: string;
  fromUsername: string | null;
  fromName: string | null;
  toUid: string;
  toUsername: string | null;
  toName: string | null;
  amount: number;
  amountPaid: number;
  status: DibbyPaymentStatus;
  requestedByUid: string;
  requestedByUsername: string | null;
  requestedByName: string | null;
  dateCreated: Timestamp;
  dateUpdated: Timestamp;
  note?: string | null;
}

export interface DibbyExpense extends DibbyDocWithID {
  paidBy: string;
  splitMethod: DibbySplitMethod;
  peopleInExpense: DibbySplits[];
}

export interface DibbyParticipant {
  name: string | null;
  uid: string;
  username: string | null;
  owed: number;
  amountPaid: number;
  color: string;
  photoURL: string | null;
  createdUser?: boolean | null;
}

export enum DibbySplitMethod {
  EQUAL_PARTS = "EQUAL_PARTS",
  PERCENTAGE = "PERCENTAGE",
  AMOUNT = "AMOUNT",
}

export interface DibbySplits {
  amount: number;
  uid: string;
  name: string;
}
