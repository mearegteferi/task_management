import api from '../lib/api';
import { AttachmentResponse } from '../types/api';

export const attachmentService = {
    getAttachments: async (taskId: number): Promise<AttachmentResponse[]> => {
        const response = await api.get<AttachmentResponse[]>(`/tasks/${taskId}/attachments/`);
        return response.data;
    },

    uploadAttachment: async (taskId: number, file: File): Promise<AttachmentResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<AttachmentResponse>(
            `/tasks/${taskId}/attachments/`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    getDownloadUrl: (attachmentId: number): string => {
        return `${api.defaults.baseURL}/attachments/${attachmentId}/download`;
    }
};
