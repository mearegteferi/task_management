"use client";

import React from "react";
import { Task } from "@/types";
import { Calendar, Clock, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
    task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
    const priorityColors = {
        1: "bg-blue-900/40 text-blue-300 border-blue-800", // Low
        2: "bg-orange-900/40 text-orange-300 border-orange-800", // Medium
        3: "bg-red-900/40 text-red-300 border-red-800", // High
    };

    const priorityLabels = {
        1: "Low Priority",
        2: "Medium Priority",
        3: "High Priority",
    };

    return (
        <div className="bg-[#1e293b] p-4 rounded-lg border border-gray-700 shadow-sm hover:border-gray-600 transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-3">
                <span
                    className={cn(
                        "text-xs px-2 py-1 rounded border font-medium",
                        priorityColors[task.priority as keyof typeof priorityColors] ||
                        "bg-gray-800 text-gray-400 border-gray-700"
                    )}
                >
                    {priorityLabels[task.priority as keyof typeof priorityLabels] || "No Priority"}
                </span>
                <button className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            <h4 className="text-white font-medium mb-1">{task.title}</h4>
            {task.description && (
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {task.description}
                </p>
            )}

            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                        {task.due_date
                            ? new Date(task.due_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            })
                            : "No date"}
                    </span>
                </div>

                {/* Placeholder for Assignee Avatar */}
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold border border-[#1e293b]">
                    ?
                </div>
            </div>
        </div>
    );
}
