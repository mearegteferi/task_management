"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Search, Plus, Bell, LogOut, LayoutDashboard, BarChart2 } from "lucide-react";

interface NavbarProps {
    onSearch?: (query: string) => void;
    onNewTask?: () => void;
}

export default function Navbar({ onSearch, onNewTask }: NavbarProps) {
    const { user, logout } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const profileRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <nav className="h-16 border-b border-gray-800 bg-[#1e293b] flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <LayoutDashboard className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white">TaskFlow</span>
                </Link>

                <div className="flex items-center gap-6">
                    <Link href="/" className="text-gray-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </Link>
                    <Link href="/analytics" className="text-gray-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-2">
                        <BarChart2 className="w-4 h-4" />
                        Analytics
                    </Link>
                </div>

                <div className="relative w-64 hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        onChange={(e) => onSearch?.(e.target.value)}
                        className="w-full bg-[#0f172a] border border-gray-700 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-200 placeholder-gray-500"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={onNewTask}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Task
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
                    <button className="text-gray-400 hover:text-white transition-colors">
                        <Bell className="w-5 h-5" />
                    </button>

                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-rose-400 flex items-center justify-center text-white font-medium text-sm overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1e293b] focus:ring-blue-500"
                        >
                            {user?.full_name ? user.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-[#1e293b] border border-gray-700 rounded-md shadow-lg py-1 z-50 animate-in fade-in zoom-in duration-200">
                                <div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-700 break-words">
                                    {user?.email}
                                </div>
                                <button
                                    onClick={() => {
                                        setIsProfileOpen(false);
                                        logout();
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
