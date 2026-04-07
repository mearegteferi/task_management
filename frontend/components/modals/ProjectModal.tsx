'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';

import { ProjectMutationInput } from '@/services/project.service';
import { ProjectResponse, ProjectStatus } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProjectModalProps {
    project?: ProjectResponse | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ProjectMutationInput) => Promise<void>;
}

export function ProjectModal({ project, isOpen, onClose, onSave }: ProjectModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<ProjectStatus>('todo');
    const [priority, setPriority] = useState(2);
    const [dueDate, setDueDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (project) {
            setTitle(project.title);
            setDescription(project.description || '');
            setStatus(project.status);
            setPriority(project.priority);
            setDueDate(project.due_date ? project.due_date.split('T')[0] : '');
        } else {
            setTitle('');
            setDescription('');
            setStatus('todo');
            setPriority(2);
            setDueDate('');
        }
    }, [project, isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSaving(true);

        try {
            await onSave({
                title,
                description,
                status,
                priority,
                due_date: dueDate || null,
            });
            onClose();
        } catch (error) {
            console.error('Failed to save project:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <Card className="w-full max-w-2xl shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border">
                    <CardTitle className="text-xl">
                        {project ? 'Edit project' : 'New project'}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-5 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="project-title">Title</Label>
                            <Input
                                id="project-title"
                                placeholder="Website redesign"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                minLength={3}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="project-description">Description</Label>
                            <textarea
                                id="project-description"
                                className="min-h-32 w-full rounded-lg border border-input bg-input px-3 py-2 text-sm shadow-sm"
                                placeholder="Add the project summary."
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="project-status">Status</Label>
                                <select
                                    id="project-status"
                                    className="flex h-10 w-full rounded-lg border border-input bg-input px-3 text-sm shadow-sm"
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value as ProjectStatus)}
                                >
                                    <option value="todo">To do</option>
                                    <option value="in_progress">In progress</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="project-priority">Priority</Label>
                                <select
                                    id="project-priority"
                                    className="flex h-10 w-full rounded-lg border border-input bg-input px-3 text-sm shadow-sm"
                                    value={priority}
                                    onChange={(event) => setPriority(Number(event.target.value))}
                                >
                                    <option value={1}>Low</option>
                                    <option value={2}>Medium</option>
                                    <option value={3}>High</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="project-due-date">Due date</Label>
                                <Input
                                    id="project-due-date"
                                    type="date"
                                    value={dueDate}
                                    onChange={(event) => setDueDate(event.target.value)}
                                    max="2099-12-31"
                                />
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="justify-end gap-3 border-t border-border pt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving || !title.trim()}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {project ? 'Save project' : 'Create project'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
