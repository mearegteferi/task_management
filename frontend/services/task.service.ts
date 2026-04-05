import api from '../lib/api';
import { TagResponse, TaskResponse, TaskStatus } from '../types/api';

export interface TaskCreateInput {
    title: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: number;
    is_completed?: boolean;
    tags?: { name: string; color: string }[];
}

export interface TaskUpdateInput {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: number;
    is_completed?: boolean;
    tags?: { name: string; color: string }[];
}

export const taskService = {
    getTasks: async (projectId: number): Promise<TaskResponse[]> => {
        const response = await api.get<TaskResponse[]>(`/tasks/projects/${projectId}/tasks/`);
        return response.data;
    },

    createTask: async (
        projectId: number,
        data: TaskCreateInput
    ): Promise<TaskResponse> => {
        const response = await api.post<TaskResponse>(`/tasks/projects/${projectId}/tasks/`, data);
        return response.data;
    },

    updateTask: async (
        taskId: number,
        data: TaskUpdateInput
    ): Promise<TaskResponse> => {
        const response = await api.patch<TaskResponse>(`/tasks/tasks/${taskId}`, data);
        return response.data;
    },

    deleteTask: async (taskId: number): Promise<void> => {
        await api.delete(`/tasks/tasks/${taskId}`);
    },

    getAllUserTasks: async (): Promise<(TaskResponse & { projectTitle: string })[]> => {
        const { projectService } = await import('./project.service');
        const projects = await projectService.getProjects();

        const tasksPromises = projects.map(async (project) => {
            const tasks = await taskService.getTasks(project.id);
            return tasks.map(t => ({ ...t, projectTitle: project.title }));
        });

        const tasksResults = await Promise.all(tasksPromises);
        return tasksResults.flat();
    },

    getTags: async (): Promise<TagResponse[]> => {
        const response = await api.get<TagResponse[]>('/tags/');
        return response.data;
    },
};
