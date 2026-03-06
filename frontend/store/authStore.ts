import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Token, UserPublic } from '../types/api';

interface AuthState {
    user: UserPublic | null;
    accessToken: string | null;
    refreshToken: string | null;
    setAuth: (user: UserPublic, accessToken: string, refreshToken: string) => void;
    clearAuth: () => void;
    updateAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            setAuth: (user, accessToken, refreshToken) =>
                set({ user, accessToken, refreshToken }),
            clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
            updateAccessToken: (accessToken) => set({ accessToken }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
