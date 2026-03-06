'use client';

import { useEffect, useState, use } from 'react';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { ProjectResponse, TaskResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Plus,
    Calendar,
    Flag,
    Loader2,
    ChevronLeft,
    AlertCircle,
    ExternalLink,
    Zap,
    Target,
    Activity,
    Search,
    Clock
} from 'lucide-react';
import Link from 'next/link';
import { TaskDetailModal } from '@/components/modals/TaskDetailModal';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const item = {
    hidden: { x: -20, opacity: 0 },
    show: { x: 0, opacity: 1 }
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const projectId = parseInt(resolvedParams.id);

    const [project, setProject] = useState<ProjectResponse | null>(null);
    const [tasks, setTasks] = useState<TaskResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectData, tasksData] = await Promise.all([
                    projectService.getProject(projectId),
                    taskService.getTasks(projectId),
                ]);
                setProject(projectData);
                setTasks(tasksData);
            } catch (error) {
                console.error('Failed to fetch project data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [projectId]);

    const handleToggleTask = async (e: React.MouseEvent, taskId: number, isCompleted: boolean) => {
        e.stopPropagation();
        try {
            const updatedTask = await taskService.updateTask(taskId, { is_completed: !isCompleted });
            setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        setIsAddingTask(true);
        try {
            const newTask = await taskService.createTask(projectId, { title: newTaskTitle });
            setTasks([...tasks, newTask]);
            setNewTaskTitle('');
        } catch (error) {
            console.error('Failed to add task:', error);
        } finally {
            setIsAddingTask(false);
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        try {
            await taskService.deleteTask(taskId);
            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    };

    const handleOpenTaskDetails = (task: TaskResponse) => {
        setSelectedTask(task);
        setIsTaskModalOpen(true);
    };

    const handleUpdateTaskInList = (updatedTask: TaskResponse) => {
        setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-background/50 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle size={64} className="text-red-500/50 mb-6 animate-pulse" />
                <h3 className="text-3xl font-black tracking-tighter text-foreground mb-2">Project Lost in Aura</h3>
                <p className="text-zinc-500 font-medium mb-8">This data stream is no longer reachable.</p>
                <Button asChild className="rounded-2xl h-11 px-8 bg-primary font-bold italic">
                    <Link href="/projects">BACK TO PROJECTS</Link>
                </Button>
            </div>
        );
    }

    const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.is_completed).length / tasks.length) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-2xl h-12 w-12 bg-white/50 dark:bg-zinc-900/50 shadow-sm hover:scale-105 transition-transform border-none">
                        <Link href="/projects">
                            <ChevronLeft size={24} className="text-primary" />
                        </Link>
                    </Button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black tracking-tighter text-foreground group">
                                {project.title}
                            </h1>
                            <Badge className={cn(
                                "rounded-full px-3 py-0.5 text-[10px] uppercase font-black tracking-widest border-none self-center",
                                project.status === 'done' ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'
                            )}>
                                {project.status.replace('_', ' ')}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-zinc-500 text-sm font-medium">
                            <div className="flex items-center gap-1.5 p-1 px-3 rounded-full bg-white/50 dark:bg-zinc-900/50 shadow-sm ring-1 ring-border/50">
                                <Calendar size={14} className="text-primary" />
                                <span>DUE {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'NO DEADLINE'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 p-1 px-3 rounded-full bg-white/50 dark:bg-zinc-900/50 shadow-sm ring-1 ring-border/50">
                                <Target size={14} className="text-accent" />
                                <span>{tasks.length} STREAMS</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-6">
                    <Card className="border-none shadow-2xl shadow-primary/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl overflow-hidden min-h-[500px] flex flex-col">
                        <CardHeader className="p-6 border-b border-border/50 bg-gradient-to-r from-zinc-50/50 to-white/50 dark:from-zinc-900/50 dark:to-zinc-800/50 flex flex-row items-center justify-between">
                            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                <Zap size={20} className="text-accent animate-pulse" />
                                Action Streams
                            </CardTitle>
                            <div className="flex items-center gap-3">
                                <div className="relative group hidden sm:block">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Search streams..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 h-10 w-48 bg-background/50 border-none rounded-2xl shadow-inner focus-visible:ring-1 focus-visible:ring-primary/50 text-[10px] font-bold uppercase tracking-widest"
                                    />
                                </div>
                                <Activity size={18} className="text-primary hidden sm:block" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
                            <form onSubmit={handleAddTask} className="flex gap-3">
                                <Input
                                    placeholder="Add a new action stream..."
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    disabled={isAddingTask}
                                    className="h-12 bg-white/80 dark:bg-zinc-950/20 border-border/50 shadow-inner rounded-2xl px-6 focus-visible:ring-primary focus:scale-[1.01] transition-all"
                                />
                                <Button type="submit" disabled={isAddingTask || !newTaskTitle.trim()} className="h-12 w-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all p-0">
                                    {isAddingTask ? <Loader2 size={18} className="animate-spin" /> : <Plus size={24} />}
                                </Button>
                            </form>

                            <motion.div
                                variants={container}
                                initial="hidden"
                                animate="show"
                                className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar"
                            >
                                <AnimatePresence mode="popLayout">
                                    {filteredTasks.length > 0 ? (
                                        filteredTasks.map((task) => (
                                            <motion.div
                                                key={task.id}
                                                variants={item}
                                                layout
                                                onClick={() => handleOpenTaskDetails(task)}
                                                className="group flex items-center justify-between rounded-[1.5rem] border border-border/50 p-4 transition-all bg-white/40 dark:bg-zinc-900/30 hover:bg-white/70 dark:hover:bg-zinc-800/50 hover:border-primary/50 cursor-pointer shadow-sm relative overflow-hidden"
                                            >
                                                {task.is_completed && (
                                                    <div className="absolute inset-0 bg-primary/5 backdrop-blur-[1px] pointer-events-none" />
                                                )}
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div
                                                        onClick={(e) => handleToggleTask(e, task.id, task.is_completed)}
                                                        className={cn(
                                                            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer",
                                                            task.is_completed ? "bg-primary border-primary border-none shadow-lg shadow-primary/40" : "border-zinc-300 dark:border-zinc-700 hover:border-primary"
                                                        )}
                                                    >
                                                        {task.is_completed && <Plus size={14} className="text-white rotate-45" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={cn(
                                                            "font-bold transition-all group-hover:text-primary tracking-tight",
                                                            task.is_completed ? "text-zinc-400 line-through italic" : "text-foreground"
                                                        )}>
                                                            {task.title}
                                                        </span>
                                                        <div className="flex gap-1 mt-1">
                                                            {task.tags.map(tag => (
                                                                <span key={tag.id} className="text-[9px] font-black uppercase tracking-widest text-primary/70 bg-primary/5 px-2 rounded-md">
                                                                    #{tag.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 relative z-10">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Stream ID</span>
                                                        <span className="text-[10px] font-black tracking-widest text-primary italic">#{task.id}</span>
                                                    </div>
                                                    <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                        <ExternalLink size={16} />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center flex flex-col items-center gap-4 bg-zinc-50/50 dark:bg-zinc-950/20 rounded-[2.5rem] border-2 border-dashed border-border/50">
                                            <div className="h-16 w-16 rounded-full bg-white dark:bg-zinc-900 shadow-inner flex items-center justify-center">
                                                <Zap size={32} className="text-zinc-200" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-black tracking-tighter text-foreground">Aura Clean</h3>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">No action streams in focus</p>
                                            </div>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-2xl shadow-primary/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl overflow-hidden p-6 relative group">
                        <div className="absolute -right-8 -top-8 h-24 w-24 bg-primary/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-colors" />
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6">Execution Aura</CardTitle>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Progress</span>
                                    <div className="text-4xl font-black tracking-tighter text-foreground">{completionRate}%</div>
                                </div>
                                <div className="h-16 w-16 relative">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="32" cy="32" r="28"
                                            stroke="currentColor"
                                            strokeWidth="6"
                                            fill="transparent"
                                            className="text-zinc-100 dark:text-zinc-800"
                                        />
                                        <motion.circle
                                            cx="32" cy="32" r="28"
                                            stroke="currentColor"
                                            strokeWidth="6"
                                            fill="transparent"
                                            strokeDasharray={175.92}
                                            initial={{ strokeDashoffset: 175.92 }}
                                            animate={{ strokeDashoffset: 175.92 - (175.92 * completionRate) / 100 }}
                                            transition={{ duration: 1.5, ease: "easeInOut" }}
                                            className="text-primary"
                                        />
                                    </svg>
                                    <Zap size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                    <span>Stream Capacity</span>
                                    <span>{tasks.filter(t => t.is_completed).length}/{tasks.length} DONE</span>
                                </div>
                                <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completionRate}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_12px_rgba(var(--primary),0.5)]"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-primary/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl overflow-hidden">
                        <CardHeader className="p-6 pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">Project Credentials</CardTitle>
                            <Target size={16} className="text-primary" />
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-6">
                            <div className="space-y-2">
                                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Description</span>
                                <p className="text-sm font-medium leading-relaxed italic text-foreground/80">
                                    &quot;{project.description || 'No vision provided for this stream.'}&quot;
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-6">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Priority</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={cn(
                                            "h-2 w-2 rounded-full",
                                            project.priority === 3 ? 'bg-red-500 animate-pulse' : project.priority === 2 ? 'bg-orange-500' : 'bg-slate-400'
                                        )} />
                                        <span className="text-xs font-black tracking-tight">{project.priority === 3 ? 'CRITICAL' : project.priority === 2 ? 'STANDARD' : 'FLOW'}</span>
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Origin</span>
                                    <span className="text-xs font-black tracking-tight block mt-1">{new Date(project.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="pt-4">
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-900 shadow-inner ring-1 ring-border/50 flex items-center gap-4 group cursor-pointer hover:ring-primary/50 transition-all">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Clock size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Next Milestone</span>
                                        <p className="text-[11px] font-bold text-zinc-500 mt-0.5">Stream synchronization in 2 days</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <TaskDetailModal
                task={selectedTask}
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onUpdate={handleUpdateTaskInList}
                onDelete={handleDeleteTask}
            />
        </motion.div>
    );
}
