'use client';

import { useState, useEffect } from 'react';
import { ProjectResponse, ProjectStatus } from '@/types/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, X } from 'lucide-react';

interface ProjectModalProps {
    project?: ProjectResponse | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
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

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-lg shadow-2xl border-none bg-card/90 backdrop-blur-xl animate-in fade-in zoom-in duration-200 rounded-[2rem] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4 p-8">
                    <CardTitle className="text-2xl font-black tracking-tighter">
                        {project ? 'Refine' : 'Initiate'} <span className="text-primary italic">Orbit</span>
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 rounded-full hover:bg-secondary">
                        <X size={20} />
                    </Button>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6 p-8">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50 ml-1">Orbit Label</Label>
                            <Input
                                id="title"
                                placeholder="E.g. Website Evolution"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-12 bg-secondary/50 border-none rounded-2xl px-6 focus-visible:ring-primary shadow-inner font-bold"
                                minLength={3}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50 ml-1">Mission Intel</Label>
                            <textarea
                                id="description"
                                className="flex min-h-[120px] w-full rounded-[1.5rem] border-none bg-secondary/50 px-6 py-4 text-sm font-bold shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all resize-none"
                                placeholder="Define the trajectory of this mission..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50 ml-1">Current State</Label>
                                <select
                                    id="status"
                                    className="flex h-12 w-full rounded-2xl border-none bg-secondary/50 px-6 text-sm font-bold shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all appearance-none cursor-pointer"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                                >
                                    <option value="todo" className="dark:bg-background">PRE-START</option>
                                    <option value="in_progress" className="dark:bg-background">ACTIVE FLOW</option>
                                    <option value="done" className="dark:bg-background">SYNCHRONIZED</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priority" className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50 ml-1">Urgency</Label>
                                <select
                                    id="priority"
                                    className="flex h-12 w-full rounded-2xl border-none bg-secondary/50 px-6 text-sm font-bold shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all appearance-none cursor-pointer"
                                    value={priority}
                                    onChange={(e) => setPriority(parseInt(e.target.value))}
                                >
                                    <option value={1} className="dark:bg-background">FLOW</option>
                                    <option value={2} className="dark:bg-background">STABLE</option>
                                    <option value={3} className="dark:bg-background">URGENT</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dueDate" className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50 ml-1">Event Horizon</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="h-12 bg-secondary/50 border-none rounded-2xl px-6 focus-visible:ring-primary shadow-inner font-bold"
                                max="2099-12-31"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 p-8 pt-0">
                        <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold text-foreground/50 hover:text-foreground">
                            ABORT
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving || !title.trim()}
                            className="rounded-2xl h-12 px-8 bg-primary font-black italic shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-white border-none"
                        >
                            {isSaving && <Loader2 size={18} className="mr-2 animate-spin" />}
                            {project ? 'UPGRADE ORBIT' : 'LAUNCH ORBIT'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
