'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Briefcase,
    CheckSquare,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import { motion } from 'framer-motion';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: Briefcase },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside className={cn(
            "relative h-screen border-r border-border/50 bg-background transition-all duration-300",
            isCollapsed ? "w-20" : "w-72"
        )}>
            <div className="flex h-16 items-center px-6 border-b border-border/50">
                {!isCollapsed && (
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
                            <CheckSquare className="text-white h-5 w-5" />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-foreground drop-shadow-sm">SOFI<span className="text-primary italic">TASK</span></span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(
                        "h-8 w-8 rounded-full border border-border/50 bg-background/50 hover:bg-primary/10 transition-all",
                        isCollapsed ? "mx-auto" : "ml-auto"
                    )}
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </Button>
            </div>

            <nav className="flex flex-col gap-1.5 p-4 mt-4">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all relative group",
                                isActive
                                    ? "text-primary bg-primary/10 shadow-[inset_0_0_0_1px_rgba(var(--primary),0.2)]"
                                    : "text-foreground/50 hover:text-foreground hover:bg-secondary/50",
                                isCollapsed && "justify-center px-0"
                            )}
                        >
                            <item.icon size={20} className={cn(
                                "transition-transform group-hover:scale-110",
                                isActive ? "text-primary" : "text-foreground/40 group-hover:text-foreground"
                            )} />
                            {!isCollapsed && <span>{item.name}</span>}
                            {isActive && !isCollapsed && (
                                <motion.div
                                    layoutId="active-nav"
                                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="absolute bottom-6 w-full px-4">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start gap-3 text-foreground/50 hover:bg-red-500/10 hover:text-red-500 rounded-xl px-4 font-bold transition-all",
                        isCollapsed && "justify-center px-0"
                    )}
                    onClick={() => {
                        clearAuth();
                        window.location.href = '/login';
                    }}
                >
                    <LogOut size={20} />
                    {!isCollapsed && <span>Logout</span>}
                </Button>
            </div>
        </aside>
    );
}
