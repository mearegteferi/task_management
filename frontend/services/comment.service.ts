import api from '../lib/api';
import { CommentResponse, CommentCreate } from '../types/api';

export const commentService = {
    getComments: async (taskId: number): Promise<CommentResponse[]> => {
        const response = await api.get<CommentResponse[]>(`/tasks/${taskId}/comments/`);
        return response.data;
    },

    createComment: async (taskId: number, data: CommentCreate): Promise<CommentResponse> => {
        const response = await api.post<CommentResponse>(`/tasks/${taskId}/comments/`, data);
        return response.data;
    },
};
