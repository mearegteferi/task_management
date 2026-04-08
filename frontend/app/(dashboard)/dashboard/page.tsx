'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    AlertTriangle,
    ArrowRight,
    Briefcase,
    CheckCircle2,
    ChevronRight,
    CircleSlash,
    Loader2,
    Plus,
    Search,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { analyticsService } from '@/services/analytics.service';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { AnalyticsResponse, ProjectResponse, TaskResponse } from '@/types/api';

type WorkItem = TaskResponse & {
    projectTitle: string;
    projectDueDate: string | null;
    projectStatus: ProjectResponse['status'];
};

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

function getRelativeDueLabel(value: string | null) {
    if (!value) {
        return 'No due date';
    }

    const due = new Date(value);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

    if (diffDays < 0) {
        return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} overdue`;
    }
    if (diffDays === 0) {
        return 'Due today';
    }
    if (diffDays === 1) {
        return 'Due tomorrow';
    }

    return `Due in ${diffDays} days`;
}

function getPriorityLabel(priority: number) {
    switch (priority) {
        case 3:
            return 'High';
        case 2:
            return 'Medium';
        default:
            return 'Low';
    }
}

function isTypingTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    const tagName = target.tagName;
    return tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable;
}

export default function DashboardPage() {
    const router = useRouter();
    const searchRef = useRef<HTMLInputElement | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [tasks, setTasks] = useState<WorkItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');

    const fetchWorkspace = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [analyticsData, projectData] = await Promise.all([
                analyticsService.getAnalytics(),
                projectService.getProjects(),
            ]);

            const taskResults = await Promise.all(
                projectData.map(async (project) => {
                    const projectTasks = await taskService.getTasks(project.id);
                    return projectTasks.map((task) => ({
                        ...task,
                        projectTitle: project.title,
                        projectDueDate: project.due_date,
                        projectStatus: project.status,
                    }));
                })
            );

            setAnalytics(analyticsData);
            setProjects(projectData);
            setTasks(taskResults.flat());
        } catch (fetchError) {
            console.error('Failed to load dashboard:', fetchError);
            setError('The dashboard could not be loaded right now.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWorkspace();
    }, [fetchWorkspace]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isTypingTarget(event.target)) {
                return;
            }

            if (event.key === '/') {
                event.preventDefault();
                searchRef.current?.focus();
            }

            if (event.key.toLowerCase() === 'p') {
                event.preventDefault();
                void router.push('/projects');
            }

            if (event.key.toLowerCase() === 't') {
                event.preventDefault();
                void router.push('/tasks');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    const filteredTasks = useMemo(() => {
        const lowered = query.trim().toLowerCase();
        const openTasks = tasks.filter((task) => !task.is_completed);

        const sorted = [...openTasks].sort((left, right) => {
            if (right.priority !== left.priority) {
                return right.priority - left.priority;
            }

            if (left.projectDueDate && right.projectDueDate) {
                return new Date(left.projectDueDate).getTime() - new Date(right.projectDueDate).getTime();
            }

            if (left.projectDueDate) {
                return -1;
            }

            if (right.projectDueDate) {
                return 1;
            }

            return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
        });

        if (!lowered) {
            return sorted.slice(0, 8);
        }

        return sorted
            .filter((task) =>
                task.title.toLowerCase().includes(lowered)
                || task.projectTitle.toLowerCase().includes(lowered)
                || task.description?.toLowerCase().includes(lowered)
            )
            .slice(0, 8);
    }, [query, tasks]);

    const atRiskProjects = useMemo(() => {
        return [...projects]
            .filter((project) => project.status !== 'done')
            .filter((project) => {
                if (!project.due_date) {
                    return false;
                }

                const days = Math.round((new Date(project.due_date).getTime() - Date.now()) / 86400000);
                return days <= 7;
            })
            .sort((left, right) => {
                if (!left.due_date || !right.due_date) {
                    return 0;
                }
                return new Date(left.due_date).getTime() - new Date(right.due_date).getTime();
            })
            .slice(0, 5);
    }, [projects]);

    const recentProjects = useMemo(() => {
        return [...projects]
            .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
            .slice(0, 4);
    }, [projects]);

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
                <div className="max-w-xl rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4" />
                        <div>
                            <p className="font-semibold">Dashboard unavailable</p>
                            <p className="mt-1">{error}</p>
                        </div>
                    </div>
                </div>
                <Button onClick={fetchWorkspace}>Retry</Button>
            </div>
        );
    }

    const summaryCards = [
        {
            label: 'Open tasks',
            value: analytics?.total_tasks ? analytics.total_tasks - analytics.completed_tasks : 0,
            note: 'Tasks not completed',
        },
        {
            label: 'Completed',
            value: `${analytics?.task_completion_rate || 0}%`,
            note: `${analytics?.completed_tasks || 0} tasks done`,
        },
        {
            label: 'Overdue projects',
            value: analytics?.overdue_projects || 0,
            note: 'Need attention',
        },
        {
            label: 'Active projects',
            value: analytics?.active_projects || 0,
            note: 'In progress',
        },
    ];

    return (
        <div className="page-shell">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        Review open work, upcoming deadlines, and recent projects.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <Button asChild variant="outline">
                        <Link href="/tasks">View tasks</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/projects">
                            <Plus className="h-4 w-4" />
                            New project
                        </Link>
                    </Button>
                </div>
            </div>

            <section className="grid gap-4 lg:grid-cols-4">
                {summaryCards.map((item) => (
                    <div key={item.label} className="panel p-5">
                        <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                        <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{item.value}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                    </div>
                ))}
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
                <section className="panel overflow-hidden">
                    <div className="flex flex-col gap-4 border-b border-border px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-primary" />
                                <h2 className="text-base font-semibold text-foreground">Open tasks</h2>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                The next open tasks, sorted by priority and deadline.
                            </p>
                        </div>

                        <div className="relative w-full sm:w-80">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" />
                            <Input
                                ref={searchRef}
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search tasks"
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-[minmax(0,1.6fr)_160px_120px_100px_40px] gap-3 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <span>Task</span>
                        <span>Project</span>
                        <span>Due</span>
                        <span>Priority</span>
                        <span></span>
                    </div>

                    <div>
                        {filteredTasks.length === 0 ? (
                            <div className="px-5 py-10 text-sm text-muted-foreground">
                                No tasks match this search.
                            </div>
                        ) : (
                            filteredTasks.map((task) => (
                                <Link
                                    key={task.id}
                                    href={`/projects/${task.project_id}`}
                                    className="grid grid-cols-[minmax(0,1.6fr)_160px_120px_100px_40px] gap-3 border-b border-border px-5 py-4 transition-colors hover:bg-secondary/60"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-start gap-2">
                                            {task.priority === 3 ? (
                                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
                                            ) : task.projectStatus === 'done' ? (
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                                            ) : (
                                                <CircleSlash className="mt-0.5 h-4 w-4 shrink-0 text-foreground/30" />
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    {task.description || 'No description'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-foreground/80">{task.projectTitle}</div>
                                    <div>
                                        <p className="text-sm text-foreground">{formatShortDate(task.projectDueDate)}</p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">{getRelativeDueLabel(task.projectDueDate)}</p>
                                    </div>
                                    <div className="text-sm text-foreground/80">{getPriorityLabel(task.priority)}</div>
                                    <div className="flex items-center justify-end text-foreground/30">
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </section>

                <div className="space-y-5">
                    <section className="panel p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">Upcoming deadlines</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Projects due within the next 7 days.
                                </p>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/projects">View all</Link>
                            </Button>
                        </div>

                        <div className="mt-4 space-y-3">
                            {atRiskProjects.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No projects are close to their due date.</p>
                            ) : (
                                atRiskProjects.map((project) => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className="block rounded-lg border border-border bg-secondary/35 px-4 py-3 transition-colors hover:bg-secondary"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-foreground">{project.title}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {formatProjectStatus(project.status)}
                                                </p>
                                            </div>
                                            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                                {getRelativeDueLabel(project.due_date)}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="panel p-5">
                        <h2 className="text-base font-semibold text-foreground">Recent projects</h2>
                        <div className="mt-4 space-y-2">
                            {recentProjects.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No projects yet.</p>
                            ) : (
                                recentProjects.map((project) => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-secondary"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{project.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Created {formatShortDate(project.created_at)}
                                            </p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-foreground/30" />
                                    </Link>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
