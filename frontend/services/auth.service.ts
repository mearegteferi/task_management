import api from '../lib/api';
import { Message, Token, UpdatePasswordRequest, UserPublic, UserUpdateMe } from '../types/api';

export const authService = {
    login: async (formData: FormData): Promise<{ token: Token; user: UserPublic }> => {
        // Backend expects form-data for login
        const response = await api.post<Token>('/login/access-token', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        // After login, get the user profile
        const userResponse = await api.get<UserPublic>('/users/me', {
            headers: {
                Authorization: `Bearer ${response.data.access_token}`,
            },
        });

        return { token: response.data, user: userResponse.data };
    },

    register: async (data: Record<string, unknown>): Promise<UserPublic> => {
        const response = await api.post<UserPublic>('/users/signup', data);
        return response.data;
    },

    getCurrentUser: async (): Promise<UserPublic> => {
        const response = await api.get<UserPublic>('/users/me');
        return response.data;
    },

    updateProfile: async (data: UserUpdateMe): Promise<UserPublic> => {
        const response = await api.patch<UserPublic>('/users/me', data);
        return response.data;
    },

    updatePassword: async (data: UpdatePasswordRequest): Promise<Message> => {
        const response = await api.patch<Message>('/users/me/password', data);
        return response.data;
    },

    recoverPassword: async (email: string): Promise<Message> => {
        const response = await api.post<Message>(`/password-recovery/${email}`);
        return response.data;
    },

    resetPassword: async (data: Record<string, unknown>): Promise<Message> => {
        const response = await api.post<Message>('/reset-password/', data);
        return response.data;
    },
};
