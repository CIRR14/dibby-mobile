import { Timestamp } from "firebase/firestore";

export const timestampToString = (date?: Timestamp): string => {
    return date ? new Timestamp(date.seconds, date.nanoseconds).toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit'}) : 'unknown';
}