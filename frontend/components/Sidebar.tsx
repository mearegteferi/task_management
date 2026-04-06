'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    FolderKanban,
    House,
    ListTodo,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Button } from './ui/button';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: House },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Tasks', href: '/tasks', icon: ListTodo },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
    isMobileOpen: boolean;
    onMobileClose: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
    const pathname = usePathname();
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navContent = (
        <>
            <div className="flex h-16 items-center border-b border-border px-5">
                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <FolderKanban className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">Sofi Task</p>
                            <p className="text-xs text-muted-foreground">Workspace</p>
                        </div>
                    </div>
                )}

                <div className="ml-auto flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsCollapsed((current) => !current)}
                        className={cn('hidden h-8 w-8 rounded-lg lg:inline-flex', isCollapsed && 'mx-auto')}
                    >
                        {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMobileClose}
                        className="h-8 w-8 rounded-lg lg:hidden"
                    >
                        <X size={16} />
                    </Button>
                </div>
            </div>

            <nav className="mt-4 flex flex-col gap-1 px-3">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onMobileClose}
                            className={cn(
                                'relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors',
                                isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-foreground/70 hover:bg-secondary hover:text-foreground',
                                isCollapsed && 'lg:justify-center lg:px-0'
                            )}
                        >
                            <item.icon
                                size={20}
                                className={cn(isActive ? 'text-primary' : 'text-foreground/50')}
                            />
                            {!isCollapsed && <span>{item.name}</span>}
                            {isActive && !isCollapsed && (
                                <motion.div
                                    layoutId="active-nav"
                                    className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto w-full px-3 pb-6 pt-4">
                <Button
                    variant="outline"
                    className={cn(
                        'w-full justify-start gap-3 text-foreground/70 hover:bg-secondary hover:text-foreground',
                        isCollapsed && 'lg:justify-center lg:px-0'
                    )}
                    onClick={() => {
                        clearAuth();
                        window.location.href = '/login';
                    }}
                >
                    <LogOut size={18} />
                    {!isCollapsed && <span>Log out</span>}
                </Button>
            </div>
        </>
    );

    return (
        <>
            <aside
                className={cn(
                    'relative hidden h-screen border-r border-border bg-[var(--surface-1)] shadow-[8px_0_30px_color-mix(in_oklab,var(--foreground)_10%,transparent)] transition-all duration-300 lg:flex lg:flex-col',
                    isCollapsed ? 'lg:w-20' : 'lg:w-72'
                )}
            >
                {navContent}
            </aside>

            {isMobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/45"
                        onClick={onMobileClose}
                        aria-label="Close navigation"
                    />
                    <aside className="relative flex h-full w-[280px] flex-col border-r border-border bg-[var(--surface-1)] shadow-2xl">
                        {navContent}
                    </aside>
                </div>
            )}
        </>
    );
}
