import api from '../lib/api';
import { AnalyticsResponse } from '../types/api';

export const analyticsService = {
    getAnalytics: async (): Promise<AnalyticsResponse> => {
        const response = await api.get<AnalyticsResponse>('/analytics/');
        return response.data;
    },
};
