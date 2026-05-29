import { create } from "zustand";
import { DibbyUser } from "../constants/DibbyTypes";

export type ProfileStatus = "none" | "missing" | "incomplete" | "complete";

interface UserState {
    dibbyUser: DibbyUser | undefined;
    profileReady: boolean;
    profileStatus: ProfileStatus;
    setProfileLoading: () => void;
    setProfileNone: () => void;
    setProfileMissing: () => void;
    setProfile: (user: DibbyUser, status: ProfileStatus) => void;
}

const useUserStore = create<UserState>((set) => ({
    dibbyUser: undefined,
    profileReady: false,
    profileStatus: "none",
    setProfileLoading: () => {
        set({ profileReady: false });
    },
    setProfileNone: () => {
        set({ dibbyUser: undefined, profileStatus: "none", profileReady: true });
    },
    setProfileMissing: () => {
        set({ dibbyUser: undefined, profileStatus: "missing", profileReady: true });
    },
    setProfile: (user, status) => {
        set({ dibbyUser: user, profileStatus: status, profileReady: true });
    },
}));

export const useUserSelector = <T>(selector: (state: UserState) => T): T =>
    useUserStore(selector);

export default useUserStore;
export type { UserState };
