'use client';

import { useEffect } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

import { Badge } from '@/components/ui/badge';
import { TaskSuggestion } from '@/types/api';

interface ArchitectTaskListProps {
    tasks: TaskSuggestion[];
    pulseKey: number;
}

const priorityLabels = {
    1: { label: 'Low', className: 'bg-[var(--priority-low-bg)] text-[var(--priority-low-fg)]' },
    2: { label: 'Medium', className: 'bg-[var(--priority-medium-bg)] text-[var(--priority-medium-fg)]' },
    3: { label: 'High', className: 'bg-[var(--priority-high-bg)] text-[var(--priority-high-fg)]' },
} as const;

export function ArchitectTaskList({ tasks, pulseKey }: ArchitectTaskListProps) {
    const controls = useAnimationControls();

    useEffect(() => {
        if (!pulseKey) {
            return;
        }

        void controls.start({
            scale: [1, 1.01, 1],
            transition: { duration: 0.35, ease: 'easeInOut' },
        });
    }, [controls, pulseKey]);

    return (
        <motion.section animate={controls} className="panel flex min-h-[420px] flex-col p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Draft tasks</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Review the generated tasks before creating the project.
                    </p>
                </div>
                <Badge variant="outline">{tasks.length}</Badge>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {tasks.map((task, index) => {
                    const priority = priorityLabels[task.estimated_priority as 1 | 2 | 3] ?? priorityLabels[1];

                    return (
                        <motion.div
                            key={`${task.title}-${index}-${pulseKey}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="rounded-lg border border-border bg-secondary/50 p-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-foreground">{task.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {task.description || 'No description yet.'}
                                    </p>
                                </div>
                                <Badge className={priority.className}>{priority.label}</Badge>
                            </div>
                        </motion.div>
                    );
                })}

                {tasks.length === 0 && (
                    <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/35 px-6 text-center text-sm text-muted-foreground">
                        No tasks in this draft yet.
                    </div>
                )}
            </div>
        </motion.section>
    );
}
