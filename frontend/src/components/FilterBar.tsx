"use client";

import React from "react";
import { ChevronDown, LayoutGrid, List } from "lucide-react";

export default function FilterBar() {
    return (
        <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm font-medium">Filters:</span>
                <button className="bg-[#1e293b] border border-gray-700 text-gray-300 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors">
                    Priority
                    <ChevronDown className="w-4 h-4" />
                </button>
                <button className="bg-[#1e293b] border border-gray-700 text-gray-300 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors">
                    Due Date
                    <ChevronDown className="w-4 h-4" />
                </button>
                <button className="bg-[#1e293b] border border-gray-700 text-gray-300 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors">
                    Assignee
                    <ChevronDown className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center gap-2 bg-[#1e293b] p-1 rounded-md border border-gray-700">
                <button className="p-1.5 bg-gray-700 text-white rounded shadow-sm">
                    <LayoutGrid className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
                    <List className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
