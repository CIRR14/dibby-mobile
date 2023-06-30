import { Trip } from "../constants/DibbyTypes";

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


export const getItemFormatFromTravelerIds = (tripInfo: Trip): {
    label: string,
    value: any,
    key: string,
    color: string,
    inputLabel: string
}[] => {
    return tripInfo.travelers.map((t) => ({
        label: t.name,
        value: t.id,
        key: t.id,
        color: t.color,
        inputLabel: t.name
    }))
}

export const getInfoFromTravelerId = (tripInfo: Trip, id: string): {
    label: string,
    value: any,
    key: string,
    color: string,
    inputLabel: string
} => {
    const traveler = tripInfo.travelers.find((t) => t.id === id);
    return {
        label: traveler?.name || '',
        value: traveler?.id || '',
        key: traveler?.id || '',
        color: traveler?.color || '',
        inputLabel: traveler?.name || ''
    }
}