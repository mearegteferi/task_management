'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';

import { ProjectResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TaskModalProps {
    projects: ProjectResponse[];
    isOpen: boolean;
    onClose: () => void;
    onSave: (projectId: number, data: { title: string }) => Promise<void>;
}

export function TaskModal({ projects, isOpen, onClose, onSave }: TaskModalProps) {
    const [title, setTitle] = useState('');
    const [projectId, setProjectId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!title.trim() || !projectId) {
            return;
        }

        setIsSaving(true);
        try {
            await onSave(parseInt(projectId, 10), { title });
            setTitle('');
            setProjectId('');
            onClose();
        } catch (error) {
            console.error('Failed to create task:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <Card className="w-full max-w-xl shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border">
                    <CardTitle className="text-xl">New task</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-5 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="task-title">Title</Label>
                            <Input
                                id="task-title"
                                placeholder="Prepare launch checklist"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="task-project-id">Project</Label>
                            <select
                                id="task-project-id"
                                className="flex h-10 w-full rounded-lg border border-input bg-input px-3 text-sm shadow-sm"
                                value={projectId}
                                onChange={(event) => setProjectId(event.target.value)}
                                required
                            >
                                <option value="" disabled>
                                    Select a project
                                </option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </CardContent>

                    <CardFooter className="justify-end gap-3 border-t border-border pt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving || !title.trim() || !projectId}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Create task
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
