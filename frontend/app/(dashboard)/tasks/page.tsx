'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TaskDetailModal } from '@/components/modals/TaskDetailModal';
import { TaskModal } from '@/components/modals/TaskModal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { ProjectResponse, TaskResponse } from '@/types/api';
import {
    CheckCheck,
    CircleCheckBig,
    FolderKanban,
    Funnel,
    ListPlus,
    ListTodo,
    Loader2,
    PanelRightOpen,
    Search,
    TriangleAlert,
    Trash2,
} from 'lucide-react';

type ExtendedTask = TaskResponse & {
    projectTitle: string;
    projectDueDate: string | null;
};

function getPriorityLabel(priority: number) {
    if (priority === 3) {
        return 'High';
    }
    if (priority === 2) {
        return 'Medium';
    }
    return 'Low';
}

function formatStatus(task: ExtendedTask) {
    return task.is_completed ? 'Done' : task.status === 'in_progress' ? 'In progress' : 'To do';
}

function isTypingTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

export default function TasksPage() {
    const searchRef = useRef<HTMLInputElement | null>(null);
    const [tasks, setTasks] = useState<ExtendedTask[]>([]);
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'done'>('all');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [draftTitle, setDraftTitle] = useState('');
    const [draftDescription, setDraftDescription] = useState('');
    const [draftPriority, setDraftPriority] = useState(2);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isBulkWorking, setIsBulkWorking] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const projectData = await projectService.getProjects();
            const taskResults = await Promise.all(
                projectData.map(async (project) => {
                    const projectTasks = await taskService.getTasks(project.id);
                    return projectTasks.map((task) => ({
                        ...task,
                        projectTitle: project.title,
                        projectDueDate: project.due_date,
                    }));
                })
            );

            const flatTasks = taskResults.flat();
            setProjects(projectData);
            setTasks(flatTasks);
            setSelectedTaskId((current) => current ?? flatTasks[0]?.id ?? null);
        } catch (fetchError) {
            console.error('Failed to fetch tasks:', fetchError);
            setError('Tasks could not be loaded right now.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredTasks = useMemo(() => {
        return [...tasks]
            .filter((task) => {
                const lowered = searchQuery.toLowerCase();
                const matchesSearch = task.title.toLowerCase().includes(lowered)
                    || task.projectTitle.toLowerCase().includes(lowered)
                    || task.description?.toLowerCase().includes(lowered);
                const matchesStatus = statusFilter === 'all'
                    || (statusFilter === 'done' && task.is_completed)
                    || (statusFilter === 'open' && !task.is_completed);
                return matchesSearch && matchesStatus;
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
            if (selectedTaskId !== null && !tasks.some((task) => task.id === selectedTaskId)) {
                setSelectedTaskId(null);
            }
            return;
        }

        if (!selectedTaskId || !tasks.some((task) => task.id === selectedTaskId)) {
            setSelectedTaskId(filteredTasks[0].id);
        }
    }, [filteredTasks, selectedTaskId, tasks]);

    useEffect(() => {
        if (!selectedTask) {
            setDraftTitle('');
            setDraftDescription('');
            setDraftPriority(2);
            return;
        }

        setDraftTitle(selectedTask.title);
        setDraftDescription(selectedTask.description || '');
        setDraftPriority(selectedTask.priority);
    }, [selectedTask]);

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

            if (event.key.toLowerCase() === 'n') {
                event.preventDefault();
                setIsCreateModalOpen(true);
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

            if (event.key === 'Enter' && selectedTask) {
                event.preventDefault();
                setIsDetailModalOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredTasks, selectedTask, selectedTaskId]);

    const draftIsDirty = !!selectedTask && (
        draftTitle !== selectedTask.title
        || draftDescription !== (selectedTask.description || '')
        || draftPriority !== selectedTask.priority
    );
    const openTaskCount = tasks.filter((task) => !task.is_completed).length;
    const doneTaskCount = tasks.filter((task) => task.is_completed).length;
    const highPriorityCount = tasks.filter((task) => task.priority === 3 && !task.is_completed).length;

    const handleToggleTask = async (taskId: number, isCompleted: boolean) => {
        try {
            const updatedTask = await taskService.updateTask(taskId, { is_completed: !isCompleted });
            setTasks((current) => current.map((task) => task.id === taskId ? { ...task, ...updatedTask } : task));
        } catch (updateError) {
            console.error('Failed to update task:', updateError);
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        try {
            await taskService.deleteTask(taskId);
            const remaining = tasks.filter((task) => task.id !== taskId);
            setTasks(remaining);
            setSelectedIds((current) => current.filter((id) => id !== taskId));
            if (selectedTaskId === taskId) {
                setSelectedTaskId(remaining[0]?.id ?? null);
            }
        } catch (deleteError) {
            console.error('Failed to delete task:', deleteError);
        }
    };

    const handleSaveNewTask = async (projectId: number, data: { title: string }) => {
        const project = projects.find((item) => item.id === projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const created = await taskService.createTask(projectId, data);
        const extendedTask: ExtendedTask = {
            ...created,
            projectTitle: project.title,
            projectDueDate: project.due_date,
        };
        setTasks((current) => [extendedTask, ...current]);
        setSelectedTaskId(created.id);
    };

    const handleSaveDraft = async () => {
        if (!selectedTask || !draftIsDirty) {
            return;
        }

        setIsSavingDraft(true);
        try {
            const updated = await taskService.updateTask(selectedTask.id, {
                title: draftTitle.trim(),
                description: draftDescription.trim() || null,
                priority: draftPriority,
            });
            setTasks((current) => current.map((task) => task.id === updated.id ? { ...task, ...updated } : task));
        } catch (saveError) {
            console.error('Failed to save task:', saveError);
        } finally {
            setIsSavingDraft(false);
        }
    };

    const toggleSelectedId = (taskId: number) => {
        setSelectedIds((current) =>
            current.includes(taskId)
                ? current.filter((id) => id !== taskId)
                : [...current, taskId]
        );
    };

    const toggleSelectAllVisible = () => {
        const visibleIds = filteredTasks.map((task) => task.id);
        const allVisibleSelected = visibleIds.every((id) => selectedIds.includes(id));
        if (allVisibleSelected) {
            setSelectedIds((current) => current.filter((id) => !visibleIds.includes(id)));
            return;
        }
        setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])));
    };

    const handleBulkComplete = async (completed: boolean) => {
        if (!selectedIds.length) {
            return;
        }

        setIsBulkWorking(true);
        try {
            const updatedTasks = await Promise.all(
                selectedIds.map((id) => taskService.updateTask(id, { is_completed: completed }))
            );
            const updatedMap = new Map(updatedTasks.map((task) => [task.id, task]));
            setTasks((current) => current.map((task) => updatedMap.has(task.id) ? { ...task, ...updatedMap.get(task.id)! } : task));
        } catch (bulkError) {
            console.error('Failed to update selected tasks:', bulkError);
        } finally {
            setIsBulkWorking(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length || !confirm(`Delete ${selectedIds.length} selected task(s)?`)) {
            return;
        }

        setIsBulkWorking(true);
        try {
            await Promise.all(selectedIds.map((id) => taskService.deleteTask(id)));
            const remaining = tasks.filter((task) => !selectedIds.includes(task.id));
            setTasks(remaining);
            setSelectedIds([]);
            if (selectedTaskId && selectedIds.includes(selectedTaskId)) {
                setSelectedTaskId(remaining[0]?.id ?? null);
            }
        } catch (bulkError) {
            console.error('Failed to delete selected tasks:', bulkError);
        } finally {
            setIsBulkWorking(false);
        }
    };

    const handleUpdateTaskInList = (updatedTask: TaskResponse) => {
        setTasks((current) => current.map((task) => task.id === updatedTask.id ? { ...task, ...updatedTask } : task));
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <div className="max-w-xl border border-red-500/25 bg-red-500/5 px-4 py-4 text-sm text-red-700 dark:text-red-200">{error}</div>
                <Button onClick={fetchData}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="page-shell">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <ListTodo className="h-4 w-4" />
                        Tasks
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Tasks</h1>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        Review tasks, update details, and manage bulk actions.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <Button onClick={() => setIsCreateModalOpen(true)} className="h-10 px-4">
                        <ListPlus className="h-4 w-4" />
                        New task
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <section className="panel p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ListTodo className="h-4 w-4 text-primary" />
                        Open tasks
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{openTaskCount}</p>
                </section>
                <section className="panel p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                        Done
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{doneTaskCount}</p>
                </section>
                <section className="panel p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TriangleAlert className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                        High priority
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{highPriorityCount}</p>
                </section>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.48fr)_minmax(320px,0.92fr)]">
                <section className="panel overflow-hidden">
                    <div className="flex flex-col gap-4 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative w-full sm:w-80">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" />
                                <Input
                                    ref={searchRef}
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search tasks"
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
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Funnel className="h-4 w-4" />
                            {filteredTasks.length} result{filteredTasks.length === 1 ? '' : 's'}
                        </div>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/45 px-5 py-3 text-sm">
                            <span className="font-medium text-foreground">{selectedIds.length} selected</span>
                            <Button size="sm" variant="outline" disabled={isBulkWorking} className="rounded-md" onClick={() => handleBulkComplete(true)}>
                                Set done
                            </Button>
                            <Button size="sm" variant="outline" disabled={isBulkWorking} className="rounded-md" onClick={() => handleBulkComplete(false)}>
                                Reopen
                            </Button>
                            <Button size="sm" variant="ghost" disabled={isBulkWorking} className="rounded-md text-red-600 hover:text-red-600" onClick={handleBulkDelete}>
                                Delete
                            </Button>
                        </div>
                    )}

                    <div className="hidden grid-cols-[42px_minmax(0,1.5fr)_150px_110px_90px_76px] gap-3 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
                        <div className="flex items-center justify-center">
                            <Checkbox
                                checked={filteredTasks.length > 0 && filteredTasks.every((task) => selectedIds.includes(task.id))}
                                onCheckedChange={toggleSelectAllVisible}
                                aria-label="Select visible tasks"
                            />
                        </div>
                        <span>Task</span>
                        <span>Project</span>
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
                                const isChecked = selectedIds.includes(task.id);
                                return (
                                    <div key={task.id}>
                                        <div
                                            className={cn(
                                                'hidden cursor-pointer grid-cols-[42px_minmax(0,1.5fr)_150px_110px_90px_76px] gap-3 border-b border-border px-5 py-4 transition-colors hover:bg-secondary/60 md:grid',
                                                isActive && 'bg-primary/5',
                                                task.is_completed && 'text-foreground/55'
                                            )}
                                            onClick={() => setSelectedTaskId(task.id)}
                                        >
                                            <div className="flex items-start justify-center pt-0.5" onClick={(event) => event.stopPropagation()}>
                                                <Checkbox
                                                    checked={isChecked}
                                                    onCheckedChange={() => toggleSelectedId(task.id)}
                                                    aria-label={`Select ${task.title}`}
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <p className={cn('truncate text-sm font-medium text-foreground', task.is_completed && 'line-through text-foreground/45')}>
                                                    {task.title}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-foreground/55">
                                                    {task.description || 'No description'}
                                                </p>
                                            </div>
                                            <div className="text-sm text-foreground/75">{task.projectTitle}</div>
                                            <div className="text-sm text-foreground/75">{formatStatus(task)}</div>
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
                                                <div className="flex min-w-0 items-start gap-3">
                                                    <div onClick={(event) => event.stopPropagation()} className="pt-0.5">
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onCheckedChange={() => toggleSelectedId(task.id)}
                                                            aria-label={`Select ${task.title}`}
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={cn('text-sm font-medium text-foreground', task.is_completed && 'line-through text-foreground/45')}>
                                                            {task.title}
                                                        </p>
                                                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                            {task.description || 'No description'}
                                                        </p>
                                                    </div>
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
                                                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground/80">
                                                    <FolderKanban className="h-3.5 w-3.5" />
                                                    {task.projectTitle}
                                                </span>
                                                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground/80">
                                                    {formatStatus(task)}
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
                        <>
                            <section className="panel p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                            <ListTodo className="h-4 w-4 text-primary" />
                                            Task details
                                        </p>
                                        <h2 className="mt-1 text-base font-semibold text-foreground">{selectedTask.title}</h2>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsDetailModalOpen(true)}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground/55 transition-colors hover:bg-secondary hover:text-foreground"
                                        aria-label="Open full task detail"
                                    >
                                        <PanelRightOpen className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="mt-5 grid gap-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                                        <Input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} className="h-10" />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                                        <textarea
                                            value={draftDescription}
                                            onChange={(event) => setDraftDescription(event.target.value)}
                                            rows={4}
                                            className="w-full rounded-lg border border-input bg-input px-3 py-2 text-sm shadow-sm"
                                            placeholder="Add task details."
                                        />
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-foreground">Project</label>
                                            <div className="h-10 rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground/75">{selectedTask.projectTitle}</div>
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
                                </div>

                                <div className="mt-5 flex flex-wrap items-center gap-2">
                                    <Button onClick={() => void handleToggleTask(selectedTask.id, selectedTask.is_completed)} variant="outline" className="h-10 px-4">
                                        <CircleCheckBig className="h-4 w-4" />
                                        {selectedTask.is_completed ? 'Reopen task' : 'Mark done'}
                                    </Button>
                                    <Button onClick={handleSaveDraft} disabled={!draftIsDirty || isSavingDraft} className="h-10 px-4">
                                        {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save task'}
                                    </Button>
                                </div>
                            </section>
                        </>
                    ) : (
                        <section className="panel p-6 text-sm text-muted-foreground">
                            Select a task to view and edit its details.
                        </section>
                    )}
                </aside>
            </div>

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
        </div>
    );
}
