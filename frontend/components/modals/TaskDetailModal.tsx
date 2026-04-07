'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    Download,
    Loader2,
    MessageSquare,
    Paperclip,
    Send,
    Trash2,
    X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { AttachmentResponse, CommentResponse, TaskResponse } from '@/types/api';
import { attachmentService } from '@/services/attachment.service';
import { commentService } from '@/services/comment.service';
import { taskService } from '@/services/task.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TaskDetailModalProps {
    task: TaskResponse | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updatedTask: TaskResponse) => void;
    onDelete: (taskId: number) => void;
}

export function TaskDetailModal({
    task,
    isOpen,
    onClose,
    onUpdate,
    onDelete,
}: TaskDetailModalProps) {
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [attachments, setAttachments] = useState<AttachmentResponse[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState('');

    const fetchDetails = useCallback(async () => {
        if (!task) {
            return;
        }

        setIsLoadingDetails(true);
        try {
            const [commentsData, attachmentsData] = await Promise.all([
                commentService.getComments(task.id),
                attachmentService.getAttachments(task.id),
            ]);
            setComments(commentsData);
            setAttachments(attachmentsData);
        } catch (error) {
            console.error('Failed to fetch task details:', error);
        } finally {
            setIsLoadingDetails(false);
        }
    }, [task]);

    useEffect(() => {
        if (task && isOpen) {
            setEditTitle(task.title);
            void fetchDetails();
        }
    }, [fetchDetails, isOpen, task]);

    if (!task) {
        return null;
    }

    const handleUpdateTitle = async () => {
        if (!editTitle.trim() || editTitle === task.title) {
            return;
        }

        try {
            const updated = await taskService.updateTask(task.id, { title: editTitle.trim() });
            onUpdate(updated);
        } catch (error) {
            console.error('Failed to update task title:', error);
        }
    };

    const handleAddComment = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!newComment.trim()) {
            return;
        }

        setIsCommenting(true);
        try {
            const added = await commentService.createComment(task.id, { content: newComment.trim() });
            setComments((current) => [...current, added]);
            setNewComment('');
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setIsCommenting(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setIsUploading(true);
        try {
            const uploaded = await attachmentService.uploadAttachment(task.id, file);
            setAttachments((current) => [...current, uploaded]);
        } catch (error) {
            console.error('Failed to upload attachment:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteTask = () => {
        if (!confirm('Delete this task?')) {
            return;
        }

        onDelete(task.id);
        onClose();
    };

    const handleDownloadAttachment = async (attachment: AttachmentResponse) => {
        setDownloadingAttachmentId(attachment.id);
        try {
            const { blob, filename } = await attachmentService.downloadAttachment(attachment.id);
            const objectUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = filename || attachment.filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(objectUrl);
        } catch (error) {
            console.error('Failed to download attachment:', error);
        } finally {
            setDownloadingAttachmentId(null);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/45"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="relative flex h-[min(860px,92vh)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
                            <div className="min-w-0 flex-1">
                                <div className="mb-3 flex items-center gap-3">
                                    <Badge variant="outline">Task #{task.id}</Badge>
                                    <Badge
                                        className={
                                            task.is_completed
                                                ? 'bg-[var(--status-done-bg)] text-[var(--status-done-fg)]'
                                                : 'bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)]'
                                        }
                                    >
                                        {task.is_completed ? 'Done' : 'In progress'}
                                    </Badge>
                                </div>
                                <Input
                                    value={editTitle}
                                    onChange={(event) => setEditTitle(event.target.value)}
                                    onBlur={() => void handleUpdateTitle()}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            void handleUpdateTitle();
                                        }
                                    }}
                                    className="h-11 border-0 bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
                                />
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Created {new Date(task.created_at).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={handleDeleteTask}>
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={onClose}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid flex-1 gap-5 overflow-hidden px-6 py-5 lg:grid-cols-[minmax(0,1.2fr)_320px]">
                            <section className="panel flex min-h-0 flex-col p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                    <h3 className="text-sm font-semibold text-foreground">Comments</h3>
                                </div>

                                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                                    {isLoadingDetails ? (
                                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Loading comments
                                        </div>
                                    ) : comments.length === 0 ? (
                                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                            No comments yet.
                                        </div>
                                    ) : (
                                        comments.map((comment) => (
                                            <div key={comment.id} className="rounded-lg border border-border bg-secondary/40 p-4">
                                                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                                                    <span>Comment</span>
                                                    <span>
                                                        {new Date(comment.created_at).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm text-foreground">{comment.content}</p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <form onSubmit={handleAddComment} className="mt-4 flex gap-3">
                                    <Input
                                        placeholder="Add a comment"
                                        value={newComment}
                                        onChange={(event) => setNewComment(event.target.value)}
                                        disabled={isCommenting}
                                    />
                                    <Button type="submit" disabled={!newComment.trim() || isCommenting}>
                                        {isCommenting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                        Send
                                    </Button>
                                </form>
                            </section>

                            <div className="space-y-5">
                                <section className="panel p-5">
                                    <h3 className="text-sm font-semibold text-foreground">Tags</h3>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {task.tags.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No tags</p>
                                        ) : (
                                            task.tags.map((tag) => (
                                                <Badge key={tag.id} variant="outline">
                                                    {tag.name}
                                                </Badge>
                                            ))
                                        )}
                                    </div>
                                </section>

                                <section className="panel p-5">
                                    <div className="mb-4 flex items-center gap-2">
                                        <Paperclip className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-semibold text-foreground">Attachments</h3>
                                    </div>

                                    <div className="space-y-3">
                                        {attachments.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No attachments</p>
                                        ) : (
                                            attachments.map((attachment) => (
                                                <div
                                                    key={attachment.id}
                                                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm text-foreground">
                                                            {attachment.filename}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => void handleDownloadAttachment(attachment)}
                                                        disabled={downloadingAttachmentId === attachment.id}
                                                    >
                                                        {downloadingAttachmentId === attachment.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Download className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            ))
                                        )}

                                        <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-6 text-sm text-muted-foreground hover:bg-secondary">
                                            {isUploading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Upload attachment'
                                            )}
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                                disabled={isUploading}
                                            />
                                        </label>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
