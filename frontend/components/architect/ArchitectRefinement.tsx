'use client';

import { ArchitectChat } from '@/components/architect/ArchitectChat';
import { ArchitectTaskList } from '@/components/architect/ArchitectTaskList';
import { ProjectBreakdown, ArchitectChatMessage } from '@/types/api';

interface ArchitectRefinementProps {
    breakdown: ProjectBreakdown;
    messages: ArchitectChatMessage[];
    chatInput: string;
    isChatting: boolean;
    taskPulseKey: number;
    onChatInputChange: (value: string) => void;
    onChatSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function ArchitectRefinement({
    breakdown,
    messages,
    chatInput,
    isChatting,
    taskPulseKey,
    onChatInputChange,
    onChatSubmit,
}: ArchitectRefinementProps) {
    return (
        <div className="space-y-5">
            <section className="panel p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-foreground">{breakdown.title}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {breakdown.description || 'No description in the draft yet.'}
                        </p>
                    </div>
                    <div className="rounded-lg bg-secondary px-4 py-3 text-sm text-foreground">
                        {breakdown.tasks.length} task{breakdown.tasks.length === 1 ? '' : 's'}
                    </div>
                </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <ArchitectChat
                    messages={messages}
                    value={chatInput}
                    isSending={isChatting}
                    onValueChange={onChatInputChange}
                    onSubmit={onChatSubmit}
                />
                <ArchitectTaskList tasks={breakdown.tasks} pulseKey={taskPulseKey} />
            </div>
        </div>
    );
}
