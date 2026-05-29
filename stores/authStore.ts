import { User } from "firebase/auth";
import { create } from "zustand";

interface AuthState {
    loggedInUser: User | null;
    authReady: boolean;
    setAuthState: (user: User | null) => void;
}

const useAuthStore = create<AuthState>((set) => ({
    loggedInUser: null,
    authReady: false,
    setAuthState: (user) => {
        set({ loggedInUser: user, authReady: true });
    },
}));

export const useAuthSelector = <T>(selector: (state: AuthState) => T): T =>
    useAuthStore(selector);

export default useAuthStore;
export type { AuthState };
