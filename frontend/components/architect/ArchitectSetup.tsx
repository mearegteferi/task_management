'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ArchitectSetupProps {
    title: string;
    description: string;
    goals: string;
    constraints: string;
    additionalContext: string;
    isLoading: boolean;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onGoalsChange: (value: string) => void;
    onConstraintsChange: (value: string) => void;
    onAdditionalContextChange: (value: string) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function ArchitectSetup({
    title,
    description,
    goals,
    constraints,
    additionalContext,
    isLoading,
    onTitleChange,
    onDescriptionChange,
    onGoalsChange,
    onConstraintsChange,
    onAdditionalContextChange,
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
                            rows={7}
                            className="min-h-40 w-full rounded-lg border border-input bg-input px-3 py-2 text-sm shadow-sm"
                        />
                    </div>

                    <div className="grid gap-5 xl:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="architect-goals">Goals</Label>
                            <textarea
                                id="architect-goals"
                                value={goals}
                                onChange={(event) => onGoalsChange(event.target.value)}
                                placeholder="One goal per line&#10;Improve visibility for managers&#10;Reduce planning overhead"
                                rows={6}
                                className="min-h-32 w-full rounded-lg border border-input bg-input px-3 py-2 text-sm shadow-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                These are treated as strong requirements in the draft prompt.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="architect-constraints">Constraints</Label>
                            <textarea
                                id="architect-constraints"
                                value={constraints}
                                onChange={(event) => onConstraintsChange(event.target.value)}
                                placeholder="One constraint per line&#10;Use the existing API&#10;Keep scope small for MVP"
                                rows={6}
                                className="min-h-32 w-full rounded-lg border border-input bg-input px-3 py-2 text-sm shadow-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Add boundaries, deadlines, or implementation limits.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="architect-context">Additional context</Label>
                        <textarea
                            id="architect-context"
                            value={additionalContext}
                            onChange={(event) => onAdditionalContextChange(event.target.value)}
                            placeholder="Optional team, delivery, or product context that should shape the plan."
                            rows={4}
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
