'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import { TaskDetailModal } from '@/components/modals/TaskDetailModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { ProjectResponse, TaskResponse } from '@/types/api';
import {
    ArrowLeft,
    CalendarDays,
    CircleCheckBig,
    FolderKanban,
    ListPlus,
    ListTodo,
    Loader2,
    PanelRightOpen,
    Search,
    Trash2,
} from 'lucide-react';

function formatProjectStatus(status: ProjectResponse['status']) {
    switch (status) {
        case 'in_progress':
            return 'In progress';
        case 'done':
            return 'Done';
        default:
            return 'To do';
    }
}

function getPriorityLabel(priority: number) {
    if (priority === 3) {
        return 'High';
    }
    if (priority === 2) {
        return 'Medium';
    }
    return 'Low';
}

function isTypingTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const projectId = parseInt(resolvedParams.id, 10);
    const searchRef = useRef<HTMLInputElement | null>(null);

    const [project, setProject] = useState<ProjectResponse | null>(null);
    const [tasks, setTasks] = useState<TaskResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'done'>('all');
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [draftTitle, setDraftTitle] = useState('');
    const [draftDescription, setDraftDescription] = useState('');
    const [draftStatus, setDraftStatus] = useState<ProjectResponse['status']>('todo');
    const [draftPriority, setDraftPriority] = useState(2);
    const [draftDueDate, setDraftDueDate] = useState('');
    const [isSavingProject, setIsSavingProject] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [projectData, tasksData] = await Promise.all([
                    projectService.getProject(projectId),
                    taskService.getTasks(projectId),
                ]);
                setProject(projectData);
                setTasks(tasksData);
                setSelectedTaskId(tasksData[0]?.id ?? null);
                setDraftTitle(projectData.title);
                setDraftDescription(projectData.description || '');
                setDraftStatus(projectData.status);
                setDraftPriority(projectData.priority);
                setDraftDueDate(projectData.due_date ? projectData.due_date.split('T')[0] : '');
            } catch (fetchError) {
                console.error('Failed to fetch project data:', fetchError);
                setError('This project could not be loaded right now.');
            } finally {
                setIsLoading(false);
            }
        };

        void fetchData();
    }, [projectId]);

    const filteredTasks = useMemo(() => {
        return [...tasks]
            .filter((task) => {
                const lowered = searchQuery.toLowerCase();
                const matchesSearch = task.title.toLowerCase().includes(lowered)
                    || task.description?.toLowerCase().includes(lowered);
                const matchesFilter = statusFilter === 'all'
                    || (statusFilter === 'done' && task.is_completed)
                    || (statusFilter === 'open' && !task.is_completed);
                return matchesSearch && matchesFilter;
            })
            .sort((left, right) => {
                if (left.is_completed !== right.is_completed) {
                    return Number(left.is_completed) - Number(right.is_completed);
                }
                if (right.priority !== left.priority) {
                    return right.priority - left.priority;
                }
                return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
            });
    }, [searchQuery, statusFilter, tasks]);

    const selectedTask = useMemo(
        () => filteredTasks.find((task) => task.id === selectedTaskId) || tasks.find((task) => task.id === selectedTaskId) || null,
        [filteredTasks, selectedTaskId, tasks]
    );

    useEffect(() => {
        if (!filteredTasks.length) {
            if (selectedTaskId && !tasks.some((task) => task.id === selectedTaskId)) {
                setSelectedTaskId(null);
            }
            return;
        }

        if (!selectedTaskId || !tasks.some((task) => task.id === selectedTaskId)) {
            setSelectedTaskId(filteredTasks[0].id);
        }
    }, [filteredTasks, selectedTaskId, tasks]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isTypingTarget(event.target)) {
                return;
            }

            if (event.key === '/') {
                event.preventDefault();
                searchRef.current?.focus();
                return;
            }

            if (!filteredTasks.length) {
                return;
            }

            const currentIndex = filteredTasks.findIndex((task) => task.id === selectedTaskId);

            if (event.key.toLowerCase() === 'j') {
                event.preventDefault();
                const nextIndex = currentIndex < filteredTasks.length - 1 ? currentIndex + 1 : 0;
                setSelectedTaskId(filteredTasks[nextIndex].id);
            }

            if (event.key.toLowerCase() === 'k') {
                event.preventDefault();
                const nextIndex = currentIndex > 0 ? currentIndex - 1 : filteredTasks.length - 1;
                setSelectedTaskId(filteredTasks[nextIndex].id);
            }

            if (event.key.toLowerCase() === 'x' && selectedTask) {
                event.preventDefault();
                void handleToggleTask(selectedTask.id, selectedTask.is_completed);
            }

            if (event.key.toLowerCase() === 'e' && selectedTask) {
                event.preventDefault();
                setIsTaskModalOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredTasks, selectedTask, selectedTaskId]);

    const projectIsDirty = !!project && (
        draftTitle !== project.title
        || draftDescription !== (project.description || '')
        || draftStatus !== project.status
        || draftPriority !== project.priority
        || draftDueDate !== (project.due_date ? project.due_date.split('T')[0] : '')
    );
    const completedTasks = tasks.filter((task) => task.is_completed).length;
    const openTasks = tasks.length - completedTasks;

    const handleToggleTask = async (taskId: number, isCompleted: boolean) => {
        try {
            const updated = await taskService.updateTask(taskId, { is_completed: !isCompleted });
            setTasks((current) => current.map((task) => task.id === taskId ? updated : task));
        } catch (updateError) {
            console.error('Failed to update task:', updateError);
        }
    };

    const handleAddTask = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!newTaskTitle.trim()) {
            return;
        }

        setIsAddingTask(true);
        try {
            const created = await taskService.createTask(projectId, { title: newTaskTitle.trim() });
            setTasks((current) => [created, ...current]);
            setNewTaskTitle('');
            setSelectedTaskId(created.id);
        } catch (createError) {
            console.error('Failed to add task:', createError);
        } finally {
            setIsAddingTask(false);
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        try {
            await taskService.deleteTask(taskId);
            const remaining = tasks.filter((task) => task.id !== taskId);
            setTasks(remaining);
            if (selectedTaskId === taskId) {
                setSelectedTaskId(remaining[0]?.id ?? null);
            }
        } catch (deleteError) {
            console.error('Failed to delete task:', deleteError);
        }
    };

    const handleSaveProject = async () => {
        if (!project || !projectIsDirty) {
            return;
        }

        setIsSavingProject(true);
        try {
            const updated = await projectService.updateProject(project.id, {
                title: draftTitle.trim(),
                description: draftDescription.trim() || null,
                status: draftStatus,
                priority: draftPriority,
                due_date: draftDueDate || null,
            });
            setProject(updated);
        } catch (saveError) {
            console.error('Failed to save project:', saveError);
        } finally {
            setIsSavingProject(false);
        }
    };

    const handleUpdateTaskInList = (updatedTask: TaskResponse) => {
        setTasks((current) => current.map((task) => task.id === updatedTask.id ? updatedTask : task));
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="space-y-4">
                <div className="max-w-xl border border-red-500/25 bg-red-500/5 px-4 py-4 text-sm text-red-700 dark:text-red-200">
                    {error || 'Project not found.'}
                </div>
                <Button asChild>
                    <Link href="/projects">Back to projects</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="page-shell">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                    <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                        <ArrowLeft className="h-4 w-4" /> Back to projects
                    </Link>
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <FolderKanban className="h-4 w-4" />
                        Project
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">{project.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatProjectStatus(project.status)}</span>
                        <span>{tasks.length} tasks</span>
                        <span>{completedTasks} completed</span>
                    </div>
                </div>
                <form onSubmit={handleAddTask} className="flex w-full max-w-xl flex-col gap-2.5 sm:flex-row">
                    <Input
                        value={newTaskTitle}
                        onChange={(event) => setNewTaskTitle(event.target.value)}
                        placeholder="Add a task title"
                        className="h-10"
                    />
                    <Button type="submit" disabled={!newTaskTitle.trim() || isAddingTask} className="h-10 px-4 sm:w-auto">
                        {isAddingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4 w-4" />}
                        Add task
                    </Button>
                </form>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <section className="panel p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ListTodo className="h-4 w-4 text-primary" />
                        Open tasks
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{openTasks}</p>
                </section>
                <section className="panel p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CircleCheckBig className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                        Completed
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{completedTasks}</p>
                </section>
                <section className="panel p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        Due date
                    </div>
                    <p className="mt-3 text-xl font-semibold tracking-tight text-foreground">
                        {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'Not set'}
                    </p>
                </section>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
                <section className="panel overflow-hidden">
                    <div className="flex flex-col gap-4 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative w-full sm:w-80">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" />
                                <Input
                                    ref={searchRef}
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search tasks in this project"
                                    className="h-10 pl-9"
                                />
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {(['all', 'open', 'done'] as const).map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setStatusFilter(value)}
                                        className={cn(
                                            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                                            statusFilter === value
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border text-foreground/70 hover:bg-secondary'
                                        )}
                                    >
                                        {value === 'all' ? 'All' : value === 'open' ? 'Open' : 'Done'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Shortcuts: `/` search, `X` toggle, `E` details</p>
                    </div>

                    <div className="hidden grid-cols-[minmax(0,1.5fr)_110px_90px_76px] gap-3 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
                        <span>Task</span>
                        <span>Status</span>
                        <span>Priority</span>
                        <span></span>
                    </div>

                    <div>
                        {filteredTasks.length === 0 ? (
                            <div className="px-5 py-12 text-sm text-muted-foreground">
                                No tasks found.
                            </div>
                        ) : (
                            filteredTasks.map((task) => {
                                const isActive = selectedTaskId === task.id;
                                return (
                                    <div key={task.id}>
                                        <div
                                            className={cn(
                                                'hidden cursor-pointer grid-cols-[minmax(0,1.5fr)_110px_90px_76px] gap-3 border-b border-border px-5 py-4 transition-colors hover:bg-secondary/60 md:grid',
                                                isActive && 'bg-primary/5',
                                                task.is_completed && 'text-foreground/55'
                                            )}
                                            onClick={() => setSelectedTaskId(task.id)}
                                        >
                                            <div className="min-w-0">
                                                <p className={cn('truncate text-sm font-medium text-foreground', task.is_completed && 'line-through text-foreground/45')}>
                                                    {task.title}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-foreground/55">
                                                    {task.description || 'No description'}
                                                </p>
                                            </div>
                                            <div className="text-sm text-foreground/75">{task.is_completed ? 'Done' : 'Open'}</div>
                                            <div className="text-sm text-foreground/75">{getPriorityLabel(task.priority)}</div>
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        void handleToggleTask(task.id, task.is_completed);
                                                    }}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/50 transition-colors hover:bg-secondary hover:text-foreground"
                                                    aria-label={`Toggle ${task.title}`}
                                                >
                                                    <CircleCheckBig className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        void handleDeleteTask(task.id);
                                                    }}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/50 transition-colors hover:bg-secondary hover:text-red-600"
                                                    aria-label={`Delete ${task.title}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className={cn(
                                                'block w-full border-b border-border px-5 py-4 text-left transition-colors hover:bg-secondary/60 md:hidden',
                                                isActive && 'bg-primary/5',
                                                task.is_completed && 'text-foreground/55'
                                            )}
                                            onClick={() => setSelectedTaskId(task.id)}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className={cn('text-sm font-medium text-foreground', task.is_completed && 'line-through text-foreground/45')}>
                                                        {task.title}
                                                    </p>
                                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                        {task.description || 'No description'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            void handleToggleTask(task.id, task.is_completed);
                                                        }}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/50 transition-colors hover:bg-secondary hover:text-foreground"
                                                        aria-label={`Toggle ${task.title}`}
                                                    >
                                                        <CircleCheckBig className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            void handleDeleteTask(task.id);
                                                        }}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/50 transition-colors hover:bg-secondary hover:text-red-600"
                                                        aria-label={`Delete ${task.title}`}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground/80">
                                                    {task.is_completed ? 'Done' : 'Open'}
                                                </span>
                                                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground/80">
                                                    {getPriorityLabel(task.priority)}
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
                    {selectedTask ? (
                        <section className="panel p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <ListTodo className="h-4 w-4 text-primary" />
                                        Selected task
                                    </p>
                                    <h2 className="mt-1 text-base font-semibold text-foreground">{selectedTask.title}</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsTaskModalOpen(true)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground/55 transition-colors hover:bg-secondary hover:text-foreground"
                                    aria-label="Open full task detail"
                                >
                                    <PanelRightOpen className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mt-5 grid gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground">Task title</label>
                                    <Input value={selectedTask.title} readOnly className="h-10 bg-secondary" />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground">Project</label>
                                    <div className="h-10 rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground/75">{project.title}</div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                                    <div className="rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground/70">
                                        {selectedTask.description || 'No description'}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-2">
                                <Button onClick={() => void handleToggleTask(selectedTask.id, selectedTask.is_completed)} variant="outline" className="h-10 px-4">
                                    <CircleCheckBig className="h-4 w-4" />
                                    {selectedTask.is_completed ? 'Reopen task' : 'Mark done'}
                                </Button>
                                <Button onClick={() => setIsTaskModalOpen(true)} className="h-10 px-4">
                                    <PanelRightOpen className="h-4 w-4" />
                                    Open details
                                </Button>
                            </div>
                        </section>
                    ) : (
                        <section className="panel p-6 text-sm text-muted-foreground">
                            Select a task to view its details.
                        </section>
                    )}

                    <section className="panel p-5">
                        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <FolderKanban className="h-4 w-4 text-primary" />
                            Project details
                        </p>
                        <div className="mt-5 grid gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                                <Input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} className="h-10" />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">Status</label>
                                <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as ProjectResponse['status'])} className="h-10 w-full rounded-lg border border-input bg-input px-3 text-sm shadow-sm">
                                    <option value="todo">To do</option>
                                    <option value="in_progress">In progress</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground">Due date</label>
                                    <Input type="date" value={draftDueDate} onChange={(event) => setDraftDueDate(event.target.value)} className="h-10" />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground">Priority</label>
                                    <select value={draftPriority} onChange={(event) => setDraftPriority(Number(event.target.value))} className="h-10 w-full rounded-lg border border-input bg-input px-3 text-sm shadow-sm">
                                        <option value={1}>Low</option>
                                        <option value={2}>Medium</option>
                                        <option value={3}>High</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                                <textarea
                                    value={draftDescription}
                                    onChange={(event) => setDraftDescription(event.target.value)}
                                    rows={5}
                                    className="w-full rounded-lg border border-input bg-input px-3 py-2 text-sm shadow-sm"
                                    placeholder="Add the project summary."
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            <Button onClick={handleSaveProject} disabled={!projectIsDirty || isSavingProject} className="h-10 px-4">
                                {isSavingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save project'}
                            </Button>
                            <Button asChild variant="outline" className="h-10 px-4">
                                <Link href="/projects">Back to list</Link>
                            </Button>
                        </div>
                    </section>
                </aside>
            </div>

            <TaskDetailModal
                task={selectedTask}
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onUpdate={handleUpdateTaskInList}
                onDelete={handleDeleteTask}
            />
        </div>
    );
}
