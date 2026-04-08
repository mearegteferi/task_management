'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ArchitectActionsProps {
    canLaunch: boolean;
    isLaunching: boolean;
    onAbort: () => void;
    onLaunch: () => void;
}

export function ArchitectActions({
    canLaunch,
    isLaunching,
    onAbort,
    onLaunch,
}: ArchitectActionsProps) {
    return (
        <div className="flex flex-col gap-3 border-t border-border bg-card px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
                Close to cancel, or create the project from the current draft.
            </p>
            <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onAbort}>
                    Close
                </Button>
                <Button type="button" onClick={onLaunch} disabled={!canLaunch || isLaunching}>
                    {isLaunching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Create project
                </Button>
            </div>
        </div>
    );
}
