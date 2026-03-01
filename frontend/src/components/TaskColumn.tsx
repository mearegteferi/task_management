"use client";

import React from "react";
import { Plus } from "lucide-react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Task } from "@/types";
import TaskCard from "./TaskCard";

interface TaskColumnProps {
    id: string; // "todo", "in_progress", "done"
    title: string;
    count: number;
    color: string;
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

export default function TaskColumn({ id, title, count, color, tasks, onTaskClick }: TaskColumnProps) {
    const { setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <div className="min-w-[350px] flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${color}`} />
                    <h3 className="font-semibold text-gray-100 text-base">{title}</h3>
                    <span className="bg-[#1e293b] text-gray-400 px-2 py-0.5 rounded-full text-xs font-medium border border-gray-700">{count}</span>
                </div>
                <button className="text-gray-500 hover:text-white transition-colors">
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div ref={setNodeRef} className="flex-1 bg-[#0f172a]/50 rounded-xl p-2 space-y-3 overflow-y-auto min-h-[150px]">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onClick={onTaskClick} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}
