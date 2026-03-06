'use client';

import { useEffect, useState } from 'react';
import { taskService } from '@/services/task.service';
import { projectService } from '@/services/project.service';
import { TaskResponse, ProjectResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Loader2,
    Search,
    Filter,
    Plus,
    Sparkles,
    Activity,
    ChevronRight,
    SearchX,
    Briefcase
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskDetailModal } from '@/components/modals/TaskDetailModal';
import { TaskModal } from '@/components/modals/TaskModal';

type ExtendedTask = TaskResponse & { projectTitle: string };

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.03 }
    }
};

const item = {
    hidden: { x: -20, opacity: 0 },
    show: { x: 0, opacity: 1 }
};

export default function TasksPage() {
    const [tasks, setTasks] = useState<ExtendedTask[]>([]);
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');

    // Modal states
    const [selectedTask, setSelectedTask] = useState<ExtendedTask | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            const [tasksData, projectsData] = await Promise.all([
                taskService.getAllUserTasks(),
                projectService.getProjects()
            ]);
            setTasks(tasksData);
            setProjects(projectsData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleToggleTask = async (e: React.MouseEvent, taskId: number, isCompleted: boolean) => {
        e.stopPropagation();
        try {
            const updatedTask = await taskService.updateTask(taskId, { is_completed: !isCompleted });
            setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updatedTask } : t));
            if (selectedTask?.id === taskId) {
                setSelectedTask({ ...selectedTask, ...updatedTask });
            }
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    };

    const handleSaveNewTask = async (projectId: number, data: { title: string }) => {
        try {
            const newTask = await taskService.createTask(projectId, data);
            const project = projects.find(p => p.id === projectId);
            const extendedNewTask: ExtendedTask = {
                ...newTask,
                projectTitle: project?.title || 'Unknown Project'
            };
            setTasks([extendedNewTask, ...tasks]);
        } catch (error) {
            console.error('Failed to create task:', error);
            throw error;
        }
    };

    const handleUpdateTaskInList = (updatedTask: TaskResponse) => {
        setTasks(tasks.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
    };

    const handleDeleteTask = async (taskId: number) => {
        try {
            await taskService.deleteTask(taskId);
            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    };

    const handleOpenDetail = (task: ExtendedTask) => {
        setSelectedTask(task);
        setIsDetailModalOpen(true);
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.projectTitle.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' ||
            (filter === 'todo' && !task.is_completed) ||
            (filter === 'done' && task.is_completed);
        return matchesSearch && matchesFilter;
    });

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-background/50 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl font-black tracking-tighter text-foreground">
                        Global <span className="text-primary italic">Streams</span>
                    </h1>
                    <p className="text-foreground/50 text-sm font-medium flex items-center gap-2">
                        <Activity size={14} className="text-accent" />
                        Synchronize your focus across all project orbits.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex p-1 bg-card/50 backdrop-blur-md rounded-2xl ring-1 ring-border/50">
                        {(['all', 'todo', 'done'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                                    filter === f ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-foreground/50 hover:text-primary"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-11 rounded-2xl bg-primary px-6 font-black italic shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus size={18} className="mr-2" />
                        NEW ACTION
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-xl overflow-hidden min-h-[600px] flex flex-col">
                <CardHeader className="p-6 border-b border-border/50 bg-gradient-to-r from-background/50 to-card/50">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                        <div className="relative group flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Locate a specific stream or project..."
                                className="pl-10 h-11 bg-background/50 border-none rounded-2xl shadow-inner focus-visible:ring-1 focus-visible:ring-primary/50 text-[10px] font-bold uppercase tracking-widest"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4 text-zinc-400">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black uppercase tracking-widest">Active Streams</span>
                                <span className="text-xs font-black text-foreground">{filteredTasks.length}</span>
                            </div>
                            <Filter size={18} className="text-primary" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <motion.div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {filteredTasks.length > 0 ? (
                                filteredTasks.map((task) => (
                                    <motion.div
                                        key={task.id}
                                        variants={item}
                                        layout
                                        onClick={() => handleOpenDetail(task)}
                                        className="group flex items-center justify-between rounded-[1.5rem] border border-border/50 p-4 transition-all bg-card/40 hover:bg-white/70 dark:hover:bg-zinc-800/50 hover:border-primary/50 cursor-pointer relative overflow-hidden shadow-sm"
                                    >
                                        {task.is_completed && (
                                            <div className="absolute inset-0 bg-primary/5 backdrop-blur-[1px] pointer-events-none" />
                                        )}
                                        <div className="flex items-center gap-6 relative z-10">
                                            <div
                                                onClick={(e) => handleToggleTask(e, task.id, task.is_completed)}
                                                className={cn(
                                                    "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer hover:scale-110",
                                                    task.is_completed ? "bg-primary border-primary border-none shadow-lg shadow-primary/40" : "border-border hover:border-primary"
                                                )}
                                            >
                                                {task.is_completed && <Plus size={16} className="text-white rotate-45" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={cn(
                                                    "text-lg font-black tracking-tight transition-all group-hover:text-primary",
                                                    task.is_completed ? "text-zinc-400 line-through italic" : "text-foreground"
                                                )}>
                                                    {task.title}
                                                </span>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-secondary/50 text-[9px] font-black uppercase tracking-widest text-foreground/50">
                                                        <Briefcase size={10} className="text-primary" />
                                                        {task.projectTitle}
                                                    </div>
                                                    <div className="flex gap-1.5">
                                                        {task.tags.map(tag => (
                                                            <span key={tag.id} className="text-[9px] font-black uppercase tracking-widest text-primary/70 italic">
                                                                #{tag.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className="hidden sm:flex flex-col items-end opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/50">Initiated</span>
                                                <span className="text-[10px] font-black text-primary">{new Date(task.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white/50 dark:bg-zinc-800 shadow-sm border border-border/50 text-zinc-400 group-hover:text-primary group-hover:scale-110 transition-all">
                                                <ChevronRight size={20} />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="py-32 text-center flex flex-col items-center gap-6"
                                >
                                    <div className="h-24 w-24 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-950/20 shadow-inner ring-1 ring-border/50 flex items-center justify-center">
                                        <SearchX size={48} className="text-zinc-200" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black tracking-tighter text-foreground">Void in the Stream</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/50">No signals matching your search</p>
                                    </div>
                                    <Button onClick={() => setIsCreateModalOpen(true)} variant="outline" className="rounded-2xl font-black italic border-primary text-primary hover:bg-primary/10">
                                        INITIATE NEW SIGNAL
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </CardContent>
            </Card>

            <TaskModal
                projects={projects}
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleSaveNewTask}
            />

            <TaskDetailModal
                task={selectedTask}
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                onUpdate={handleUpdateTaskInList}
                onDelete={handleDeleteTask}
            />
        </motion.div>
    );
}
