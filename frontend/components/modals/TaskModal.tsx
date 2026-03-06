'use client';

import { useState } from 'react';
import { ProjectResponse } from '@/types/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, X, Zap } from 'lucide-react';

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

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !projectId) return;

        setIsSaving(true);
        try {
            await onSave(parseInt(projectId), { title });
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-lg shadow-2xl border-none bg-card/90 backdrop-blur-xl animate-in fade-in zoom-in duration-200 rounded-[2rem] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4 p-8">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <Zap size={20} className="animate-pulse" />
                        </div>
                        <CardTitle className="text-2xl font-black tracking-tighter">Initiate <span className="text-primary italic">Stream</span></CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 rounded-full hover:bg-secondary">
                        <X size={20} />
                    </Button>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6 p-8">
                        <div className="space-y-2">
                            <Label htmlFor="task-title" className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50 ml-1">Stream Label</Label>
                            <Input
                                id="task-title"
                                placeholder="E.g. Design System Audit"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-12 bg-secondary/50 border-none rounded-2xl px-6 focus-visible:ring-primary shadow-inner font-bold"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="project-id" className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50 ml-1">Parent Orbit</Label>
                            <select
                                id="project-id"
                                className="flex h-12 w-full rounded-2xl border-none bg-secondary/50 px-6 py-2 text-sm font-bold shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary transition-all appearance-none cursor-pointer"
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                required
                            >
                                <option value="" disabled className="dark:bg-background">Select an orbit...</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id} className="dark:bg-background">
                                        {p.title.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 p-8 pt-0">
                        <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold text-foreground/50 hover:text-foreground">
                            ABORT
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving || !title.trim() || !projectId}
                            className="rounded-2xl h-12 px-8 bg-primary font-black italic shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-white border-none"
                        >
                            {isSaving && <Loader2 size={18} className="mr-2 animate-spin" />}
                            INITIATE FLOW
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
