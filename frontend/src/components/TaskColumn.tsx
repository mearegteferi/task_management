"use client";

import React from "react";
import { Plus } from "lucide-react";

interface TaskColumnProps {
    title: string;
    count: number;
    color: string;
    children: React.ReactNode;
}

export default function TaskColumn({ title, count, color, children }: TaskColumnProps) {
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

            <div className="flex-1 bg-[#0f172a]/50 rounded-xl p-2 space-y-3 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}
