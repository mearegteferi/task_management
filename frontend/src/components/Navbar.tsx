"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Search, Plus, Bell, LogOut } from "lucide-react";

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="h-16 border-b border-gray-800 bg-[#1e293b] flex items-center justify-between px-6">
            <div className="flex items-center gap-12">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-5 h-5 text-white"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <span className="font-bold text-lg tracking-tight">Task Management</span>
                </div>

                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        className="w-full bg-[#0f172a] border border-gray-700 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-200 placeholder-gray-500"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4" />
                    New Task
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
                    <button className="text-gray-400 hover:text-white transition-colors">
                        <Bell className="w-5 h-5" />
                    </button>

                    <div className="relative group">
                        <button className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-rose-400 flex items-center justify-center text-white font-medium text-sm overflow-hidden">
                            {user?.full_name ? user.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
                        </button>
                        {/* Simple Dropdown for Logout */}
                        <div className="absolute right-0 mt-2 w-48 bg-[#1e293b] border border-gray-700 rounded-md shadow-lg py-1 hidden group-hover:block z-50">
                            <div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-700 break-words">
                                {user?.email}
                            </div>
                            <button
                                onClick={logout}
                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
