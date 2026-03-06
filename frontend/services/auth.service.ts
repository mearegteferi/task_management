import api from '../lib/api';
import { Token, UserPublic } from '../types/api';

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

    register: async (data: any): Promise<UserPublic> => {
        const response = await api.post<UserPublic>('/users/signup', data);
        return response.data;
    },

    recoverPassword: async (email: string): Promise<{ message: string }> => {
        const response = await api.post<{ message: string }>(`/password-recovery/${email}`);
        return response.data;
    },

    resetPassword: async (data: any): Promise<{ message: string }> => {
        const response = await api.post<{ message: string }>('/reset-password/', data);
        return response.data;
    },
};
