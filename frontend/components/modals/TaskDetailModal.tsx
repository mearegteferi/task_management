'use client';

import { useState, useEffect } from 'react';
import { TaskResponse, CommentResponse, AttachmentResponse } from '@/types/api';
import { taskService } from '@/services/task.service';
import { commentService } from '@/services/comment.service';
import { attachmentService } from '@/services/attachment.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    X,
    MessageSquare,
    Paperclip,
    Send,
    Loader2,
    Download,
    Trash2,
    Clock,
    User as UserIcon,
    FileText,
    Sparkles,
    Zap,
    Tag,
    Share2,
    Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskDetailModalProps {
    task: TaskResponse | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updatedTask: TaskResponse) => void;
    onDelete: (taskId: number) => void;
}

export function TaskDetailModal({ task, isOpen, onClose, onUpdate, onDelete }: TaskDetailModalProps) {
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [attachments, setAttachments] = useState<AttachmentResponse[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    useEffect(() => {
        if (task && isOpen) {
            setEditTitle(task.title);
            fetchDetails();
        }
    }, [task, isOpen]);

    const fetchDetails = async () => {
        if (!task) return;
        setIsLoadingDetails(true);
        try {
            const [commentsData, attachmentsData] = await Promise.all([
                commentService.getComments(task.id),
                attachmentService.getAttachments(task.id)
            ]);
            setComments(commentsData);
            setAttachments(attachmentsData);
        } catch (error) {
            console.error('Failed to fetch task details:', error);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    if (!task) return null;

    const handleUpdateTitle = async () => {
        if (!editTitle.trim() || editTitle === task.title) {
            setIsEditingTitle(false);
            return;
        }
        try {
            const updated = await taskService.updateTask(task.id, { title: editTitle });
            onUpdate(updated);
            setIsEditingTitle(false);
        } catch (error) {
            console.error('Failed to update task title:', error);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsCommenting(true);
        try {
            const added = await commentService.createComment(task.id, { content: newComment });
            setComments([...comments, added]);
            setNewComment('');
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setIsCommenting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const uploaded = await attachmentService.uploadAttachment(task.id, file);
            setAttachments([...attachments, uploaded]);
        } catch (error) {
            console.error('Failed to upload attachment:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteTask = () => {
        if (confirm('Are you sure you want to delete this action stream?')) {
            onDelete(task.id);
            onClose();
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
                        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-4xl h-[85vh] flex flex-col shadow-[0_0_100px_rgba(var(--primary),0.1)] rounded-[3rem] border border-border/50 bg-card/50 backdrop-blur-2xl overflow-hidden"
                    >
                        {/* Header Section */}
                        <div className="p-8 pb-6 flex flex-row items-start justify-between bg-gradient-to-b from-card/50 to-transparent">
                            <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                        <Zap size={20} className="animate-pulse" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black tracking-[0.3em] text-foreground/40 uppercase">Action Stream</span>
                                        <span className="text-[10px] font-black tracking-widest text-primary italic">#{task.id}</span>
                                    </div>
                                </div>

                                {isEditingTitle ? (
                                    <Input
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="text-4xl font-black tracking-tighter h-14 bg-transparent border-none focus-visible:ring-0 p-0 shadow-none"
                                        autoFocus
                                        onBlur={handleUpdateTitle}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
                                    />
                                ) : (
                                    <h2
                                        className="text-4xl font-black tracking-tighter text-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-3 group"
                                        onClick={() => setIsEditingTitle(true)}
                                    >
                                        {task.title}
                                        <Sparkles size={20} className="text-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h2>
                                )}

                                <div className="flex flex-wrap gap-3 items-center">
                                    <Badge className={cn(
                                        "rounded-full px-4 py-1 text-[10px] uppercase font-black tracking-widest border-none shadow-lg shadow-primary/5",
                                        task.is_completed ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary"
                                    )}>
                                        {task.is_completed ? 'SYNCHRONIZED' : 'IN FLOW'}
                                    </Badge>
                                    <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-foreground/40 uppercase px-3 py-1 rounded-full bg-secondary/50 ring-1 ring-border/50">
                                        <Clock size={12} className="text-primary" />
                                        <span>INITIATED {new Date(task.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-secondary/50 border border-border/50 hover:text-primary transition-all">
                                    <Share2 size={20} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleDeleteTask} className="h-12 w-12 rounded-2xl bg-secondary/50 border border-border/50 hover:text-red-500 transition-all">
                                    <Trash2 size={20} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={onClose} className="h-12 w-12 rounded-full border border-border/50 hover:scale-110 active:scale-95 transition-all bg-background shadow-xl">
                                    <X size={24} />
                                </Button>
                            </div>
                        </div>

                        {/* Main Interaction Area */}
                        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row p-8 pt-0 gap-8">
                            {/* Left Panel: Thoughts & Intel */}
                            <div className="flex-1 flex flex-col min-h-0 bg-secondary/20 rounded-[2.5rem] border border-border/50 shadow-inner p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                        <MessageSquare size={18} />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground/80 italic">Neural Discussion</h3>
                                    <Badge className="ml-auto bg-accent/10 text-accent border-none rounded-full px-3">{comments.length}</Badge>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                                    {isLoadingDetails ? (
                                        <div className="flex flex-col items-center justify-center h-full opacity-50 gap-4">
                                            <div className="h-12 w-12 rounded-full border-t-2 border-primary animate-spin" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/50">Syncing Thoughts...</span>
                                        </div>
                                    ) : comments.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-foreground/30 space-y-4">
                                            <div className="h-20 w-20 rounded-[2rem] bg-secondary flex items-center justify-center shadow-inner ring-1 ring-border/50">
                                                <MessageSquare size={40} className="opacity-20 translate-y-2" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Initialize Discussion</p>
                                        </div>
                                    ) : (
                                        comments.map((comment, idx) => (
                                            <motion.div
                                                key={comment.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="flex gap-4 group"
                                            >
                                                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-accent p-[2px] shadow-lg shadow-primary/10 shrink-0">
                                                    <div className="h-full w-full rounded-[14px] bg-card flex items-center justify-center">
                                                        <UserIcon size={16} className="text-primary group-hover:scale-110 transition-transform" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-zinc-800 dark:text-foreground/30 uppercase tracking-widest italic">Aura Member</span>
                                                        <span className="text-[9px] font-black text-foreground/40 uppercase tracking-tighter">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <div className="bg-card/80 border border-border/50 p-4 rounded-[1.5rem] rounded-tl-none text-sm font-medium text-foreground leading-relaxed shadow-sm group-hover:shadow-md transition-shadow">
                                                        {comment.content}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>

                                <form onSubmit={handleAddComment} className="mt-8 relative group">
                                    <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                    <Input
                                        placeholder="Add a new thought..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="pr-14 bg-card/80 border-none shadow-xl rounded-[2rem] h-14 font-medium px-8 relative z-10 focus-visible:ring-1 focus-visible:ring-primary/30"
                                        disabled={isCommenting}
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!newComment.trim() || isCommenting}
                                        className="absolute right-2 top-2 h-10 w-10 rounded-2xl bg-primary shadow-lg shadow-primary/20 hover:scale-[1.05] transition-all p-0 z-20 overflow-hidden"
                                    >
                                        {isCommenting ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} />}
                                    </Button>
                                </form>
                            </div>

                            {/* Right Panel: Assets & Metadata */}
                            <div className="w-full lg:w-80 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Tag size={16} className="text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Identifiers</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {task.tags.map(tag => (
                                            <Badge key={tag.id} className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 transition-colors font-black tracking-widest text-[9px] uppercase px-3 py-1 rounded-xl">
                                                #{tag.name}
                                            </Badge>
                                        ))}
                                        <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest border border-dashed rounded-xl hover:bg-primary/5">
                                            <Plus size={10} className="mr-1" /> Add Identifier
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-border/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Paperclip size={16} className="text-secondary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Asset Vault</span>
                                        <Badge className="ml-auto bg-secondary text-foreground/50 border-none rounded-full px-2">{attachments.length}</Badge>
                                    </div>
                                    <div className="space-y-2">
                                        {attachments.map(att => (
                                            <motion.div
                                                key={att.id}
                                                whileHover={{ x: 5 }}
                                                className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-border/30 bg-card/30 group transition-all hover:bg-secondary hover:shadow-md"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center text-foreground/40 group-hover:text-primary transition-colors">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-bold truncate text-foreground/80">{att.filename}</span>
                                                        <span className="text-[8px] font-black uppercase text-foreground/40">Resource Asset</span>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={attachmentService.getDownloadUrl(att.id)}
                                                    target="_blank"
                                                    className="h-8 w-8 rounded-xl flex items-center justify-center text-foreground/40 hover:bg-primary/10 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Download size={16} />
                                                </Link>
                                            </motion.div>
                                        ))}
                                        <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all group mt-2 bg-secondary/20">
                                            {isUploading ? (
                                                <Loader2 size={24} className="animate-spin text-primary" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-[1.2rem] bg-background dark:bg-zinc-900 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                                    <Plus size={20} className="text-primary" />
                                                </div>
                                            )}
                                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50 group-hover:text-primary transition-all">Upload Asset</span>
                                            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                                        </label>
                                    </div>
                                </div>

                                <div className="p-5 rounded-[2rem] bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 mt-4 relative overflow-hidden group">
                                    <Sparkles size={40} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Aura Health</h4>
                                    <p className="text-[11px] font-bold text-foreground/50 leading-tight">This action stream is highly optimized. Maintain the flow.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
