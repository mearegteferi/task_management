import api from '../lib/api';
import { TaskResponse } from '../types/api';

export const taskService = {
    getTasks: async (projectId: number): Promise<TaskResponse[]> => {
        const response = await api.get<TaskResponse[]>(`/tasks/projects/${projectId}/tasks/`);
        return response.data;
    },

    createTask: async (projectId: number, data: {
        title: string;
        is_completed?: boolean;
        tags?: { name: string; color: string }[];
    }): Promise<TaskResponse> => {
        const response = await api.post<TaskResponse>(`/tasks/projects/${projectId}/tasks/`, data);
        return response.data;
    },

    updateTask: async (taskId: number, data: any): Promise<TaskResponse> => {
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

    getTags: async (): Promise<{ name: string; color: string; id: number }[]> => {
        const response = await api.get('/tags/');
        return response.data;
    },
};
