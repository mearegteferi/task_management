import api from '../lib/api';
import { AttachmentResponse } from '../types/api';

function getFilenameFromDisposition(contentDisposition?: string): string | null {
    if (!contentDisposition) {
        return null;
    }

    const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utfMatch?.[1]) {
        return decodeURIComponent(utfMatch[1]);
    }

    const plainMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
    return plainMatch?.[1] ?? null;
}

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

    downloadAttachment: async (attachmentId: number): Promise<{ blob: Blob; filename: string | null }> => {
        const response = await api.get<Blob>(`/attachments/${attachmentId}/download`, {
            responseType: 'blob',
        });

        return {
            blob: response.data,
            filename: getFilenameFromDisposition(response.headers['content-disposition']),
        };
    },
};
