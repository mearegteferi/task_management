'use client';

import { startTransition, useEffect, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Bot, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { ArchitectActions } from '@/components/architect/ArchitectActions';
import { ArchitectRefinement } from '@/components/architect/ArchitectRefinement';
import { ArchitectSetup } from '@/components/architect/ArchitectSetup';
import { Button } from '@/components/ui/button';
import { architectService } from '@/services/architect';
import { ArchitectChatMessage, ProjectBreakdown } from '@/types/api';

type ArchitectStep = 'setup' | 'refinement';

interface ArchitectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function getArchitectErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (typeof detail === 'string' && detail.trim()) {
            return detail;
        }
    }

    return fallback;
}

function createMessage(
    role: ArchitectChatMessage['role'],
    content: string
): ArchitectChatMessage {
    return {
        id: `${role}-${crypto.randomUUID()}`,
        role,
        content,
        timestamp: new Date().toISOString(),
    };
}

function summarizeDraft(
    breakdown: ProjectBreakdown,
    mode: 'initial' | 'update'
): string {
    if (mode === 'initial') {
        return `Draft created with ${breakdown.tasks.length} task${breakdown.tasks.length === 1 ? '' : 's'}. Review it and ask for any changes you want.`;
    }

    return `Draft updated. It now includes ${breakdown.tasks.length} task${breakdown.tasks.length === 1 ? '' : 's'}.`;
}

export function ArchitectModal({ isOpen, onClose }: ArchitectModalProps) {
    const router = useRouter();

    const [step, setStep] = useState<ArchitectStep>('setup');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [breakdown, setBreakdown] = useState<ProjectBreakdown | null>(null);
    const [messages, setMessages] = useState<ArchitectChatMessage[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [isChatting, setIsChatting] = useState(false);
    const [isLaunching, setIsLaunching] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    const resetState = () => {
        setStep('setup');
        setSessionId(null);
        setBreakdown(null);
        setMessages([]);
        setTitle('');
        setDescription('');
        setChatInput('');
        setError(null);
        setIsStarting(false);
        setIsChatting(false);
        setIsLaunching(false);
    };

    const handleAbort = () => {
        resetState();
        onClose();
    };

    const handleStart = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (title.trim().length < 3) {
            return;
        }

        setIsStarting(true);
        setError(null);

        try {
            const response = await architectService.suggest(
                title.trim(),
                description.trim()
            );

            setSessionId(response.session_id);
            setBreakdown(response.draft);
            setMessages([
                createMessage(
                    'user',
                    `Create a project draft for "${title.trim()}". ${description.trim() || 'No description provided.'}`
                ),
                createMessage('assistant', summarizeDraft(response.draft, 'initial')),
            ]);
            setStep('refinement');
        } catch (caughtError) {
            setError(
                getArchitectErrorMessage(
                    caughtError,
                    'The draft could not be created right now.'
                )
            );
            console.error('Failed to generate architect draft:', caughtError);
        } finally {
            setIsStarting(false);
        }
    };

    const handleChat = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!sessionId || !chatInput.trim()) {
            return;
        }

        const feedback = chatInput.trim();
        const userMessage = createMessage('user', feedback);

        setChatInput('');
        setIsChatting(true);
        setError(null);
        setMessages((current) => [...current, userMessage]);

        try {
            const response = await architectService.chat(sessionId, feedback);
            setBreakdown(response.draft);
            setMessages((current) => [
                ...current,
                createMessage('assistant', summarizeDraft(response.draft, 'update')),
            ]);
        } catch (caughtError) {
            setMessages((current) => [
                ...current,
                createMessage('assistant', 'The draft could not be updated. Please try again.'),
            ]);
            setError(
                getArchitectErrorMessage(
                    caughtError,
                    'The draft could not be updated.'
                )
            );
            console.error('Failed to refine architect draft:', caughtError);
        } finally {
            setIsChatting(false);
        }
    };

    const handleLaunch = async () => {
        if (!sessionId) {
            return;
        }

        setIsLaunching(true);
        setError(null);

        try {
            const response = await architectService.confirm(sessionId);
            resetState();
            onClose();
            startTransition(() => {
                router.push(`/projects/${response.project.id}`);
            });
        } catch (caughtError) {
            setError(
                getArchitectErrorMessage(
                    caughtError,
                    'The project could not be created from this draft.'
                )
            );
            console.error('Failed to confirm architect draft:', caughtError);
        } finally {
            setIsLaunching(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/45"
                    onClick={handleAbort}
                />

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18 }}
                    className="relative flex h-[min(880px,94vh)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
                >
                    <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm font-medium text-primary">
                                <Bot className="h-4 w-4" />
                                AI architect
                            </div>
                            <h2 className="text-2xl font-semibold text-foreground">
                                {step === 'setup' ? 'Create project draft' : 'Review project draft'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {step === 'setup'
                                    ? 'Enter the project title and description to generate a draft.'
                                    : 'Review the title, description, and tasks. Ask for changes before creating the project.'}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                                {step === 'setup' ? 'Step 1 of 2' : 'Step 2 of 2'}
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleAbort}
                                className="rounded-lg"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="mx-6 mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200">
                            <AlertCircle className="mt-0.5 h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex-1 overflow-hidden px-6 py-5">
                        <AnimatePresence mode="wait">
                            {step === 'setup' ? (
                                <motion.div
                                    key="setup"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.16 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <ArchitectSetup
                                        title={title}
                                        description={description}
                                        isLoading={isStarting}
                                        onTitleChange={setTitle}
                                        onDescriptionChange={setDescription}
                                        onSubmit={handleStart}
                                    />
                                </motion.div>
                            ) : breakdown ? (
                                <motion.div
                                    key="refinement"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.16 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <ArchitectRefinement
                                        breakdown={breakdown}
                                        messages={messages}
                                        chatInput={chatInput}
                                        isChatting={isChatting}
                                        taskPulseKey={messages.length}
                                        onChatInputChange={setChatInput}
                                        onChatSubmit={handleChat}
                                    />
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>

                    <ArchitectActions
                        canLaunch={step === 'refinement' && Boolean(sessionId)}
                        isLaunching={isLaunching}
                        onAbort={handleAbort}
                        onLaunch={handleLaunch}
                    />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
