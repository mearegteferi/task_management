"use client";

import React from "react";
import { ChevronDown, LayoutGrid, List } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
    onPriorityChange?: (priority: number | null) => void;
    currentPriority?: number | null;
}

export default function FilterBar({ onPriorityChange, currentPriority }: FilterBarProps) {

    // Priority Options
    const priorities = [
        { label: "All Priorities", value: null },
        { label: "High", value: 3 },
        { label: "Medium", value: 2 },
        { label: "Low", value: 1 },
    ];

    return (
        <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm font-medium">Filters:</span>

                <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button className={cn("bg-[#1e293b] border border-gray-700 text-gray-300 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors", currentPriority && "border-blue-500 text-blue-400")}>
                        {currentPriority ? priorities.find(p => p.value === currentPriority)?.label : "Priority"}
                        <ChevronDown className="w-4 h-4" />
                    </Menu.Button>
                    <Transition
                        as={React.Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute left-0 mt-2 w-40 origin-top-left divide-y divide-gray-700 rounded-md bg-[#1e293b] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-30 border border-gray-700">
                            <div className="px-1 py-1">
                                {priorities.map((priority) => (
                                    <Menu.Item key={priority.label}>
                                        {({ active }) => (
                                            <button
                                                className={`${active ? 'bg-blue-600 text-white' : 'text-gray-300'
                                                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                onClick={() => onPriorityChange?.(priority.value)}
                                            >
                                                {priority.label}
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>

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
