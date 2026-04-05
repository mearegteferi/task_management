import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const { refreshToken, updateAccessToken, clearAuth } = useAuthStore.getState();

            if (refreshToken) {
                try {
                    const response = await axios.post(`${api.defaults.baseURL}/refresh-token`, {
                        refresh_token: refreshToken,
                    });
                    const { access_token } = response.data;
                    updateAccessToken(access_token);
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return api(originalRequest);
                } catch {
                    clearAuth();
                    window.location.href = '/login';
                }
            } else {
                clearAuth();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
