import api from '@/lib/api';
import {
    ArchitectConfirmResponse,
    ArchitectDraftResponse,
} from '@/types/api';

export const architectService = {
    suggest: async (
        title: string,
        description: string
    ): Promise<ArchitectDraftResponse> => {
        const response = await api.post<ArchitectDraftResponse>(
            '/architect/suggest',
            {
                title,
                description: description || null,
            }
        );
        return response.data;
    },

    chat: async (
        sessionId: string,
        message: string
    ): Promise<ArchitectDraftResponse> => {
        const response = await api.post<ArchitectDraftResponse>(
            '/architect/chat',
            {
                session_id: sessionId,
                feedback: message,
            }
        );
        return response.data;
    },

    confirm: async (sessionId: string): Promise<ArchitectConfirmResponse> => {
        const response = await api.post<ArchitectConfirmResponse>(
            '/architect/confirm',
            {
                session_id: sessionId,
            }
        );
        return response.data;
    },
};
