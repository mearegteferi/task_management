'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ArchitectModal } from '@/components/architect/ArchitectModal';
import { ProjectModal } from '@/components/modals/ProjectModal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ProjectMutationInput, projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { ProjectResponse, TaskResponse } from '@/types/api';
import {
    Bot,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    FolderKanban,
    FolderPlus,
    Loader2,
    ListTodo,
    Search,
    SquarePen,
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

function formatShortDate(value: string | null) {
    if (!value) {
        return 'No due date';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
    }).format(new Date(value));
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

function getPriorityTone(priority: number) {
    if (priority === 3) {
        return 'text-red-600 dark:text-red-300';
    }
    if (priority === 2) {
        return 'text-amber-600 dark:text-amber-200';
    }
    return 'text-foreground/65';
}

function isTypingTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return (
        target.tagName === 'INPUT'
        || target.tagName === 'TEXTAREA'
        || target.isContentEditable
    );
}

export default function ProjectListPage() {
    const router = useRouter();
    const searchRef = useRef<HTMLInputElement | null>(null);
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isArchitectOpen, setIsArchitectOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ProjectResponse | null>(null);
    const [selectedProjectTasks, setSelectedProjectTasks] = useState<TaskResponse[]>([]);
    const [isProjectTaskLoading, setIsProjectTaskLoading] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectResponse | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | ProjectResponse['status']>('all');
    const [draftTitle, setDraftTitle] = useState('');
    const [draftDescription, setDraftDescription] = useState('');
    const [draftStatus, setDraftStatus] = useState<ProjectResponse['status']>('todo');
    const [draftPriority, setDraftPriority] = useState(2);
    const [draftDueDate, setDraftDueDate] = useState('');
    const [isSavingQuickEdit, setIsSavingQuickEdit] = useState(false);
    const [isBulkWorking, setIsBulkWorking] = useState(false);

    const fetchProjects = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await projectService.getProjects();
            setProjects(data);
            if (!selectedProject || !data.some((project) => project.id === selectedProject.id)) {
                setSelectedProject(data[0] ?? null);
            }
        } catch (fetchError) {
            console.error('Failed to fetch projects:', fetchError);
            setError('Projects did not load. Refresh the page or try again in a moment.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedProject]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        if (!selectedProject) {
            setSelectedProjectTasks([]);
            setDraftTitle('');
            setDraftDescription('');
            setDraftStatus('todo');
            setDraftPriority(2);
            setDraftDueDate('');
            return;
        }

        setDraftTitle(selectedProject.title);
        setDraftDescription(selectedProject.description || '');
        setDraftStatus(selectedProject.status);
        setDraftPriority(selectedProject.priority);
        setDraftDueDate(selectedProject.due_date ? selectedProject.due_date.split('T')[0] : '');

        const fetchProjectTasks = async () => {
            setIsProjectTaskLoading(true);
            try {
                const data = await taskService.getTasks(selectedProject.id);
                setSelectedProjectTasks(data);
            } catch (fetchError) {
                console.error('Failed to fetch project tasks:', fetchError);
                setSelectedProjectTasks([]);
            } finally {
                setIsProjectTaskLoading(false);
            }
        };

        void fetchProjectTasks();
    }, [selectedProject]);

    const filteredProjects = useMemo(() => {
        return [...projects]
            .filter((project) => {
                const lowered = searchQuery.toLowerCase();
                const matchesSearch = project.title.toLowerCase().includes(lowered)
                    || project.description?.toLowerCase().includes(lowered);
                const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
                return matchesSearch && matchesStatus;
            })
            .sort((left, right) => {
                if (left.status !== right.status) {
                    const order = { in_progress: 0, todo: 1, done: 2 } as const;
                    return order[left.status] - order[right.status];
                }
                if (left.due_date && right.due_date) {
                    return new Date(left.due_date).getTime() - new Date(right.due_date).getTime();
                }
                if (left.due_date) {
                    return -1;
                }
                if (right.due_date) {
                    return 1;
                }
                return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
            });
    }, [projects, searchQuery, statusFilter]);

    useEffect(() => {
        if (!filteredProjects.length) {
            if (selectedProject && !projects.some((project) => project.id === selectedProject.id)) {
                setSelectedProject(null);
            }
            return;
        }

        if (!selectedProject || !filteredProjects.some((project) => project.id === selectedProject.id)) {
            setSelectedProject(filteredProjects[0]);
        }
    }, [filteredProjects, projects, selectedProject]);

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
                setEditingProject(null);
                setIsModalOpen(true);
                return;
            }

            if (event.shiftKey && event.key.toLowerCase() === 'a') {
                event.preventDefault();
                setIsArchitectOpen(true);
                return;
            }

            if (!filteredProjects.length) {
                return;
            }

            const currentIndex = filteredProjects.findIndex((project) => project.id === selectedProject?.id);

            if (event.key.toLowerCase() === 'j') {
                event.preventDefault();
                const nextIndex = currentIndex < filteredProjects.length - 1 ? currentIndex + 1 : 0;
                setSelectedProject(filteredProjects[nextIndex]);
            }

            if (event.key.toLowerCase() === 'k') {
                event.preventDefault();
                const nextIndex = currentIndex > 0 ? currentIndex - 1 : filteredProjects.length - 1;
                setSelectedProject(filteredProjects[nextIndex]);
            }

            if (event.key === 'Enter' && selectedProject) {
                event.preventDefault();
                void router.push(`/projects/${selectedProject.id}`);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredProjects, router, selectedProject]);

    const selectedTaskCount = selectedProjectTasks.length;
    const completedTaskCount = selectedProjectTasks.filter((task) => task.is_completed).length;
    const inProgressCount = projects.filter((project) => project.status === 'in_progress').length;
    const doneCount = projects.filter((project) => project.status === 'done').length;
    const selectionIsDirty = !!selectedProject
        && (
            draftTitle !== selectedProject.title
            || draftDescription !== (selectedProject.description || '')
            || draftStatus !== selectedProject.status
            || draftPriority !== selectedProject.priority
            || draftDueDate !== (selectedProject.due_date ? selectedProject.due_date.split('T')[0] : '')
        );

    const handleOpenCreateModal = () => {
        setEditingProject(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (project: ProjectResponse) => {
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const handleDeleteProject = async (projectId: number) => {
        if (!confirm('Delete this project? Open tasks under it will be removed too.')) {
            return;
        }

        try {
            await projectService.deleteProject(projectId);
            const remainingProjects = projects.filter((project) => project.id !== projectId);
            setProjects(remainingProjects);
            setSelectedIds((current) => current.filter((id) => id !== projectId));
            if (selectedProject?.id === projectId) {
                setSelectedProject(remainingProjects[0] ?? null);
            }
        } catch (deleteError) {
            console.error('Failed to delete project:', deleteError);
        }
    };

    const handleSaveProject = async (data: ProjectMutationInput) => {
        if (editingProject) {
            const updated = await projectService.updateProject(editingProject.id, data);
            setProjects((current) => current.map((project) => project.id === editingProject.id ? updated : project));
            if (selectedProject?.id === updated.id) {
                setSelectedProject(updated);
            }
            return;
        }

        const created = await projectService.createProject(data);
        setProjects((current) => [created, ...current]);
        setSelectedProject(created);
    };
    const handleQuickSave = async () => {
        if (!selectedProject || !selectionIsDirty) {
            return;
        }

        setIsSavingQuickEdit(true);
        try {
            const updated = await projectService.updateProject(selectedProject.id, {
                title: draftTitle.trim(),
                description: draftDescription.trim() || null,
                status: draftStatus,
                priority: draftPriority,
                due_date: draftDueDate || null,
            });
            setProjects((current) => current.map((project) => project.id === updated.id ? updated : project));
            setSelectedProject(updated);
        } catch (saveError) {
            console.error('Failed to update project:', saveError);
        } finally {
            setIsSavingQuickEdit(false);
        }
    };

    const toggleSelectedId = (projectId: number) => {
        setSelectedIds((current) =>
            current.includes(projectId)
                ? current.filter((id) => id !== projectId)
                : [...current, projectId]
        );
    };

    const toggleSelectAllVisible = () => {
        const visibleIds = filteredProjects.map((project) => project.id);
        const allVisibleSelected = visibleIds.every((id) => selectedIds.includes(id));
        if (allVisibleSelected) {
            setSelectedIds((current) => current.filter((id) => !visibleIds.includes(id)));
            return;
        }
        setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])));
    };

    const handleBulkStatusChange = async (status: ProjectResponse['status']) => {
        if (!selectedIds.length) {
            return;
        }

        setIsBulkWorking(true);
        try {
            const updatedProjects = await Promise.all(
                selectedIds.map((id) => projectService.updateProject(id, { status }))
            );
            const updatedMap = new Map(updatedProjects.map((project) => [project.id, project]));
            setProjects((current) => current.map((project) => updatedMap.get(project.id) ?? project));
            if (selectedProject && updatedMap.has(selectedProject.id)) {
                setSelectedProject(updatedMap.get(selectedProject.id) ?? selectedProject);
            }
        } catch (bulkError) {
            console.error('Failed to update selected projects:', bulkError);
        } finally {
            setIsBulkWorking(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length || !confirm(`Delete ${selectedIds.length} selected project(s)?`)) {
            return;
        }

        setIsBulkWorking(true);
        try {
            await Promise.all(selectedIds.map((id) => projectService.deleteProject(id)));
            const remainingProjects = projects.filter((project) => !selectedIds.includes(project.id));
            setProjects(remainingProjects);
            setSelectedIds([]);
            if (selectedProject && selectedIds.includes(selectedProject.id)) {
                setSelectedProject(remainingProjects[0] ?? null);
            }
        } catch (bulkError) {
            console.error('Failed to delete selected projects:', bulkError);
        } finally {
            setIsBulkWorking(false);
        }
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
                <div className="max-w-xl border border-red-500/25 bg-red-500/5 px-4 py-4 text-sm text-red-700 dark:text-red-200">
                    {error}
                </div>
                <Button onClick={fetchProjects}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="page-shell">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <FolderKanban className="h-4 w-4" />
                        Projects
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                        Projects
                    </h1>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        Create projects, update their status, and review their tasks.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <Button onClick={() => setIsArchitectOpen(true)} variant="outline" className="h-10 px-4">
                        <Bot className="h-4 w-4" />
                        AI architect
                    </Button>
                    <Button onClick={handleOpenCreateModal} className="h-10 px-4">
                        <FolderPlus className="h-4 w-4" />
                        New project
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <section className="panel p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FolderKanban className="h-4 w-4 text-primary" />
                        Total projects
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{projects.length}</p>
                </section>
                <section className="panel p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ListTodo className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                        In progress
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{inProgressCount}</p>
                </section>
                <section className="panel p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                        Done
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{doneCount}</p>
                </section>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
                <section className="panel overflow-hidden">
                    <div className="flex flex-col gap-4 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative w-full sm:w-80">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" />
                                <Input
                                    ref={searchRef}
                                    placeholder="Search projects"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    className="h-10 pl-9"
                                />
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {(['all', 'in_progress', 'todo', 'done'] as const).map((value) => (
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
                                        {value === 'all' ? 'All' : formatProjectStatus(value)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Search className="h-4 w-4" />
                            {filteredProjects.length} result{filteredProjects.length === 1 ? '' : 's'}
                        </div>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/45 px-5 py-3 text-sm">
                            <span className="font-medium text-foreground">{selectedIds.length} selected</span>
                            <Button size="sm" variant="outline" disabled={isBulkWorking} className="rounded-md" onClick={() => handleBulkStatusChange('in_progress')}>
                                Set in progress
                            </Button>
                            <Button size="sm" variant="outline" disabled={isBulkWorking} className="rounded-md" onClick={() => handleBulkStatusChange('done')}>
                                Set done
                            </Button>
                            <Button size="sm" variant="ghost" disabled={isBulkWorking} className="rounded-md text-red-600 hover:text-red-600" onClick={handleBulkDelete}>
                                Delete
                            </Button>
                        </div>
                    )}
                    <div className="hidden grid-cols-[42px_minmax(0,1.55fr)_130px_110px_92px_74px] gap-3 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
                        <div className="flex items-center justify-center">
                            <Checkbox
                                checked={filteredProjects.length > 0 && filteredProjects.every((project) => selectedIds.includes(project.id))}
                                onCheckedChange={toggleSelectAllVisible}
                                aria-label="Select visible projects"
                            />
                        </div>
                        <span>Project</span>
                        <span>Status</span>
                        <span>Due</span>
                        <span>Priority</span>
                        <span></span>
                    </div>

                    <div>
                        {filteredProjects.length === 0 ? (
                            <div className="px-5 py-12 text-sm text-muted-foreground">
                                No projects found.
                            </div>
                        ) : (
                            filteredProjects.map((project) => {
                                const isActive = selectedProject?.id === project.id;
                                const isChecked = selectedIds.includes(project.id);
                                return (
                                    <div key={project.id}>
                                        <div
                                            className={cn(
                                                'hidden cursor-pointer grid-cols-[42px_minmax(0,1.55fr)_130px_110px_92px_74px] gap-3 border-b border-border px-5 py-4 transition-colors hover:bg-secondary/60 md:grid',
                                                isActive && 'bg-primary/5'
                                            )}
                                            onClick={() => setSelectedProject(project)}
                                        >
                                            <div className="flex items-start justify-center pt-0.5" onClick={(event) => event.stopPropagation()}>
                                                <Checkbox
                                                    checked={isChecked}
                                                    onCheckedChange={() => toggleSelectedId(project.id)}
                                                    aria-label={`Select ${project.title}`}
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-foreground">
                                                    {project.title}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-foreground/55">
                                                    {project.description || 'No description'}
                                                </p>
                                            </div>

                                            <div className="text-sm text-foreground/75">{formatProjectStatus(project.status)}</div>
                                            <div className="text-sm text-foreground/75">{formatShortDate(project.due_date)}</div>
                                            <div className={cn('text-sm font-medium', getPriorityTone(project.priority))}>
                                                {getPriorityLabel(project.priority)}
                                            </div>
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleOpenEditModal(project);
                                                    }}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/50 transition-colors hover:bg-secondary hover:text-foreground"
                                                    aria-label={`Edit ${project.title}`}
                                                >
                                                    <SquarePen className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        void handleDeleteProject(project.id);
                                                    }}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/50 transition-colors hover:bg-secondary hover:text-red-600"
                                                    aria-label={`Delete ${project.title}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className={cn(
                                                'block w-full border-b border-border px-5 py-4 text-left transition-colors hover:bg-secondary/60 md:hidden',
                                                isActive && 'bg-primary/5'
                                            )}
                                            onClick={() => setSelectedProject(project)}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex min-w-0 items-start gap-3">
                                                    <div onClick={(event) => event.stopPropagation()} className="pt-0.5">
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onCheckedChange={() => toggleSelectedId(project.id)}
                                                            aria-label={`Select ${project.title}`}
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-foreground">{project.title}</p>
                                                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                            {project.description || 'No description'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleOpenEditModal(project);
                                                        }}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/50 transition-colors hover:bg-secondary hover:text-foreground"
                                                        aria-label={`Edit ${project.title}`}
                                                    >
                                                        <SquarePen className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            void handleDeleteProject(project.id);
                                                        }}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/50 transition-colors hover:bg-secondary hover:text-red-600"
                                                        aria-label={`Delete ${project.title}`}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground/80">
                                                    {formatProjectStatus(project.status)}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground/80">
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    {formatShortDate(project.due_date)}
                                                </span>
                                                <span className={cn('rounded-full bg-secondary px-2.5 py-1 text-xs', getPriorityTone(project.priority))}>
                                                    {getPriorityLabel(project.priority)}
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
                    {selectedProject ? (
                        <>
                            <section className="panel p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                            <FolderKanban className="h-4 w-4 text-primary" />
                                            Project details
                                        </p>
                                        <h2 className="mt-1 text-base font-semibold text-foreground">
                                            {selectedProject.title}
                                        </h2>
                                    </div>
                                    <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                                        ID {selectedProject.id}
                                    </span>
                                </div>

                                <div className="mt-5 grid gap-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-foreground">
                                            Title
                                        </label>
                                        <Input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} className="h-10" />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-foreground">
                                            Status
                                        </label>
                                        <select
                                            value={draftStatus}
                                            onChange={(event) => setDraftStatus(event.target.value as ProjectResponse['status'])}
                                            className="h-10 w-full rounded-lg border border-input bg-input px-3 text-sm shadow-sm"
                                        >
                                            <option value="todo">To do</option>
                                            <option value="in_progress">In progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-foreground">
                                                Due date
                                            </label>
                                            <Input type="date" value={draftDueDate} onChange={(event) => setDraftDueDate(event.target.value)} className="h-10" />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-foreground">
                                                Priority
                                            </label>
                                            <select
                                                value={draftPriority}
                                                onChange={(event) => setDraftPriority(Number(event.target.value))}
                                                className="h-10 w-full rounded-lg border border-input bg-input px-3 text-sm shadow-sm"
                                            >
                                                <option value={1}>Low</option>
                                                <option value={2}>Medium</option>
                                                <option value={3}>High</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-foreground">
                                            Description
                                        </label>
                                        <textarea
                                            value={draftDescription}
                                            onChange={(event) => setDraftDescription(event.target.value)}
                                            rows={4}
                                            className="w-full rounded-lg border border-input bg-input px-3 py-2 text-sm shadow-sm"
                                            placeholder="Add the project summary."
                                        />
                                    </div>
                                </div>
                                <div className="mt-5 flex flex-wrap items-center gap-2">
                                    <Button onClick={handleQuickSave} disabled={!selectionIsDirty || isSavingQuickEdit} className="h-10 px-4">
                                        {isSavingQuickEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save project'}
                                    </Button>
                                    <Button asChild variant="outline" className="h-10 px-4">
                                        <Link href={`/projects/${selectedProject.id}`}>
                                            <FolderKanban className="h-4 w-4" />
                                            Open project
                                        </Link>
                                    </Button>
                                </div>
                            </section>

                            <section className="panel p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                            <ListTodo className="h-4 w-4 text-primary" />
                                            Tasks
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {completedTaskCount} of {selectedTaskCount} completed
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-semibold tracking-tight text-foreground">
                                            {selectedTaskCount}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2.5">
                                    {isProjectTaskLoading ? (
                                        <div className="flex items-center gap-2 text-sm text-foreground/55">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading tasks
                                        </div>
                                    ) : selectedProjectTasks.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No tasks in this project yet.
                                        </p>
                                    ) : (
                                        selectedProjectTasks.slice(0, 4).map((task) => (
                                            <Link
                                                key={task.id}
                                                href={`/projects/${selectedProject.id}`}
                                                className="flex items-start justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-secondary"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-foreground">
                                                        {task.title}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-foreground/50">
                                                        {task.is_completed ? 'Done' : 'Open'}
                                                        {' · '}
                                                        {getPriorityLabel(task.priority)}
                                                    </p>
                                                </div>
                                                {task.is_completed ? (
                                                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                                                ) : (
                                                    <ChevronRight className="mt-0.5 h-4 w-4 text-foreground/25" />
                                                )}
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </section>
                        </>
                    ) : (
                        <section className="panel p-6 text-sm text-muted-foreground">
                            Select a project to view and edit its details.
                        </section>
                    )}
                </aside>
            </div>

            <ProjectModal
                project={editingProject}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProject}
            />
            <ArchitectModal
                isOpen={isArchitectOpen}
                onClose={() => setIsArchitectOpen(false)}
            />
        </div>
    );
}
