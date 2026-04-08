'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { analyticsService } from '@/services/analytics.service';
import { AnalyticsResponse } from '@/types/api';
import { cn } from '@/lib/utils';

function formatStatusLabel(status: string) {
    switch (status) {
        case 'in_progress':
            return 'In progress';
        case 'done':
            return 'Done';
        default:
            return 'To do';
    }
}

function formatDayLabel(date: string) {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(date));
}

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchAnalytics = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
        if (mode === 'refresh') {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            const data = await analyticsService.getAnalytics();
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const averageNewTasksPerDay = useMemo(() => {
        if (!analytics || analytics.recent_task_activity.length === 0) {
            return 0;
        }

        const total = analytics.recent_task_activity.reduce((sum, point) => sum + point.count, 0);
        return Number((total / analytics.recent_task_activity.length).toFixed(1));
    }, [analytics]);

    const maxRecentActivity = useMemo(() => {
        if (!analytics) {
            return 0;
        }

        return Math.max(...analytics.recent_task_activity.map((point) => point.count), 0);
    }, [analytics]);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="page-shell">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Analytics</h1>
                    <p className="text-sm text-muted-foreground">
                        Review project status, recent task activity, and overdue work.
                    </p>
                </div>
                <Button onClick={() => fetchAnalytics('refresh')} disabled={isRefreshing} variant="outline">
                    {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Total projects', value: analytics?.total_projects || 0, note: 'All projects' },
                    { label: 'Active projects', value: analytics?.active_projects || 0, note: 'In progress' },
                    { label: 'Total tasks', value: analytics?.total_tasks || 0, note: 'All tasks' },
                    { label: 'Completion rate', value: `${analytics?.task_completion_rate || 0}%`, note: 'Completed tasks' },
                ].map((item) => (
                    <section key={item.label} className="panel p-5">
                        <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                        <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{item.value}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                    </section>
                ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <section className="panel p-5">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <h2 className="text-base font-semibold text-foreground">Projects by status</h2>
                    </div>
                    <div className="mt-5 space-y-4">
                        {analytics?.projects_by_status.map((stat) => {
                            const percentage = Math.round((stat.count / (analytics.total_projects || 1)) * 100);

                            return (
                                <div key={stat.status} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-foreground">{formatStatusLabel(stat.status)}</span>
                                        <span className="text-muted-foreground">
                                            {stat.count} ({percentage}%)
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                                        <div
                                            className={cn(
                                                'h-full rounded-full',
                                                stat.status === 'done'
                                                    ? 'bg-emerald-500'
                                                    : stat.status === 'in_progress'
                                                        ? 'bg-amber-500'
                                                        : 'bg-primary'
                                            )}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="panel p-5">
                    <h2 className="text-base font-semibold text-foreground">Recent task activity</h2>
                    <div className="mt-5 flex min-h-72 items-end justify-between gap-3 rounded-lg border border-border bg-secondary/35 px-4 py-5">
                        {analytics?.recent_task_activity.map((point) => {
                            const height = maxRecentActivity > 0
                                ? Math.max((point.count / maxRecentActivity) * 100, point.count > 0 ? 14 : 6)
                                : 6;

                            return (
                                <div key={point.date} className="flex flex-1 flex-col items-center gap-3">
                                    <div className="flex h-52 items-end">
                                        <div
                                            className="w-10 rounded-t-lg bg-primary/85"
                                            style={{ height: `${height}%` }}
                                            title={`${point.count} tasks`}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-medium text-foreground">{formatDayLabel(point.date)}</p>
                                        <p className="text-xs text-muted-foreground">{point.count}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <section className="panel p-5">
                    <h2 className="text-base font-semibold text-foreground">Summary</h2>
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg border border-border bg-secondary/35 p-4">
                            <p className="text-sm font-medium text-muted-foreground">Average tasks per project</p>
                            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                                {analytics?.average_tasks_per_project || 0}
                            </p>
                        </div>
                        <div className="rounded-lg border border-border bg-secondary/35 p-4">
                            <p className="text-sm font-medium text-muted-foreground">New tasks per day</p>
                            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                                {averageNewTasksPerDay}
                            </p>
                        </div>
                        <div className="rounded-lg border border-border bg-secondary/35 p-4">
                            <p className="text-sm font-medium text-muted-foreground">Completed tasks</p>
                            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                                {analytics?.completed_tasks || 0}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="panel p-5">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-300" />
                        <div>
                            <h2 className="text-base font-semibold text-foreground">Overdue projects</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {analytics?.overdue_projects
                                    ? `${analytics.overdue_projects} project${analytics.overdue_projects === 1 ? '' : 's'} need attention.`
                                    : 'There are no overdue projects right now.'}
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
