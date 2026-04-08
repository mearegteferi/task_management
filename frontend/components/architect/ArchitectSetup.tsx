'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ArchitectSetupProps {
    title: string;
    description: string;
    isLoading: boolean;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function ArchitectSetup({
    title,
    description,
    isLoading,
    onTitleChange,
    onDescriptionChange,
    onSubmit,
}: ArchitectSetupProps) {
    return (
        <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_280px]">
            <section className="panel p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground">Project details</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Start with the same information you would use when creating a project manually.
                    </p>
                </div>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="architect-title">Title</Label>
                        <Input
                            id="architect-title"
                            value={title}
                            onChange={(event) => onTitleChange(event.target.value)}
                            placeholder="Website redesign"
                            minLength={3}
                            maxLength={200}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="architect-description">Description</Label>
                        <textarea
                            id="architect-description"
                            value={description}
                            onChange={(event) => onDescriptionChange(event.target.value)}
                            placeholder="Describe the goal, scope, users, and constraints."
                            rows={10}
                            className="min-h-52 w-full rounded-lg border border-input bg-input px-3 py-2 text-sm shadow-sm"
                        />
                    </div>
                </div>
            </section>

            <section className="panel-muted h-fit p-6">
                <h3 className="text-sm font-semibold text-foreground">What happens next</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>The AI creates a draft project.</li>
                    <li>You review the description and task list.</li>
                    <li>You ask for changes before creating the project.</li>
                </ul>

                <Button
                    type="submit"
                    disabled={isLoading || title.trim().length < 3}
                    className="mt-6 w-full"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Create draft
                </Button>
            </section>
        </form>
    );
}
