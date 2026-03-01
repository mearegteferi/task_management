"use client";

import React, { useState, Fragment, useEffect } from "react";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { Task, Subtask, Comment, Attachment } from "@/types";
import { X, CheckSquare, MessageSquare, Paperclip, Calendar, Flag, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskModalProps {
    isOpen: boolean;
    closeModal: () => void;
    task: Task | null;
    onUpdate: () => void;
}

export default function TaskModal({ isOpen, closeModal, task, onUpdate }: TaskModalProps) {
    const [activeTask, setActiveTask] = useState<Task | null>(task);
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [newCommentContent, setNewCommentContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState(1);
    const [status, setStatus] = useState<Task["status"]>("todo");

    useEffect(() => {
        if (task) {
            setActiveTask(task);
            setTitle(task.title);
            setDescription(task.description || "");
            setPriority(task.priority || 1);
            setStatus(task.status);
            fetchDetails(task.id);
        }
    }, [task]);

    const handleSaveTask = async () => {
        if (!activeTask) return;
        try {
            const res = await api.patch<Task>(`/api/v1/tasks/${activeTask.id}`, {
                title,
                description,
                priority,
                status,
            });
            setActiveTask(res.data);
            setIsEditing(false);
            onUpdate();
        } catch (error) {
            console.error("Failed to update task", error);
        }
    };

    const fetchDetails = async (taskId: number) => {
        try {
            // Fetch subtasks
            try {
                const subtasksRes = await api.get<Subtask[]>(`/api/v1/tasks/${taskId}/subtasks/`);
                setSubtasks(subtasksRes.data);
            } catch (e) {
                console.error("Failed to fetch subtasks", e);
            }

            // Fetch comments
            try {
                const commentsRes = await api.get<Comment[]>(`/api/v1/tasks/${taskId}/comments/`);
                setComments(commentsRes.data);
            } catch (e) {
                console.error("Failed to fetch comments", e);
            }

            // Fetch attachments
            try {
                const attachmentsRes = await api.get<Attachment[]>(`/api/v1/tasks/${taskId}/attachments/`);
                setAttachments(attachmentsRes.data);
            } catch (e) {
                console.error("Failed to fetch attachments", e);
            }

        } catch (error) {
            console.error("Unexpected error in fetchDetails", error);
        }
    };

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeTask || !newSubtaskTitle.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await api.post(`/api/v1/tasks/${activeTask.id}/subtasks/`, { title: newSubtaskTitle });
            setNewSubtaskTitle("");
            fetchDetails(activeTask.id); // Refresh
            onUpdate();
        } catch (error) {
            console.error("Failed to add subtask", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSubtask = async (subtaskId: number, currentStatus: boolean) => {
        try {
            await api.patch(`/api/v1/tasks/subtasks/${subtaskId}`, { is_completed: !currentStatus });
            if (activeTask) fetchDetails(activeTask.id);
            onUpdate();
        } catch (error) {
            console.error("Failed to toggle subtask", error);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeTask || !newCommentContent.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await api.post(`/api/v1/tasks/${activeTask.id}/comments/`, { content: newCommentContent });
            setNewCommentContent("");
            fetchDetails(activeTask.id);
        } catch (error) {
            console.error("Failed to add comment", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!activeTask || !e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        setIsSubmitting(true);
        try {
            await api.post(`/api/v1/tasks/${activeTask.id}/attachments/`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            fetchDetails(activeTask.id);
        } catch (error) {
            console.error("Failed to upload file", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!activeTask) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeModal}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/70" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#1e293b] p-6 text-left align-middle shadow-xl transition-all border border-gray-700">
                                <div className="flex justify-between items-start mb-6">
                                    {isEditing ? (
                                        <input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="text-xl font-semibold leading-6 text-white bg-transparent border-b border-blue-500 focus:outline-none w-full mr-4"
                                        />
                                    ) : (
                                        <Dialog.Title
                                            as="h3"
                                            className="text-xl font-semibold leading-6 text-white"
                                        >
                                            {activeTask.title}
                                        </Dialog.Title>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                if (isEditing) handleSaveTask();
                                                else setIsEditing(true);
                                            }}
                                            className="text-sm text-blue-400 hover:text-blue-300 px-2 py-1"
                                        >
                                            {isEditing ? "Save" : "Edit"}
                                        </button>
                                        <button onClick={closeModal} className="text-gray-400 hover:text-white">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-4 mb-6 text-sm text-gray-400 items-center">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {activeTask.due_date ? format(new Date(activeTask.due_date), "MMM d, yyyy") : "No due date"}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Flag className="w-4 h-4" />
                                        {isEditing ? (
                                            <select
                                                value={priority}
                                                onChange={(e) => setPriority(Number(e.target.value))}
                                                className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs text-white"
                                            >
                                                <option value={1}>Low</option>
                                                <option value={2}>Medium</option>
                                                <option value={3}>High</option>
                                            </select>
                                        ) : (
                                            <span>{activeTask.priority === 3 ? "High" : activeTask.priority === 2 ? "Medium" : "Low"}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {isEditing ? (
                                            <select
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value as Task["status"])}
                                                className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs text-white"
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="done">Done</option>
                                            </select>
                                        ) : (
                                            <span className="capitalize">{activeTask.status.replace("_", " ")}</span>
                                        )}
                                    </div>
                                </div>

                                <Tab.Group>
                                    <Tab.List className="flex space-x-1 rounded-xl bg-gray-800/50 p-1 mb-6">
                                        <Tab className={({ selected }) =>
                                            cn("w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors focus:outline-none",
                                                selected ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:bg-white/[0.12] hover:text-white")
                                        }>Details</Tab>
                                        <Tab className={({ selected }) =>
                                            cn("w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors focus:outline-none",
                                                selected ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:bg-white/[0.12] hover:text-white")
                                        }>Subtasks ({subtasks.length})</Tab>
                                        <Tab className={({ selected }) =>
                                            cn("w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors focus:outline-none",
                                                selected ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:bg-white/[0.12] hover:text-white")
                                        }>Comments ({comments.length})</Tab>
                                        <Tab className={({ selected }) =>
                                            cn("w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors focus:outline-none",
                                                selected ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:bg-white/[0.12] hover:text-white")
                                        }>Attachments ({attachments.length})</Tab>
                                    </Tab.List>

                                    <Tab.Panels>
                                        <Tab.Panel className="text-gray-300">
                                            {isEditing ? (
                                                <textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    className="w-full h-32 bg-gray-800 border border-gray-700 rounded-md p-3 text-sm text-white focus:outline-none focus:border-blue-500"
                                                    placeholder="Add a description..."
                                                />
                                            ) : (
                                                activeTask.description || "No description provided."
                                            )}
                                        </Tab.Panel>

                                        <Tab.Panel>
                                            <ul className="space-y-3 mb-4">
                                                {subtasks.map(st => (
                                                    <li key={st.id} className="flex items-center gap-3 group">
                                                        <button onClick={() => toggleSubtask(st.id, st.is_completed)} className={cn("w-5 h-5 border rounded flex items-center justify-center transition-colors", st.is_completed ? "bg-blue-500 border-blue-500" : "border-gray-500 hover:border-gray-300")}>
                                                            {st.is_completed && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                                        </button>
                                                        <span className={cn("text-sm", st.is_completed ? "line-through text-gray-500" : "text-gray-200")}>{st.title}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <form onSubmit={handleAddSubtask} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newSubtaskTitle}
                                                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                                    placeholder="Add a subtask..."
                                                    className="flex-1 bg-gray-800 border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                                    disabled={isSubmitting}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm disabled:opacity-50"
                                                >
                                                    Add
                                                </button>
                                            </form>
                                        </Tab.Panel>

                                        <Tab.Panel>
                                            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                                                {comments.map(comment => (
                                                    <div key={comment.id} className="bg-gray-800/50 p-3 rounded-lg">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs font-semibold text-blue-400">User {comment.user_id}</span> {/* Ideal: User Name */}
                                                            <span className="text-xs text-gray-500">{format(new Date(comment.created_at), "MMM d, HH:mm")}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-300">{comment.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <form onSubmit={handleAddComment} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newCommentContent}
                                                    onChange={(e) => setNewCommentContent(e.target.value)}
                                                    placeholder="Write a comment..."
                                                    className="flex-1 bg-gray-800 border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                                    disabled={isSubmitting}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm disabled:opacity-50"
                                                >
                                                    Post
                                                </button>
                                            </form>
                                        </Tab.Panel>
                                        <Tab.Panel>
                                            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                                                {attachments.length === 0 ? (
                                                    <p className="text-sm text-gray-500 italic">No attachments yet.</p>
                                                ) : (
                                                    attachments.map(att => (
                                                        <div key={att.id} className="flex items-center justify-between bg-gray-800/50 p-2 rounded-lg">
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                                <span className="text-sm text-gray-200 truncate">{att.filename}</span>
                                                            </div>
                                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                                                {format(new Date(att.uploaded_at), "MMM d")}
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className={cn("flex-1 cursor-pointer bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2", isSubmitting && "opacity-50 cursor-not-allowed")}>
                                                    <Paperclip className="w-4 h-4" />
                                                    {isSubmitting ? "Uploading..." : "Upload File"}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={handleFileUpload}
                                                        disabled={isSubmitting}
                                                    />
                                                </label>
                                            </div>
                                        </Tab.Panel>
                                    </Tab.Panels>
                                </Tab.Group>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
