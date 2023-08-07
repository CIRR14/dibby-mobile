import { Item } from "react-native-picker-select";
import { DibbyParticipant, DibbySplits, DibbyTrip, DibbyUser } from "../constants/DibbyTypes";

export const getInitials = (name?: string | null): string => {
    if (name) {
        const initials = name.split(' ');

        if (initials.length > 1) {
            return initials.shift()?.charAt(0).toUpperCase() + initials.pop()!!.charAt(0).toUpperCase();
        } else {
            return name[0].toUpperCase();
        }
    } else {
        return ''
    }
}

export const getTravelerFromId = (tripInfo: DibbyTrip | undefined, id: string | undefined): DibbyParticipant | undefined => {
    return tripInfo && id ? tripInfo.participants.find((t) => t.uid === id) : undefined;
}


export const getItemFormatFromTravelerIds = (tripInfo: DibbyTrip): Item[] => {
    return tripInfo.participants.map((t) => ({
        label: t.name || '',
        value: t.uid,
        key: t.uid,
        color: t.color,
        inputLabel: t.name || ''
    }))
}

export const getInfoFromTravelerId = (tripInfo: DibbyTrip, id: string): {
    label: string,
    value: any,
    key: string,
    color: string,
    inputLabel: string
} => {
    const traveler = tripInfo.participants.find((t) => t.uid === id);
    return {
        label: traveler?.name || '',
        value: traveler?.uid || '',
        key: traveler?.uid || '',
        color: traveler?.color || '',
        inputLabel: traveler?.name || ''
    }
}

export const capitalizeName = (stringToCap: string): string => {
    const words = stringToCap.toLowerCase().split(' ');
    const capitalizedWords = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1) )
    const newString = capitalizedWords.join(' ');
    return newString;
}

export const sumOfValues = (values?: number[]): number => {
    return values ? values.reduce((partialSum, a) => partialSum + a, 0) : 0;
}


export const inRange = (x: number, min: number, max: number): boolean => {
    return (x - min) * (x - max) <= 0;
  };


export const numberWithCommas = (value?: string, decimal = 2) => {
    return value ? parseFloat(parseFloat(value).toFixed(decimal)).toLocaleString(
      "en-IN",
      {
        useGrouping: true,
      }
    ) : value
};
