import api from '../lib/api';
import { ProjectResponse, ProjectStatus } from '../types/api';

export interface ProjectMutationInput {
    title: string;
    description?: string | null;
    status?: ProjectStatus;
    priority?: number;
    due_date?: string | null;
}

export type ProjectUpdateInput = Partial<ProjectMutationInput>;

export const projectService = {
    getProjects: async (skip = 0, limit = 100): Promise<ProjectResponse[]> => {
        const response = await api.get<ProjectResponse[]>('/projects/', {
            params: { skip, limit },
        });
        return response.data;
    },

    getProject: async (id: number): Promise<ProjectResponse> => {
        const response = await api.get<ProjectResponse>(`/projects/${id}`);
        return response.data;
    },

    createProject: async (data: ProjectMutationInput): Promise<ProjectResponse> => {
        const response = await api.post<ProjectResponse>('/projects/', data);
        return response.data;
    },

    updateProject: async (
        id: number,
        data: ProjectUpdateInput
    ): Promise<ProjectResponse> => {
        const response = await api.patch<ProjectResponse>(`/projects/${id}`, data);
        return response.data;
    },

    deleteProject: async (id: number): Promise<void> => {
        await api.delete(`/projects/${id}`);
    },

    restoreProject: async (id: number): Promise<ProjectResponse> => {
        const response = await api.post<ProjectResponse>(`/projects/${id}/restore`);
        return response.data;
    },
};
