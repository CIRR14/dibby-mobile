import { FieldValue, Timestamp } from "firebase/firestore";


export interface TripDoc {
    created: Timestamp;
    updated: Timestamp;
    name: string;
    perPerson: number;
    amount: number;
    completed: boolean;
    expenses: Expense[];
    travelers: Traveler[];
}

export interface Trip extends TripDoc {
    id: string;
}

export interface Expense {
    id: string;
    created: Timestamp;
    updated: Timestamp;
    name: string;
    payer: string;
    amount: number | string;
    peopleInExpense: string[];
    equal: boolean;
    perPerson: number;
}

export interface Traveler {
    id: string;
    amountPaid: number;
    color: string;
    name: string;
    owed: number;
    paid: boolean;
    me?: boolean;
}
