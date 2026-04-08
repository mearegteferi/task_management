'use client';

import { useEffect, useRef } from 'react';
import { Loader2, Send } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ArchitectChatMessage } from '@/types/api';

interface ArchitectChatProps {
    messages: ArchitectChatMessage[];
    value: string;
    isSending: boolean;
    onValueChange: (value: string) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function ArchitectChat({
    messages,
    value,
    isSending,
    onValueChange,
    onSubmit,
}: ArchitectChatProps) {
    const endRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages]);

    return (
        <section className="panel flex min-h-[420px] flex-col p-5">
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">Ask for changes</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Example: add onboarding tasks, reduce scope, or change task priorities.
                </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {messages.map((message) => (
                    <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            'flex',
                            message.role === 'assistant' ? 'justify-start' : 'justify-end'
                        )}
                    >
                        <div
                            className={cn(
                                'max-w-[85%] rounded-lg px-4 py-3 text-sm shadow-sm',
                                message.role === 'assistant'
                                    ? 'border border-border bg-secondary text-foreground'
                                    : 'bg-primary text-primary-foreground'
                            )}
                        >
                            <p>{message.content}</p>
                            <p
                                className={cn(
                                    'mt-2 text-xs',
                                    message.role === 'assistant'
                                        ? 'text-muted-foreground'
                                        : 'text-primary-foreground/80'
                                )}
                            >
                                {new Date(message.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </motion.div>
                ))}

                <div ref={endRef} />
            </div>

            <form onSubmit={onSubmit} className="mt-4 flex gap-3">
                <Input
                    value={value}
                    onChange={(event) => onValueChange(event.target.value)}
                    placeholder="Describe the change you want"
                    disabled={isSending}
                />
                <Button type="submit" disabled={isSending || !value.trim()}>
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Update
                </Button>
            </form>
        </section>
    );
}
